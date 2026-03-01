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
<div class="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted">
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
			<h1 class="text-3xl font-bold text-foreground">
				¡Únete a {siteConfig.title}! 🚀
			</h1>
		</div>

		<!-- Card del formulario -->
		<div class="bg-card rounded-2xl shadow-lg border border-border p-8">
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
			<div class="inline-flex flex-col gap-2 text-xs text-muted-foreground bg-card px-6 py-3 rounded-xl shadow-sm border border-border">
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

	</div>
</div>