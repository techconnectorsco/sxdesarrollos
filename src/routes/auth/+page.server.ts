// src/routes/auth/+page.server.ts
// Main authentication page handling both login and registration
import { redirect, type Actions } from '@sveltejs/kit';
import { loginSchema, registerSchema } from '$lib/features/auth/schemas/auth';
import { message, superValidate, setError } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { AUTH_REDIRECT_PATHS } from '$lib/features/auth/config/auth';
import { supabaseAdmin } from '$lib/features/auth/config/supabase-admin';

// console.log('[auth/+page.server.ts] File loaded');

// Initialize auth forms based on mode (login/register)
export const load: PageServerLoad = async ({ parent, url }) => {
	// console.log('[auth/+page.server.ts] Load function called');
	const parentData = await parent();

	// Redirect to private if already logged in
	if (parentData.session) {
		throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.LOGIN);
	}

	const mode = url.searchParams.get('mode');
	// console.log('[auth/+page.server.ts] Mode:', mode);

	// Initialize both forms
	const loginForm = await superValidate(zod(loginSchema));
	const registerForm = await superValidate(zod(registerSchema));

	return {
		...parentData,
		form: mode === 'register' ? registerForm : loginForm
	};
};

// Handle form submissions for both login and registration
export const actions: Actions = {
	login: async ({ request, locals: { supabase }, url }: RequestEvent) => {
		// console.log('[auth/+page.server.ts] Login action called');
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			// Return validation errors from zod schema
			return message(form, 'Por favor revisa los errores en el formulario');
		}

		// ============================================
		// PASO 1: Autenticar con Supabase
		// ============================================
		const { data: signInData, error } = await supabase.auth.signInWithPassword({
			email: form.data.email,
			password: form.data.password
		});

		if (error) {
			const errorMessage =
				error.message === 'Invalid login credentials'
					? 'Email o contraseña incorrectos'
					: 'Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo más tarde.';
			return message(form, errorMessage, { status: 400 });
		}

		// ============================================
		// PASO 2: Verificar si el usuario está baneado
		// ============================================
		if (signInData?.user) {
			const userId = signInData.user.id;
			
			try {
				const { data: perfil, error: perfilError } = await supabase
					.from('perfiles')
					.select('esta_baneado, email')
					.eq('id', userId)
					.single();

				if (perfilError) {
					console.error('Error al verificar perfil:', perfilError);
					// Si hay error al verificar perfil, cerrar sesión por seguridad
					await supabase.auth.signOut();
					return message(form, 'Ocurrió un error. Por favor, intenta de nuevo más tarde.', { status: 500 });
				}

				// Si el usuario está baneado, cerrar sesión y mostrar error
				if (perfil?.esta_baneado) {
					// console.log(`🚫 Usuario baneado intentó iniciar sesión: ${perfil.email}`);
					
					// Cerrar la sesión que acabamos de crear
					await supabase.auth.signOut();
					
					return message(
						form, 
						'Tu cuenta ha sido suspendida. Por favor, contacta a soporte para más información.', 
						{ status: 403 }
					);
				}
			} catch (error) {
				console.error('Error inesperado al verificar perfil:', error);
				// Por seguridad, cerrar sesión
				await supabase.auth.signOut();
				return message(form, 'Ocurrió un error. Por favor, intenta de nuevo más tarde.', { status: 500 });
			}
		}

		// ============================================
		// PASO 3: Verificar si hay redirect o es modal
		// ============================================
		const redirectTo = url.searchParams.get('redirect');
		
		// Si viene de una página protegida (como /publicar), hacer redirect
		if (redirectTo) {
			// console.log('[auth/+page.server.ts] Redirecting to:', redirectTo);
			throw redirect(303, redirectTo);
		}
		
		// Si es login desde el modal (no hay redirect), retornar success
		// console.log('[auth/+page.server.ts] Modal login, returning success message');
		return message(form, 'Inicio de sesión exitoso');
	},

	register: async ({ request, locals: { supabase } }: RequestEvent) => {
		// console.log('[auth/+page.server.ts] 🎯 REGISTER ACTION CALLED');
		
		const form = await superValidate(request, zod(registerSchema));

		if (!form.valid) {
			// console.log('[auth/+page.server.ts] Form validation failed:', form.errors);
			return message(form, 'Por favor revisa los errores en el formulario');
		}

		const { email, password } = form.data;

		// ============================================
		// CHECK IF EMAIL ALREADY EXISTS
		// ============================================
		// console.log(`[auth/+page.server.ts] Checking if email "${email}" already exists...`);
		
		try {
			// List all users and check if email exists
			const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

			if (listError) {
				console.error('[auth/+page.server.ts] Error listing users:', listError);
				return message(form, 'Ocurrió un error. Por favor, intenta de nuevo más tarde.', { status: 500 });
			}

			// Check if email exists (case-insensitive)
			const existingUser = userData?.users?.find(
				user => user.email?.toLowerCase() === email.toLowerCase()
			);

			// If user exists, return error
			if (existingUser) {
				// console.log(`[auth/+page.server.ts] ❌ Email "${email}" is already registered`);
				// console.log('[auth/+page.server.ts] Existing user:', {
				// 	id: existingUser.id,
				// 	email: existingUser.email,
				// 	created_at: existingUser.created_at
				// });
				
				return setError(form, 'email', 'Este correo electrónico ya está registrado');
			}

			// console.log(`[auth/+page.server.ts] ✓ Email "${email}" is available`);
		} catch (error) {
			console.error('[auth/+page.server.ts] Unexpected error during email check:', error);
			return message(form, 'Ocurrió un error. Por favor, intenta de nuevo más tarde.', { status: 500 });
		}

		// ============================================
		// PROCEED WITH REGISTRATION
		// ============================================
		// console.log('[auth/+page.server.ts] Proceeding with registration...');

		// Get the site URL for email confirmation
		const siteUrl = new URL(request.url);
		const redirectTo = `${siteUrl.protocol}//${siteUrl.host}/auth/confirm`;

		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: redirectTo
			}
		});

		// console.log('[auth/+page.server.ts] SignUp response:', {
		// 	hasUser: !!signUpData?.user,
		// 	error: signUpError
		// });

		if (signUpError) {
			console.error('[auth/+page.server.ts] SignUp error:', signUpError);
			
			// Check for specific errors
			if (signUpError.message.includes('already registered')) {
				return setError(form, 'email', 'Este correo electrónico ya está registrado');
			}
			
			return message(form, signUpError.message, { status: 400 });
		}

		// console.log(`[auth/+page.server.ts] ✓ Registration successful for "${email}"`);

		// Redirect to confirmation message with email
		throw redirect(
			303,
			`${AUTH_REDIRECT_PATHS.FLOW.VERIFY}?email=${encodeURIComponent(email)}`
		);
	}
};