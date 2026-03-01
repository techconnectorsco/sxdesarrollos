import type { PageServerLoad } from './$types';

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

	return {
		session,
		user,
		clienteId: user?.user_metadata?.cliente_id || null,
		esAdmin: user?.user_metadata?.es_admin === true || user?.email?.includes('admin')
	};
};
