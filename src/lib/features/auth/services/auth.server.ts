/**
 * @module AuthServerService
 * @description This module provides server-side authentication services, including functions for user login and registration with Supabase.
 * It handles form validation, Supabase interactions, and error/redirect responses for SvelteKit server-side operations.
 */
// Authentication service for handling user login and registration
import { fail, setError } from 'sveltekit-superforms';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { SuperValidated } from 'sveltekit-superforms';
import type { z } from 'zod';
import { loginSchema, registerSchema, type RegisterSchema } from '../schemas/auth';
import { AUTH_REDIRECT_PATHS } from '$lib/features/auth/config/auth';
import { supabaseAdmin } from '$lib/features/auth/config/supabase-admin';

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = RegisterSchema;

/**
 * Handles user login by validating the form data and authenticating with Supabase.
 * Redirects to the dashboard on successful login or returns form errors.
 * @param {RequestEvent} event - The SvelteKit request event object.
 * @param {SuperValidated<LoginFormData>} form - The super validated form data for login.
 * @returns {Promise<import('sveltekit-superforms').SuperValidated<LoginFormData>>} A promise that resolves to the form object with potential errors,
 * or throws a redirect on successful login.
 */
export async function handleLogin(event: RequestEvent, form: SuperValidated<LoginFormData>) {
	if (!form.valid) {
		return fail(400, { form });
	}

	const supabase = event.locals.supabase;
	const { email, password } = form.data;
	
	// ============================================
	// PASO 1: Autenticar con Supabase
	// ============================================
	const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (signInError) {
		const errorMessage =
			signInError.message === 'Invalid login credentials'
				? 'Email o contraseña incorrectos'
				: 'Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo más tarde.';
		return setError(form, '', errorMessage);
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
				return setError(form, '', 'Ocurrió un error. Por favor, intenta de nuevo más tarde.');
			}

			// Si el usuario está baneado, cerrar sesión y mostrar error
			if (perfil?.esta_baneado) {
				console.log(`🚫 Usuario baneado intentó iniciar sesión: ${perfil.email}`);
				
				// Cerrar la sesión que acabamos de crear
				await supabase.auth.signOut();
				
				return setError(
					form, 
					'', 
					'Tu cuenta ha sido suspendida. Por favor, contacta a soporte para más información.'
				);
			}
		} catch (error) {
			console.error('Error inesperado al verificar perfil:', error);
			// Por seguridad, cerrar sesión
			await supabase.auth.signOut();
			return setError(form, '', 'Ocurrió un error. Por favor, intenta de nuevo más tarde.');
		}
	}

	// ============================================
	// PASO 3: Si todo está bien, hacer redirect
	// ============================================
	throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.LOGIN);
}

/**
 * Handles new user registration by validating the form data, checking for existing emails,
 * and registering the user with Supabase. Redirects to the login page on successful registration.
 * @param {RequestEvent} event - The SvelteKit request event object.
 * @param {SuperValidated<RegisterFormData>} form - The super validated form data for registration.
 * @returns {Promise<import('sveltekit-superforms').SuperValidated<RegisterFormData>>} A promise that resolves to the form object with potential errors,
 * or throws a redirect on successful registration.
 */
export async function handleRegister(event: RequestEvent, form: SuperValidated<RegisterFormData>) {
	
	if (!form.valid) {
		
		return fail(400, { form });
	}

	const { email, password } = form.data;

	// Check if email already exists using Supabase Admin
	
	try {
		// Usar getUserByEmail que es más específico y eficiente
		const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

		
		// Si encontramos un usuario, el email ya existe
		if (existingUser && existingUser.user) {
			
			
			
			return setError(form, 'email', 'Este correo electrónico ya está registrado');
		}

		// Si hay error pero no es "User not found", es un error real
		if (getUserError && !getUserError.message.includes('User not found')) {
			
			return setError(form, '', 'Ocurrió un error. Por favor, intenta de nuevo más tarde.');
		}

		
	} catch (error) {
		
		return setError(form, '', 'Ocurrió un error. Por favor, intenta de nuevo más tarde.');
	}

	// Proceed with registration
	const supabase = event.locals.supabase;
	
	const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				created_at: new Date().toISOString()
			}
		}
	});

	
	if (signUpError) {
		
		let errorMessage = 'Error al crear la cuenta';
		
		if (signUpError.message.includes('already registered')) {
			errorMessage = 'Este correo electrónico ya está registrado';
		} else if (signUpError.message.includes('password')) {
			errorMessage = 'La contraseña no cumple con los requisitos';
		}
		
		return setError(
			form,
			signUpError.message.includes('already registered') ? 'email' : 'password',
			errorMessage
		);
	}

	
	throw redirect(303, AUTH_REDIRECT_PATHS.SUCCESS.REGISTER);
}