import type { PageServerLoad } from './$types';
import { getUserPerfil } from '$lib/server/supabase-admin';

/**
 * Dashboard ahora solo pasa datos básicos de autenticación
 * Los componentes hacen fetch directamente a los endpoints API
 */
export const load: PageServerLoad = async (event) => {
	const { parent } = event;
	const parentData = await parent();
	const { session, user } = parentData as {
		session: any;
		user: any;
	};

	const perfil = user ? await getUserPerfil(user.id) : null;

	return {
		session,
		user,
		clienteId: user?.user_metadata?.cliente_id || null,
		esAdmin: perfil?.es_admin === true || user?.user_metadata?.es_admin === true || user?.email?.includes('admin')
	};
};
