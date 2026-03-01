# Configuración de Base de Datos - TechConnectors RPA Management

## 📋 Requisitos Previos

1. Tener una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto en Supabase
3. Obtener las credenciales del proyecto (URL y Anon Key)

## 🚀 Pasos de Configuración

### 1. Ejecutar el Script SQL

1. Ve al SQL Editor en tu proyecto de Supabase
2. Copia y pega el contenido de `supabase-schema.sql`
3. Ejecuta el script completo

### 2. Configurar Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Solo para operaciones admin
```

### 3. Configurar Row Level Security (RLS)

El script SQL ya incluye políticas básicas de RLS. Sin embargo, necesitas ajustarlas según tu modelo de autenticación:

#### Opción A: Usar user_metadata de Supabase Auth

Si almacenas el `cliente_id` en `user_metadata`:

```sql
-- Actualizar las políticas para usar user_metadata
CREATE POLICY "Users can view automatizaciones of their client"
    ON public.automatizaciones FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        cliente_id = (auth.jwt() -> 'user_metadata' ->> 'cliente_id')::UUID
    );
```

#### Opción B: Crear tabla de perfiles

Si prefieres una tabla separada para perfiles:

```sql
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id),
    es_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Política usando perfiles
CREATE POLICY "Users can view automatizaciones of their client"
    ON public.automatizaciones FOR SELECT
    USING (
        cliente_id IN (
            SELECT cliente_id FROM public.perfiles 
            WHERE user_id = auth.uid()
        )
    );
```

### 4. Configurar Storage para Logs PDF

1. Ve a Storage en Supabase
2. Crea un bucket llamado `ejecuciones-logs`
3. Configura las políticas de acceso según necesites

### 5. Habilitar Realtime

1. Ve a Database > Replication en Supabase
2. Habilita la replicación para la tabla `ejecuciones`
3. Esto permitirá actualizaciones en tiempo real en el dashboard

## 📊 Estructura de Datos

### Tabla: clientes
- `id`: UUID (PK)
- `nombre`: Nombre del cliente
- `slug`: Identificador único para URLs

### Tabla: automatizaciones
- `id`: UUID (PK)
- `cliente_id`: UUID (FK → clientes)
- `nombre`: Nombre del robot/automatización
- `descripcion`: Descripción opcional
- `frecuencia`: Frecuencia de ejecución (ej: "Diario", "Cada 12 horas")
- `tipo`: Tipo de automatización (ej: "RPA", "API")
- `esta_activa`: Boolean

### Tabla: ejecuciones
- `id`: UUID (PK)
- `automatizacion_id`: UUID (FK → automatizaciones)
- `fecha_inicio`: Timestamp de inicio
- `estado`: 'Exitoso' | 'Advertencia' | 'Error'
- `metricas`: JSONB con datos variables
- `log_salida`: URL del PDF en Storage
- `observaciones`: Notas adicionales

### Tabla: proyectos_software
- `id`: UUID (PK)
- `cliente_id`: UUID (FK → clientes)
- `nombre`: Nombre del proyecto
- `descripcion`: Descripción opcional
- `url_acceso`: URL de acceso
- `tecnologias`: Array de strings
- `tipo`: Tipo de proyecto
- `estado`: Estado actual

## 🔐 Multi-Tenancy

El sistema está diseñado para multi-tenancy donde:

- **Usuarios regulares**: Solo ven datos de su cliente asignado
- **Administradores**: Ven todos los datos del sistema

Para marcar un usuario como administrador, agrega `es_admin: true` en su `user_metadata`:

```javascript
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: { es_admin: true, cliente_id: null }
});
```

Para asignar un cliente a un usuario:

```javascript
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: { cliente_id: 'uuid-del-cliente' }
});
```

## 📝 Notas Importantes

1. **Métricas JSONB**: El campo `metricas` en `ejecuciones` puede contener cualquier estructura JSON. Ejemplos:
   ```json
   {
     "emails_enviados": 150,
     "montos_procesados": 50000,
     "documentos_procesados": 45,
     "tiempo_ejecucion_segundos": 120
   }
   ```

2. **Logs PDF**: Los PDFs deben subirse al bucket de Storage y la URL pública debe guardarse en `log_salida`

3. **Realtime**: Asegúrate de habilitar la replicación para que las actualizaciones en tiempo real funcionen
