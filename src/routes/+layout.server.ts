import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
    const { session, user } = await safeGetSession();

    let perfilNav: { url_imagen?: string | null } | null = null;
    if (user) {
        const { data } = await supabase
            .from('perfiles')
            .select('url_imagen')
            .eq('id', user.id)
            .maybeSingle();
        perfilNav = data ?? null;
    }
    
    return {
        session,
        user,
        perfilNav,
        // Solo pasar cookies de Supabase, no todas
        cookies: cookies.getAll().filter(cookie => cookie.name.startsWith('sb-'))
    };
};