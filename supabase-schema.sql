-- ============================================================================
-- Esquema de Base de Datos para TechConnectors RPA Management System
-- ============================================================================
-- Este archivo contiene las definiciones de tablas necesarias para la aplicación
-- Ejecutar este script en el SQL Editor de Supabase

-- ============================================================================
-- Tabla: clientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_slug ON public.clientes(slug);

-- ============================================================================
-- Tabla: automatizaciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.automatizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    frecuencia TEXT, -- Ej: "Diario", "Cada 12 horas", "Semanal"
    tipo TEXT, -- Ej: "RPA", "API", "Script"
    esta_activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para automatizaciones
CREATE INDEX IF NOT EXISTS idx_automatizaciones_cliente_id ON public.automatizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_automatizaciones_esta_activa ON public.automatizaciones(esta_activa);

-- ============================================================================
-- Tabla: ejecuciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ejecuciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automatizacion_id UUID NOT NULL REFERENCES public.automatizaciones(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado TEXT NOT NULL CHECK (estado IN ('Exitoso', 'Advertencia', 'Error')),
    metricas JSONB, -- Datos variables: emails_enviados, montos_procesados, documentos_procesados, etc.
    log_salida TEXT, -- URL pública del PDF en Storage de Supabase
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para ejecuciones
CREATE INDEX IF NOT EXISTS idx_ejecuciones_automatizacion_id ON public.ejecuciones(automatizacion_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_fecha_inicio ON public.ejecuciones(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_estado ON public.ejecuciones(estado);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_metricas ON public.ejecuciones USING GIN(metricas);

-- ============================================================================
-- Tabla: proyectos_software
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proyectos_software (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    url_acceso TEXT,
    tecnologias TEXT[], -- Array de tecnologías: ['Svelte 5', 'PostgreSQL', 'Mapbox']
    tipo TEXT, -- Ej: "Marketplace", "Sistema Interno", "Dashboard"
    estado TEXT, -- Ej: "Activo", "Mantenimiento", "Desarrollo", "Inactivo"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para proyectos_software
CREATE INDEX IF NOT EXISTS idx_proyectos_software_cliente_id ON public.proyectos_software(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_software_estado ON public.proyectos_software(estado);

-- ============================================================================
-- Funciones de actualización de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automatizaciones_updated_at BEFORE UPDATE ON public.automatizaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ejecuciones_updated_at BEFORE UPDATE ON public.ejecuciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_software_updated_at BEFORE UPDATE ON public.proyectos_software
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automatizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejecuciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos_software ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver datos de su cliente
-- NOTA: Ajusta estas políticas según tu modelo de autenticación
-- Asume que el cliente_id está en auth.users.user_metadata.cliente_id

-- Política para clientes (solo lectura para usuarios autenticados)
CREATE POLICY "Users can view their own client"
    ON public.clientes FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Política para automatizaciones
CREATE POLICY "Users can view automatizaciones of their client"
    ON public.automatizaciones FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        cliente_id IN (
            SELECT id FROM public.clientes WHERE id = (auth.jwt() ->> 'cliente_id')::UUID
        )
    );

-- Política para ejecuciones
CREATE POLICY "Users can view ejecuciones of their client"
    ON public.ejecuciones FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        automatizacion_id IN (
            SELECT id FROM public.automatizaciones 
            WHERE cliente_id = (auth.jwt() ->> 'cliente_id')::UUID
        )
    );

-- Política para proyectos_software
CREATE POLICY "Users can view proyectos of their client"
    ON public.proyectos_software FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        cliente_id = (auth.jwt() ->> 'cliente_id')::UUID
    );

-- ============================================================================
-- Datos de Ejemplo (Opcional)
-- ============================================================================
-- Insertar clientes de ejemplo
INSERT INTO public.clientes (nombre, slug) VALUES
    ('Samesa', 'samesa'),
    ('Vedova', 'vedova'),
    ('A&E Logistics', 'ae-logistics')
ON CONFLICT (slug) DO NOTHING;

-- Insertar automatizaciones de ejemplo
INSERT INTO public.automatizaciones (cliente_id, nombre, descripcion, frecuencia, tipo, esta_activa)
SELECT 
    c.id,
    'Gestión Contable',
    'Robot que procesa registros contables en SAP',
    'Diario',
    'RPA',
    true
FROM public.clientes c WHERE c.slug = 'samesa'
ON CONFLICT DO NOTHING;

INSERT INTO public.automatizaciones (cliente_id, nombre, descripcion, frecuencia, tipo, esta_activa)
SELECT 
    c.id,
    'Gestión de Cuentas por Cobrar',
    'Procesa y gestiona CxC automáticamente',
    'Diario',
    'RPA',
    true
FROM public.clientes c WHERE c.slug = 'vedova'
ON CONFLICT DO NOTHING;

INSERT INTO public.automatizaciones (cliente_id, nombre, descripcion, frecuencia, tipo, esta_activa)
SELECT 
    c.id,
    'Logística y Envío de Reportes',
    'Genera y envía reportes de logística',
    'Cada 12 horas',
    'RPA',
    true
FROM public.clientes c WHERE c.slug = 'ae-logistics'
ON CONFLICT DO NOTHING;

-- Insertar proyectos de software de ejemplo
INSERT INTO public.proyectos_software (cliente_id, nombre, descripcion, url_acceso, tecnologias, tipo, estado)
SELECT 
    c.id,
    'VYOWEB',
    'Sistema de Forecast de compras',
    'https://vyoweb.internal',
    ARRAY['Svelte 5', 'SQLite', 'SQL Server'],
    'Sistema Interno',
    'Activo'
FROM public.clientes c WHERE c.slug = 'vedova'
ON CONFLICT DO NOTHING;

INSERT INTO public.proyectos_software (cliente_id, nombre, descripcion, url_acceso, tecnologias, tipo, estado)
SELECT 
    c.id,
    'SITO.cr',
    'Marketplace Inmobiliario masivo',
    'https://sito.cr',
    ARRAY['Svelte 5', 'PostgreSQL', 'PostGIS', 'Mapbox', 'GPT-4o'],
    'Marketplace',
    'Activo'
FROM public.clientes c WHERE c.slug = 'samesa'
ON CONFLICT DO NOTHING;
