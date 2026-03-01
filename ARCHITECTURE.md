# Arquitectura de la Aplicación - API Fetch Based

## 🏗️ Arquitectura General

Esta aplicación sigue un patrón **API-First** donde:

1. **Endpoints API** (`/api/*`) manejan toda la lógica de negocio y acceso a Supabase
2. **Componentes** hacen `fetch` directamente a los endpoints API
3. **+page.server.ts** solo pasa datos básicos de autenticación (session, user)

## 📁 Estructura de Archivos

```
src/
├── routes/
│   ├── api/                          # Endpoints API
│   │   ├── automatizaciones/
│   │   │   └── +server.ts           # GET: Obtener automatizaciones
│   │   ├── ejecuciones/
│   │   │   └── +server.ts           # GET: Obtener ejecuciones, POST: Crear ejecución
│   │   ├── proyectos/
│   │   │   └── +server.ts           # GET: Obtener proyectos
│   │   └── estadisticas/
│   │       └── +server.ts           # GET: Obtener estadísticas
│   │
│   └── (app)/                        # Rutas protegidas
│       ├── dashboard/
│       │   ├── +page.server.ts      # Solo autenticación
│       │   └── +page.svelte         # Componente que hace fetch
│       └── apps/
│           ├── +page.server.ts      # Solo autenticación
│           └── +page.svelte         # Componente que hace fetch
│
└── lib/
    └── services/
        ├── api.service.ts           # Cliente API para componentes
        ├── automatizaciones.service.ts  # Servicios internos (solo para API)
        ├── proyectos.service.ts
        └── clientes.service.ts
```

## 🔄 Flujo de Datos

### Antes (con +page.server.ts)
```
Usuario → +page.server.ts → Supabase → Datos → Componente
```

### Ahora (API Fetch)
```
Usuario → Componente → fetch('/api/...') → +server.ts → Supabase → JSON → Componente
```

## 📡 Endpoints API Disponibles

### GET `/api/automatizaciones`
Obtiene todas las automatizaciones del usuario/cliente.

**Query Params:**
- `cliente_id` (opcional): Filtrar por cliente (solo admins)

**Respuesta:**
```json
{
  "automatizaciones": [
    {
      "id": "uuid",
      "nombre": "Gestión Contable",
      "cliente_id": "uuid",
      "esta_activa": true,
      "ultima_ejecucion": { ... }
    }
  ]
}
```

### GET `/api/ejecuciones`
Obtiene ejecuciones recientes.

**Query Params:**
- `limit` (opcional, default: 20): Número de ejecuciones
- `automatizacion_id` (opcional): Filtrar por automatización

**Respuesta:**
```json
{
  "ejecuciones": [
    {
      "id": "uuid",
      "automatizacion_id": "uuid",
      "fecha_inicio": "2024-01-01T10:00:00Z",
      "estado": "Exitoso",
      "metricas": { ... },
      "log_salida": "https://...",
      "automatizacion": { ... }
    }
  ]
}
```

### POST `/api/ejecuciones`
Crea una nueva ejecución.

**Body:**
```json
{
  "automatizacion_id": "uuid",
  "fecha_inicio": "2024-01-01T10:00:00Z",
  "estado": "Exitoso",
  "metricas": { "emails_enviados": 150 },
  "log_salida": "https://...",
  "observaciones": "..."
}
```

### GET `/api/proyectos`
Obtiene proyectos de software.

**Query Params:**
- `cliente_id` (opcional): Filtrar por cliente (solo admins)

### GET `/api/estadisticas`
Obtiene estadísticas de un cliente.

**Query Params:**
- `cliente_id` (opcional): Cliente para estadísticas (solo admins)

## 💻 Uso en Componentes

### Ejemplo: Dashboard

```svelte
<script lang="ts">
  import { apiService } from '$lib/services/api.service';
  import { onMount } from 'svelte';

  let automatizaciones = $state([]);
  let loading = $state(true);

  async function loadData() {
    loading = true;
    try {
      automatizaciones = await apiService.getAutomatizaciones();
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

{#if loading}
  <div>Cargando...</div>
{:else}
  {#each automatizaciones as auto}
    <RobotCard automatizacion={auto} />
  {/each}
{/if}
```

## 🔐 Autenticación y Autorización

Todos los endpoints API verifican:
1. **Session válida**: Usuario autenticado
2. **Multi-tenancy**: Usuarios solo ven datos de su `cliente_id`
3. **Admin check**: Administradores pueden ver todos los datos

La autenticación se maneja en:
- `hooks.server.ts`: Configura Supabase
- `(app)/+layout.server.ts`: Pasa session/user a componentes
- `api/*/+server.ts`: Verifica autenticación en cada request

## 🎯 Ventajas de esta Arquitectura

1. **Separación de responsabilidades**: Lógica de negocio en API, UI en componentes
2. **Reutilizable**: Los endpoints pueden usarse desde cualquier cliente (web, mobile, etc.)
3. **Testeable**: Fácil mockear los endpoints para testing
4. **Escalable**: Puedes agregar caché, rate limiting, etc. en los endpoints
5. **Type-safe**: TypeScript en toda la cadena

## 🔄 Actualizaciones en Tiempo Real

Actualmente se usa polling cada 30 segundos. Para Realtime:

1. Opción A: Mantener polling (ya implementado)
2. Opción B: WebSockets/SSE desde los endpoints API
3. Opción C: Supabase Realtime en el cliente (requiere ajustes)

## 📝 Notas

- Los `+page.server.ts` ahora son mínimos, solo pasan datos de autenticación
- Todos los datos se cargan en el cliente usando `fetch`
- Los servicios (`automatizaciones.service.ts`, etc.) solo se usan en los endpoints API
- El `apiService` es el único punto de entrada para componentes
