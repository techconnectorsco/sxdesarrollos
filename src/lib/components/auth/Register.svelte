<script lang="ts">
	import { registerSchema, type RegisterSchema } from '$lib/features/auth/schemas/auth';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import AuthForm from './AuthForm.svelte';
	import { siteConfig } from '$lib/config/site';

	let props = $props<{ data: { form: SuperValidated<Infer<RegisterSchema>> } }>();

	const form = superForm(props.data.form, {
		validators: zodClient(registerSchema),
		validationMethod: 'auto',
		resetForm: false,
		invalidateAll: false,
		onSubmit: () => {
			console.log('[Register] Form is being submitted');
		},
		onResult: ({ result }) => {
			console.log('[Register] onResult:', result.type);
			
			if (result.type === 'redirect') {
				console.log('[Register] Redirecting to:', result.location);
				return;
			}
			
			if (result.type === 'failure') {
				console.log('[Register] Form failure:', result.data);
			}
		},
		onError: ({ result }) => {
			console.error('[Register] Form error:', result);
		}
	});

	const { enhance, message, submitting, form: formData } = form;
</script>

<!-- Contenedor principal con gradiente sutil -->
<div class="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-blue-50">
	<!-- Card contenedor -->
	<div class="w-full max-w-md space-y-8">
		<!-- Logo y Título -->
		<div class="text-center space-y-3">
			<!-- Logo -->
			<div class="flex justify-center mb-4">
				<a href="/" class="inline-block">
					<img 
						src={siteConfig.logo} 
						alt={siteConfig.title}
						class="h-16 w-auto"
					/>
				</a>
			</div>

			<!-- Saludo -->
			<h1 class="text-3xl font-bold text-gray-900">
				¡Únete a {siteConfig.title}! 🚀
			</h1>
			<p class="text-base text-gray-600">
				Crea tu cuenta y encuentra tu próxima propiedad ideal
			</p>
		</div>

		<!-- Card del formulario -->
		<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
			<AuthForm
				title=""
				description=""
				{form}
				{formData}
				formAction="?/register"
				buttonText="Crear cuenta"
				submitting={$submitting}
				message={$message}
				footerText="¿Ya tienes cuenta?"
				footerLinkText="Inicia sesión"
				footerLinkHref="/auth?mode=login"
				{enhance}
				showPasswordToggle={true}
			/>
		</div>

		<!-- Términos y condiciones -->
		<div class="text-center">
			<div class="inline-flex flex-col gap-2 text-xs text-gray-600 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200">
				<div class="flex items-start gap-2">
					<svg class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="text-left">
						Al registrarte, aceptas nuestros
						<a href="/terminos" class="text-blue-600 hover:text-blue-700 font-medium">Términos de Servicio</a>
						y
						<a href="/privacidad" class="text-blue-600 hover:text-blue-700 font-medium">Política de Privacidad</a>
					</span>
				</div>
			</div>
		</div>

		<!-- Beneficios de registrarse -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
			<h3 class="text-sm font-semibold text-gray-900 mb-3 text-center">
				¿Por qué unirte a {siteConfig.title}?
			</h3>
			<ul class="space-y-2 text-sm text-gray-600">
				<li class="flex items-center gap-2">
					<svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Guarda tus propiedades favoritas</span>
				</li>
				<li class="flex items-center gap-2">
					<svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Recibe alertas de nuevas propiedades</span>
				</li>
				<li class="flex items-center gap-2">
					<svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Acceso a herramientas exclusivas</span>
				</li>
				<li class="flex items-center gap-2">
					<svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<span>Contacta directamente con propietarios</span>
				</li>
			</ul>
		</div>
	</div>
</div>