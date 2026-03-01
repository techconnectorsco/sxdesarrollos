# CONTEXTO COMPLETO — SX SoporteXperto

> Sistema de gestión de automatización RPA y proyectos de software para clientes empresariales.
> Stack: **SvelteKit 5 (Runes) + Supabase + Tailwind CSS v4 + Vercel**

---

## TABLA DE CONTENIDOS

1. [Resumen del Sistema](#1-resumen-del-sistema)
2. [Variables de Entorno](#2-variables-de-entorno)
3. [Base de Datos](#3-base-de-datos)
4. [Arquitectura General](#4-arquitectura-general)
5. [Rutas y Páginas](#5-rutas-y-páginas)
6. [Endpoints API](#6-endpoints-api)
7. [Servicios (Server-side)](#7-servicios-server-side)
8. [Componentes](#8-componentes)
9. [Tipos TypeScript](#9-tipos-typescript)
10. [Autenticación y Seguridad](#10-autenticación-y-seguridad)
11. [Helpers de Servidor](#11-helpers-de-servidor)
12. [Features / Módulos](#12-features--módulos)
13. [Configuración del Proyecto](#13-configuración-del-proyecto)
14. [Estado Global (Stores)](#14-estado-global-stores)
15. [Flujos Clave](#15-flujos-clave)
16. [Patrones y Convenciones](#16-patrones-y-convenciones)
17. [Errores Conocidos y Fixes Aplicados](#17-errores-conocidos-y-fixes-aplicados)

---

## 1. RESUMEN DEL SISTEMA

**Nombre:** SX — SoporteXperto
**Dominio:** Oficina de Transformación Digital
**Propósito:** Portal multi-cliente para monitorear automatizaciones RPA, ejecuciones, y proyectos de software.

### Roles de Usuario

| Rol | Detección | Acceso |
|-----|-----------|--------|
| Admin | `perfiles.es_admin = true` OR `user_metadata.es_admin = true` OR email contiene `admin` | Ve todos los datos de todos los clientes |
| Usuario regular | `user_metadata.cliente_id` asignado | Solo ve datos de su `cliente_id` |

### Multi-tenancy

Cada usuario regular está vinculado a un cliente vía `user_metadata.cliente_id` (UUID que referencia `public.clientes.id`). Los admins pueden ver todos.

---

## 2. VARIABLES DE ENTORNO

```env
# Público (disponible en cliente y servidor)
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Solo servidor
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 3. BASE DE DATOS

### Esquema Public (`public.*`)

#### `public.clientes`
```sql
id          UUID PK DEFAULT gen_random_uuid()
nombre      TEXT NOT NULL
slug        TEXT NOT NULL UNIQUE
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```
Datos seed: `samesa`, `vedova`, `ae-logistics`

#### `public.automatizaciones`
```sql
id          UUID PK DEFAULT gen_random_uuid()
cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE
nombre      TEXT NOT NULL
descripcion TEXT
frecuencia  TEXT    -- "Diario", "Cada 12 horas", "Semanal"
tipo        TEXT    -- "RPA", "API", "Script"
esta_activa BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```
Índices: `cliente_id`, `esta_activa`

#### `public.ejecuciones`
```sql
id                UUID PK DEFAULT gen_random_uuid()
automatizacion_id UUID NOT NULL REFERENCES automatizaciones(id) ON DELETE CASCADE
fecha_inicio      TIMESTAMPTZ NOT NULL DEFAULT NOW()
estado            TEXT NOT NULL CHECK (estado IN ('Exitoso', 'Advertencia', 'Error'))
metricas          JSONB    -- { emails_enviados, documentos_procesados, montos_procesados, registros_procesados, ... }
log_salida        TEXT     -- URL pública del PDF en Storage de Supabase
observaciones     TEXT
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```
Índices: `automatizacion_id`, `fecha_inicio DESC`, `estado`, `metricas` (GIN)

#### `public.proyectos_software`
```sql
id           UUID PK DEFAULT gen_random_uuid()
cliente_id   UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE
nombre       TEXT NOT NULL
descripcion  TEXT
url_acceso   TEXT
tecnologias  TEXT[]   -- ['Svelte 5', 'PostgreSQL', 'Mapbox']
tipo         TEXT     -- "Marketplace", "Sistema Interno", "Dashboard"
estado       TEXT     -- "Activo", "Mantenimiento", "Desarrollo", "Inactivo"
created_at   TIMESTAMPTZ DEFAULT NOW()
updated_at   TIMESTAMPTZ DEFAULT NOW()
```

#### `public.perfiles` *(creada fuera del schema SQL principal)*
```sql
id           UUID PK REFERENCES auth.users(id)
es_admin     BOOLEAN DEFAULT false
esta_baneado BOOLEAN DEFAULT false
url_imagen   TEXT     -- URL del avatar del usuario
-- posiblemente más campos
```
Usada por: sistema de auth guard, admin panel, avatar display.

#### Vista `public.admin_estadisticas_usuarios`
Vista usada por el panel de admin usuarios. Contiene: `nombre_completo`, `email`, `es_admin`, `esta_baneado`, `fecha_creacion`.

### RLS Policies

> ⚠️ Las políticas en `supabase-schema.sql` tienen un bug: usan `auth.jwt() ->> 'cliente_id'` (root del JWT) cuando debería ser `auth.jwt() -> 'user_metadata' ->> 'cliente_id'`. Ver `fix-rls-policies.sql` para la corrección.

**Los endpoints API usan `supabaseAdmin` (service role) que bypasea RLS.** La autorización se hace a nivel de aplicación en cada endpoint.

### Triggers

`update_updated_at_column()` se ejecuta `BEFORE UPDATE` en: `clientes`, `automatizaciones`, `ejecuciones`, `proyectos_software`.

---

## 4. ARQUITECTURA GENERAL

### Patrón API-First

```
Browser (Svelte Component)
   │
   │  fetch('/api/...')
   ▼
API Endpoint (+server.ts)          ← Verifica auth + autorización
   │
   │  createServices(supabaseAdmin)
   ▼
Service Class (*.service.ts)       ← Lógica de negocio
   │
   ▼
Supabase PostgreSQL (service role) ← Bypasea RLS
```

### Reglas de arquitectura

| Capa | Responsabilidad | NO debe |
|------|-----------------|---------|
| `+page.svelte` | UI, fetch a `/api/*` | Importar servicios directamente |
| `+page.server.ts` | Solo pasar auth data (session, user, esAdmin, clienteId) | Consultar Supabase para datos de negocio |
| `/api/*/+server.ts` | Auth + autorización + lógica | Renderizar HTML |
| `*.service.ts` | Consultas Supabase | Ser importados en componentes |
| `api.service.ts` | Wrapper de fetch para componentes | Acceso directo a Supabase |

### Datos de autenticación en el cliente

```
+layout.server.ts (root)
  → session, user, perfilNav
  → passthrough a +layout.ts

+layout.ts (root)
  → supabase client (browser)
  → session, user

(app)/+layout.server.ts
  → session, user

dashboard/+page.server.ts
  → clienteId (de user_metadata)
  → esAdmin (de perfiles + user_metadata)
```

---

## 5. RUTAS Y PÁGINAS

### Rutas Públicas

```
/                           → Landing page (hero, stats, servicios)
/auth                       → Login/Register (mode param: login|register)
/auth/login                 → Login dedicado
/auth/reset                 → Reset de contraseña
/auth/verify                → Verificación de email post-registro
/auth/update-password       → Actualizar contraseña con token
/auth/success               → Página de éxito
/auth/error                 → Página de error
/auth/callback              → Callback OAuth de Supabase (manejado por SvelteKit)
```

### Rutas Protegidas `/(app)`

```
/dashboard                  → Dashboard operativo (KPIs, gráficas, bots, ejecuciones)
/apps                       → Lista de aplicaciones/proyectos del cliente
/clientes                   → Gestión de clientes (mock data actualmente)
/bots                       → Centro de control de bots (mock data actualmente)
```

### Rutas de Administración `/(app)/admin`

```
/admin                      → Panel de admin (placeholder)
/admin/usuarios             → Gestión de usuarios con estadísticas
/admin/videos               → Gestión de videos
/admin/teo-ia               → Panel de TEO IA (chat/health/stats/logs)
/admin/consultas            → En desarrollo (placeholder)
/admin/analitica            → Enlace externo a Vercel Analytics
```

### Detalles por Página

#### `/dashboard` — Dashboard Operativo
**Archivo:** `src/routes/(app)/dashboard/+page.svelte`

**Estado reactivo:**
```typescript
let automatizacionesReactive = $state<Automatizacion[]>([]);
let ejecucionesReactive      = $state<Ejecucion[]>([]);
let estadisticas             = $state<any>(null);
let loading                  = $state(true);
let error                    = $state<string | null>(null);
```

**KPIs derivados:**
```typescript
let botsActivos      = $derived(automatizacionesReactive.filter(a => a.esta_activa).length);
let totalEjecuciones = $derived(ejecucionesReactive.length);
let exitosas         = $derived(ejecucionesReactive.filter(e => e.estado === 'Exitoso').length);
let conError         = $derived(ejecucionesReactive.filter(e => e.estado === 'Error').length);
let tasaExito        = $derived(totalEjecuciones > 0 ? Math.round((exitosas / totalEjecuciones) * 10000) / 100 : 0);
```

**Visualizaciones:**
- 4 KPI Cards (botsActivos/total, ejecuciones recientes, tasa éxito %, errores)
- Gráfica SVG custom de barras (ejecuciones últimos 7 días)
- Donut chart SVG (distribución estado de bots)
- Grid de `RobotCard` por automatización
- Feed de `ExecutionCard` para actividad reciente

**Carga de datos (onMount):**
```typescript
const [automatizacionesData, ejecucionesData, estadisticasData] = await Promise.all([
  apiService.getAutomatizaciones(clienteId || undefined),
  apiService.getEjecuciones({ limit: 20 }),
  clienteId ? apiService.getEstadisticas(clienteId) : Promise.resolve(null)
]);
```

**Polling:** Recarga automática cada 30 segundos.

**+page.server.ts:**
```typescript
const perfil = user ? await getUserPerfil(user.id) : null;
return {
  session, user,
  clienteId: user?.user_metadata?.cliente_id || null,
  esAdmin: perfil?.es_admin === true || user?.user_metadata?.es_admin === true || user?.email?.includes('admin')
};
```

#### `/apps` — Aplicaciones del Cliente
**Archivo:** `src/routes/(app)/apps/+page.svelte`

Carga proyectos vía `apiService.getProyectos(clienteId)`. Renderiza `ProjectCard` por cada proyecto.

---

## 6. ENDPOINTS API

Todos los endpoints usan `supabaseAdmin` (service role, bypasea RLS). La autorización es a nivel de aplicación.

### Patrón de autenticación en cada endpoint

```typescript
const { safeGetSession } = locals;
const { session, user } = await safeGetSession();
if (!session || !user) throw error(401, 'No autenticado');

const perfil = await getUserPerfil(user.id);
const clienteId = user.user_metadata?.cliente_id || null;
const esAdmin = perfil?.es_admin === true || user.user_metadata?.es_admin === true || user.email?.includes('admin');
const services = createServices(supabaseAdmin);
```

### `GET /api/automatizaciones`
**Archivo:** `src/routes/api/automatizaciones/+server.ts`

| Query param | Tipo | Descripción |
|------------|------|-------------|
| `cliente_id` | string (UUID) | Solo para admins: filtrar por cliente |

**Lógica:**
- Admin sin param → todas las automatizaciones
- Admin con `cliente_id` → filtradas por cliente
- Usuario regular con `clienteId` → solo las de su cliente
- Enriquece cada una con `ultima_ejecucion` (query adicional)

**Respuesta:** `{ automatizaciones: Automatizacion[] }`

---

### `GET /api/ejecuciones`
**Archivo:** `src/routes/api/ejecuciones/+server.ts`

| Query param | Tipo | Default | Descripción |
|------------|------|---------|-------------|
| `limit` | number | 20 | Máximo de resultados |
| `automatizacion_id` | string (UUID) | - | Filtrar por automatización específica |

**Respuesta:** `{ ejecuciones: Ejecucion[] }`

---

### `POST /api/ejecuciones`
**Archivo:** `src/routes/api/ejecuciones/+server.ts`

**Body:**
```json
{
  "automatizacion_id": "uuid",
  "fecha_inicio": "2024-01-01T10:00:00Z",  // opcional, default: NOW()
  "estado": "Exitoso",                       // "Exitoso" | "Advertencia" | "Error"
  "metricas": { "emails_enviados": 150 },    // opcional
  "log_salida": "https://...",               // opcional
  "observaciones": "..."                     // opcional
}
```

**Respuesta:** `{ ejecucion: Ejecucion }` — status 201

---

### `GET /api/proyectos`
**Archivo:** `src/routes/api/proyectos/+server.ts`

| Query param | Tipo | Descripción |
|------------|------|-------------|
| `cliente_id` | string (UUID) | Solo admins: filtrar por cliente |

**Respuesta:** `{ proyectos: ProyectoSoftware[] }`

---

### `GET /api/estadisticas`
**Archivo:** `src/routes/api/estadisticas/+server.ts`

| Query param | Tipo | Descripción |
|------------|------|-------------|
| `cliente_id` | string (UUID) | Solo admins: cliente objetivo |

**Respuesta:**
```json
{
  "estadisticas": {
    "totalAutomatizaciones": 3,
    "botsActivos": 2,
    "totalEjecuciones": 145,
    "exitosas": 140,
    "conAdvertencia": 3,
    "conError": 2,
    "tasaExito": 96.55,
    "ejecucionesPorDia": { "2024-01-01": 12, "2024-01-02": 8 }
  }
}
```

---

### `GET /api/profile/avatar-url`
**Archivo:** `src/routes/api/profile/avatar-url/+server.ts`

Retorna la URL de imagen del perfil del usuario autenticado.

**Respuesta:** `{ url_imagen: string | null }`

---

### Admin Endpoints (usan `SUPABASE_SERVICE_ROLE_KEY` directamente)

#### `GET /api/admin/usuarios`
Query params: `busqueda`, `filtro_admin` (todos|admin|usuario), `filtro_baneado` (todos|baneado|activo)
Tabla: `admin_estadisticas_usuarios` (vista)
Respuesta: `{ success: true, usuarios: [...] }`

#### `PATCH /api/admin/usuarios`
Body: `{ usuario_id, campo: "es_admin"|"esta_baneado", valor: boolean }`
Tabla: `perfiles`
Respuesta: `{ success: true, message: "..." }`

#### `GET /api/admin/usuarios/[id]/anuncios`
Tabla: `anuncios` (filtrada por `user_id`)
Respuesta: `{ success: true, anuncios: [...] }`

#### `GET /api/admin/videos`
Tabla: `videos`

#### `POST /api/admin/videos`
Crea video en tabla `videos`

#### `PATCH /api/admin/videos/[id]`
Actualiza video específico

#### `DELETE /api/admin/videos/[id]`
Elimina video específico

---

## 7. SERVICIOS (SERVER-SIDE)

### `createServices(supabase)` — Factory

**Archivo:** `src/lib/services/index.ts`

```typescript
import { ClientesService } from './clientes.service';
import { AutomatizacionesService } from './automatizaciones.service';
import { ProyectosService } from './proyectos.service';

export function createServices(supabase: SupabaseClient) {
  return {
    clientes: new ClientesService(supabase),
    automatizaciones: new AutomatizacionesService(supabase),
    proyectos: new ProyectosService(supabase)
  };
}
```

---

### `AutomatizacionesService`

**Archivo:** `src/lib/services/automatizaciones.service.ts`

| Método | Parámetros | Tablas | Descripción |
|--------|-----------|--------|-------------|
| `getByCliente(clienteId)` | string | automatizaciones, clientes | Automatizaciones de un cliente |
| `getAll()` | - | automatizaciones, clientes | Todas (solo admins) |
| `getByIdWithLastExecution(id)` | string | automatizaciones, ejecuciones | Con última ejecución |
| `getEjecuciones(autoId, limit?)` | string, number | ejecuciones, automatizaciones | Ejecuciones de una automatización |
| `getEjecucionesRecientes(clienteId, limit?)` | string, number | ejecuciones, automatizaciones | Últimas del cliente |
| `getAllEjecucionesRecientes(limit?)` | number | ejecuciones, automatizaciones | Todas (solo admins) |
| `crearEjecucion(ejecucion)` | Omit<Ejecucion, 'id'\|'timestamps'> | ejecuciones | Insertar ejecución |
| `getEstadisticas(clienteId)` | string | automatizaciones, ejecuciones | Cálculo de estadísticas |
| `subscribeEjecuciones(clienteId, cb)` | string\|null, Function | Realtime | Suscripción Supabase Realtime |

---

### `ClientesService`

**Archivo:** `src/lib/services/clientes.service.ts`

| Método | Parámetros | Descripción |
|--------|-----------|-------------|
| `getAll()` | - | Todos los clientes (ordenados por nombre) |
| `getById(id)` | string | Cliente por ID |
| `getBySlug(slug)` | string | Cliente por slug |
| `create(cliente)` | Omit<Cliente, 'id'\|timestamps> | Crear cliente |
| `update(id, updates)` | string, Partial<Cliente> | Actualizar cliente |
| `delete(id)` | string | Eliminar cliente |

---

### `ProyectosService`

**Archivo:** `src/lib/services/proyectos.service.ts`

| Método | Parámetros | Descripción |
|--------|-----------|-------------|
| `getByCliente(clienteId)` | string | Proyectos de un cliente |
| `getAll()` | - | Todos los proyectos (admins) |
| `getById(id)` | string | Proyecto por ID |
| `create(proyecto)` | Omit<...> | Crear proyecto |
| `update(id, updates)` | string, Partial<...> | Actualizar proyecto |
| `delete(id)` | string | Eliminar proyecto |

---

### `ApiService` (Cliente de API para componentes)

**Archivo:** `src/lib/services/api.service.ts`

Singleton: `export const apiService = new ApiService()`

```typescript
// Uso en componentes:
import { apiService } from '$lib/services/api.service';

await apiService.getAutomatizaciones(clienteId?)
await apiService.getEjecuciones({ automatizacionId?, limit? })
await apiService.crearEjecucion({ automatizacion_id, estado, metricas?, log_salida?, observaciones? })
await apiService.getProyectos(clienteId?)
await apiService.getEstadisticas(clienteId?)
```

---

## 8. COMPONENTES

### Componentes de Robots/Automatizaciones

#### `RobotCard.svelte`
**Ruta:** `src/lib/components/app/robots/RobotCard.svelte`
**Props:** `{ automatizacion: Automatizacion }`

Muestra:
- Nombre, descripción, tipo, frecuencia
- Badge de estado con icono (`CheckCircle2`, `AlertCircle`, `XCircle`, `Clock`)
- Última ejecución (fecha)
- Link a log PDF si existe

Estados: `Exitoso` (verde), `Advertencia` (ámbar), `Error` (rojo), `SinEjecucion` (gris)

---

#### `ExecutionCard.svelte`
**Ruta:** `src/lib/components/app/robots/ExecutionCard.svelte`
**Props:** `{ ejecucion: Ejecucion }`

Muestra (en fila horizontal):
- Dot de estado (verde/ámbar/rojo)
- Hora de ejecución
- Nombre de la automatización
- Métricas (emails, docs, montos, registros procesados)
- Nombre del cliente
- Link a log PDF
- Badge de estado (ÉXITO / ADVERTENCIA / ERROR)

---

### Componentes de Proyectos

#### `ProjectCard.svelte`
**Ruta:** `src/lib/components/app/projects/ProjectCard.svelte`
**Props:** `{ proyecto: ProyectoSoftware }`

Muestra: nombre, descripción, tecnologías (badges), tipo, estado, link de acceso.

---

### Componentes de Navegación

#### `NavigationSidebar.svelte`
**Ruta:** `src/lib/components/app/nav/NavigationSidebar.svelte`

Estado: `collapsed = $state(false)` — collapsa a 80px (iconos) o expande a 256px (con labels)

Items de navegación principal:
- Dashboard → `/dashboard`
- Aplicaciones → `/apps`
- Clientes → `/clientes`
- Centro de Control → `/bots`
- Bitácora → `/logs`

Items secundarios:
- Configuración → `/admin/ajustes`

Footer: versión 1.0.0, botón colapsar.

---

#### `MainNav.svelte`
**Ruta:** `src/lib/components/app/nav/main-nav.svelte`
**Props:** `{ session?, user?, perfil? }`

Header fijo con logo, theme toggle (Sun/Moon de `@lucide/svelte`) y `Account` dropdown.

---

#### `AccountIcon.svelte`
**Ruta:** `src/lib/components/app/nav/account-icon.svelte`
**Props:** `{ session, user, supabase?, perfil? }`

- Si autenticado: Muestra avatar + email con dropdown (Mi Cuenta, Cerrar sesión)
- Si no: Muestra `LoginModal`
- Carga `url_imagen` desde `/api/profile/avatar-url`
- Actualización reactiva cuando `perfil.url_imagen` cambia

---

#### `Breadcrumb.svelte`
**Ruta:** `src/lib/components/app/nav/breadcrumb.svelte`

Migas de pan basadas en la ruta actual.

---

### Componentes de Autenticación

#### `Login.svelte` / `Register.svelte`
**Ruta:** `src/lib/components/auth/`

Formularios de auth usando `superforms` + Zod. Ambos usan `AuthForm.svelte` como base.

#### `AuthForm.svelte`
Componente genérico con: campo email, campo password (toggle visible), botón submit, footer link, forgot password link.

---

### Componentes de UI (Biblioteca)
**Ruta:** `src/lib/components/ui/`

Componentes basados en **Bits UI** + **Shadcn/ui** para Svelte:

| Componente | Ruta |
|-----------|------|
| Button | `ui/button/` |
| Card | `ui/card/` |
| Input | `ui/input/` |
| Select | `ui/select/` |
| Dialog | `ui/dialog/` |
| Dropdown Menu | `ui/dropdown-menu/` |
| Tabs | `ui/tabs/` |
| Badge | `ui/badge/` |
| Avatar | `ui/avatar/` |
| Skeleton | `ui/skeleton/` |
| Accordion | `ui/accordion/` |
| Breadcrumb | `ui/breadcrumb/` |
| Sonner (toast) | `ui/sonner/` |
| Spinner | `ui/spinner/` |
| Calendar | `ui/calendar/` |

---

## 9. TIPOS TYPESCRIPT

**Archivo:** `src/lib/types/database.ts`

```typescript
type EstadoEjecucion = 'Exitoso' | 'Advertencia' | 'Error';

interface Cliente {
  id: string;
  nombre: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

interface Automatizacion {
  id: string;
  cliente_id: string;
  nombre: string;
  descripcion: string | null;
  frecuencia: string | null;    // "Diario", "Cada 12 horas"
  tipo: string | null;          // "RPA", "API", "Script"
  esta_activa: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones (join)
  cliente?: Cliente;
  ultima_ejecucion?: Ejecucion;
}

interface Ejecucion {
  id: string;
  automatizacion_id: string;
  fecha_inicio: string;         // ISO 8601
  estado: EstadoEjecucion;
  metricas: Record<string, any> | null;  // JSONB flexible
  log_salida: string | null;    // URL del PDF en Supabase Storage
  observaciones: string | null;
  created_at?: string;
  updated_at?: string;
  // Relación (join)
  automatizacion?: Automatizacion;
}

interface ProyectoSoftware {
  id: string;
  cliente_id: string;
  nombre: string;
  descripcion: string | null;
  url_acceso: string | null;
  tecnologias: string[] | null;
  tipo: string | null;          // "Marketplace", "Sistema Interno"
  estado: string | null;        // "Activo", "Mantenimiento", "Desarrollo", "Inactivo"
  created_at?: string;
  updated_at?: string;
  cliente?: Cliente;
}

interface MetricasEjecucion {
  emails_enviados?: number;
  montos_procesados?: number;
  documentos_procesados?: number;
  registros_procesados?: number;
  tiempo_ejecucion_segundos?: number;
  errores_encontrados?: number;
  [key: string]: any;           // Métricas personalizadas
}
```

**Archivo:** `src/app.d.ts`
```typescript
namespace App {
  interface Locals {
    supabase: SupabaseClient;
    safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
  }
  interface PageData {
    session: Session | null;
    user: User | null;
    supabase: SupabaseClient;
  }
}
```

---

## 10. AUTENTICACIÓN Y SEGURIDAD

### Supabase Auth

- Provider: Email + Password
- Verificación de email: habilitada
- Flujo: Registro → Email verificación → Login

### Hooks de Servidor

**`src/hooks.server.ts`**

Secuencia:
1. `supabaseHook`: Crea `locals.supabase` y `locals.safeGetSession`
2. `authGuard`: Protege rutas privadas
3. Handler final: Agrega headers de seguridad

**Headers de seguridad:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

### Auth Guard

**Archivo:** `src/lib/features/auth/hooks/auth-guard.server.ts`

Protege: `/private/*`, `/admin/*`, `/api/admin/*`

Lógica:
```
Si ruta protegida:
  Si no hay sesión → redirect /auth?mode=login
  Si /admin/* y no es admin (según perfiles.es_admin) → redirect /dashboard
```

### Esquemas de Validación (Zod)

**Archivo:** `src/lib/features/auth/schemas/auth.ts`

```typescript
loginSchema:    { email, password }
registerSchema: { email, password, confirmPassword }
resetPasswordSchema:  { email }
updatePasswordSchema: { password, confirmPassword }
```

Validaciones:
- Email: requiere formato válido
- Password: mínimo 8 caracteres, debe tener letra y símbolo especial

### Admin vs Usuario

| Check | Ubicación | Fuente |
|-------|-----------|--------|
| `esAdmin` en API endpoints | `+server.ts` | `perfiles.es_admin` OR `user_metadata.es_admin` OR email contiene 'admin' |
| `esAdmin` en page.server | `dashboard/+page.server.ts` | `getUserPerfil` + fallbacks |
| Auth guard admin | `auth-guard.server.ts` | `perfiles.es_admin` |

---

## 11. HELPERS DE SERVIDOR

### `supabaseAdmin` + `getUserPerfil`

**Archivo:** `src/lib/server/supabase-admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Cliente con service role — bypasea RLS
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Obtiene perfil del usuario desde tabla perfiles
export async function getUserPerfil(userId: string): Promise<{
  es_admin: boolean;
  esta_baneado: boolean;
} | null>
```

**Uso:** Todos los endpoints de datos (`/api/automatizaciones`, etc.) lo importan para:
1. Obtener el perfil del usuario (esAdmin real)
2. Crear servicios que bypaseen RLS

---

## 12. FEATURES / MÓDULOS

### Auth Feature

**Ruta:** `src/lib/features/auth/`

```
config/
  auth.ts           → AUTH_PATHS, AUTH_REDIRECT_PATHS, PASSWORD_VALIDATION, OAUTH_CONFIG
  supabase.ts       → Cliente público Supabase (singleton para cliente)
  supabase-admin.ts → Cliente admin (legacy; ahora usar src/lib/server/supabase-admin.ts)

hooks/
  supabase.server.ts   → Configura locals.supabase y locals.safeGetSession
  auth-guard.server.ts → Middleware de protección de rutas

schemas/
  auth.ts        → Schemas Zod (cliente)
  auth.server.ts → Schemas Zod + validaciones server-side
  contact.ts     → Schema de contacto

services/
  auth.server.ts → handleLogin, handleRegister, handleLogout (server actions helpers)
```

### Account Feature

**Ruta:** `src/lib/features/account/`

```
schemas/
  agente.ts → Schema para datos de agente/vendedor
```

---

## 13. CONFIGURACIÓN DEL PROYECTO

### Site Config

**Archivo:** `src/lib/config/site.ts`

```typescript
export const siteConfig = {
  title: 'SX - SoporteXperto',
  description: 'Oficina de Transformación Digital - RPA y Automatización.',
  logo: '/logoSX.jpg',
  contact: {
    email: 'transformacion@soportexperto.com',
    phone: '+506 0000 0000'
  },
  footer: {
    rights: '© 2026 SX - SoporteXperto. Todos los derechos reservados.'
  }
};
```

### Stack Técnico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Svelte | ^5.0.0 | Framework UI (Runes) |
| SvelteKit | ^2.16.0 | Framework full-stack |
| Supabase JS | ^2.86.2 | Base de datos + Auth |
| Supabase SSR | ^0.5.2 | Session management SSR |
| Tailwind CSS | ^4.0.0 | Estilos |
| Bits UI | ^2.14.0 | Headless components |
| Superforms | ^2.28.0 | Manejo de formularios |
| Zod | ^3.24.2 | Validación de schemas |
| Lucide (via `@lucide/svelte`) | ^0.544.0 | Iconos |
| Mode Watcher | ^1.1.0 | Dark mode |
| Mapbox GL | ^3.16.0 | Mapas (feature futura) |
| OpenAI SDK | ^6.15.0 | IA (TEO) |
| Vercel Analytics | ^1.6.1 | Analytics |

### svelte.config.js

```javascript
adapter: adapter({
  maxDuration: 60  // Vercel Hobby plan limit
})
```

### App HTML

```html
<!-- src/app.html -->
<link rel="icon" href="/logoSX.jpg" />
<link href="https://api.mapbox.com/mapbox-gl-js/v2.21.0/mapbox-gl.css" rel="stylesheet" />
<body data-sveltekit-preload-data="hover">
```

---

## 14. ESTADO GLOBAL (STORES)

**Archivo:** `src/lib/stores/user-profile.ts`

```typescript
import { writable } from 'svelte/store';

// Tab activo en la página de perfil de usuario
export const userSelectedTabStore = writable<string>('profile');
```

---

## 15. FLUJOS CLAVE

### Flujo de Login

```
/auth?mode=login
  → auth/+page.svelte muestra Login.svelte
  → Usuario ingresa email + password
  → superforms valida con loginSchema
  → POST a ?/login action
    → supabase.auth.signInWithPassword()
    → Verifica perfiles.esta_baneado
    → Si baneado: signOut + error
    → Si OK: session creada
  → Redirect a ?redirect o /
```

### Flujo de Registro

```
/auth?mode=register
  → Register.svelte
  → POST a ?/register
    → Verifica email existente con supabaseAdmin.auth.admin.listUsers()
    → Si existe: error "correo ya registrado"
    → supabase.auth.signUp() → email verificación enviado
  → Redirect a /auth/verify?email=...
  → Usuario confirma email
  → /auth/callback (Supabase) → session creada
```

### Flujo de Carga del Dashboard

```
SSR: dashboard/+page.server.ts
  → getUserPerfil(user.id) → perfiles.es_admin
  → retorna: clienteId, esAdmin

Cliente: dashboard/+page.svelte onMount
  → Promise.all([
      GET /api/automatizaciones?cliente_id=X
      GET /api/ejecuciones?limit=20
      GET /api/estadisticas?cliente_id=X
    ])
  → Cada endpoint:
      → safeGetSession() → user
      → getUserPerfil(user.id) → esAdmin
      → createServices(supabaseAdmin) → queries sin RLS
      → retorna JSON
  → Actualiza state reactivo
  → Svelte re-renderiza KPIs, gráficas, cards
```

---

## 16. PATRONES Y CONVENCIONES

### Importación de Iconos (Svelte 5)

```typescript
// ✅ CORRECTO (Svelte 5, individual imports)
import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
import AlertCircle from '@lucide/svelte/icons/alert-circle';
import XCircle from '@lucide/svelte/icons/x-circle';
import Clock from '@lucide/svelte/icons/clock';

// ❌ EVITAR (barrel import de lucide-svelte falla con componentes dinámicos en Svelte 5)
import { CheckCircle2, Clock } from 'lucide-svelte';
```

> Solo es problema cuando el componente se asigna a una variable y se usa como `<Icon />`.
> Si se usa directamente como `<CheckCircle2 />`, funciona en ambos estilos.

### Componente Dinámico con Fallback

```typescript
// ✅ CORRECTO
const Icon = estadoIcon[estado as keyof typeof estadoIcon] ?? Clock;
const config = estadoConfig[ejecucion.estado] ?? estadoConfig['Exitoso'];
```

### Fetch en Componentes

```typescript
// ✅ CORRECTO — usar apiService
import { apiService } from '$lib/services/api.service';
const datos = await apiService.getAutomatizaciones();

// ❌ NO HACER — importar servicios Supabase directamente en componentes
import { AutomatizacionesService } from '$lib/services/automatizaciones.service';
```

### Verificación Admin en Endpoints

```typescript
// ✅ CORRECTO — fuente de verdad: perfiles.es_admin
const perfil = await getUserPerfil(user.id);
const esAdmin = perfil?.es_admin === true
  || user.user_metadata?.es_admin === true
  || user.email?.includes('admin');
```

---

## 17. ERRORES CONOCIDOS Y FIXES APLICADOS

### Fix 1 — RLS con JWT path incorrecto

**Problema:** `supabase-schema.sql` usaba `auth.jwt() ->> 'cliente_id'` (busca en root del JWT).
**Correcto:** `auth.jwt() -> 'user_metadata' ->> 'cliente_id'` (bajo user_metadata).
**Estado:** Fix SQL disponible en `fix-rls-policies.sql`. Pendiente de ejecutar en Supabase Dashboard.

### Fix 2 — Dashboard mostraba todo en 0

**Causa:** Los API endpoints usaban `locals.supabase` (session client) que era bloqueado por RLS defectuosa.
**Fix:** Todos los endpoints de datos ahora usan `supabaseAdmin` (service role).
**Archivos:** `api/automatizaciones/+server.ts`, `api/ejecuciones/+server.ts`, `api/estadisticas/+server.ts`, `api/proyectos/+server.ts`

### Fix 3 — `es_admin` no sincronizado

**Causa:** Admin panel actualiza `perfiles.es_admin` pero los endpoints leían `user_metadata.es_admin`.
**Fix:** Ahora los endpoints llaman `getUserPerfil(user.id)` y priorizan `perfiles.es_admin`.

### Fix 4 — `Icon is not a function` (crash RobotCard/ExecutionCard)

**Causa:** `lucide-svelte` (barrel import) exporta componentes no compatibles con Svelte 5 cuando se usan como componentes dinámicos.
**Fix:** Cambiados a imports individuales `from '@lucide/svelte/icons/X'`.
**Archivos:** `RobotCard.svelte`, `ExecutionCard.svelte`, `dashboard/+page.svelte`

### Fix 5 — Avatar 404

**Causa:** `account-icon.svelte` llamaba `/api/profile/avatar-url` que no existía.
**Fix:** Creado endpoint `src/routes/api/profile/avatar-url/+server.ts`.

### Fix 6 — `perfilNav` no llegaba al header

**Causa:** `(app)/+layout.svelte` no pasaba `data.perfilNav` a `MainNav`.
**Fix:** Actualizado `<MainNav ... perfil={data.perfilNav} />`.

---

## ACCIÓN PENDIENTE

> **EJECUTAR EN SUPABASE SQL EDITOR:**
> El archivo `fix-rls-policies.sql` en la raíz del proyecto corrige las políticas RLS.
> Esto es necesario para que las queries funcionen también cuando se use el session client (no solo admin).

---

*Última actualización: 2026-03-01*
