-- ============================================================================
-- CORRECCIÓN DE POLÍTICAS RLS
-- Problema: Las políticas anteriores leían cliente_id del root del JWT
--           pero Supabase lo guarda bajo user_metadata.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================================

-- Eliminar políticas anteriores (incorrectas)
DROP POLICY IF EXISTS "Users can view their own client" ON public.clientes;
DROP POLICY IF EXISTS "Users can view automatizaciones of their client" ON public.automatizaciones;
DROP POLICY IF EXISTS "Users can view ejecuciones of their client" ON public.ejecuciones;
DROP POLICY IF EXISTS "Users can view proyectos of their client" ON public.proyectos_software;

-- ============================================================================
-- Nuevas políticas con path JWT correcto + bypass para admins
-- ============================================================================

-- Clientes: admins ven todo, usuarios ven su cliente
CREATE POLICY "clientes_select"
    ON public.clientes FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Admin bypass (chequea perfiles.es_admin)
            EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true)
            OR
            -- Usuario regular: solo su cliente
            id = (auth.jwt() -> 'user_metadata' ->> 'cliente_id')::UUID
        )
    );

-- Automatizaciones: admins ven todo, usuarios ven las de su cliente
CREATE POLICY "automatizaciones_select"
    ON public.automatizaciones FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true)
            OR
            cliente_id = (auth.jwt() -> 'user_metadata' ->> 'cliente_id')::UUID
        )
    );

-- Ejecuciones: admins ven todo, usuarios ven las de su cliente
CREATE POLICY "ejecuciones_select"
    ON public.ejecuciones FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true)
            OR
            automatizacion_id IN (
                SELECT id FROM public.automatizaciones
                WHERE cliente_id = (auth.jwt() -> 'user_metadata' ->> 'cliente_id')::UUID
            )
        )
    );

-- Proyectos: admins ven todo, usuarios ven los de su cliente
CREATE POLICY "proyectos_software_select"
    ON public.proyectos_software FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true)
            OR
            cliente_id = (auth.jwt() -> 'user_metadata' ->> 'cliente_id')::UUID
        )
    );
