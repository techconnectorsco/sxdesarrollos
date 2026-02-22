// Middleware to protect private routes and manage authentication redirects
import { type Handle, redirect, error } from '@sveltejs/kit';
import { AUTH_PATHS, AUTH_REDIRECT_PATHS } from '../config/auth';

export const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const pathname = event.url.pathname;

	// Protect all routes under /private
	if (!session && pathname.startsWith('/private')) {
		throw redirect(303, AUTH_PATHS.LOGIN);
	}

	// Protect /admin routes (UI pages)
	if (pathname.startsWith('/admin')) {
		if (!session) {
			throw redirect(303, `${AUTH_PATHS.LOGIN}&redirect=${encodeURIComponent(pathname)}`);
		}

		// Check if user is admin
		const { data: perfil } = await event.locals.supabase
			.from('perfiles')
			.select('es_admin')
			.eq('id', user!.id)
			.maybeSingle();

		if (!perfil?.es_admin) {
			throw redirect(303, '/');
		}
	}

	// Protect /api/admin/* routes (API endpoints)
	if (pathname.startsWith('/api/admin')) {
		if (!session) {
			throw error(401, 'No autorizado');
		}

		// Check if user is admin
		const { data: perfil } = await event.locals.supabase
			.from('perfiles')
			.select('es_admin')
			.eq('id', user!.id)
			.maybeSingle();

		if (!perfil?.es_admin) {
			throw error(403, 'Acceso denegado');
		}
	}

	// Redirect authenticated users away from auth pages
	if (session && pathname === '/auth') {
		throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.LOGIN);
	}

	return resolve(event);
};