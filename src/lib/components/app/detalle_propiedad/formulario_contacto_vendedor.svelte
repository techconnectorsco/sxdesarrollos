<script lang="ts">
	import { z } from 'zod';
	import { toast } from 'svelte-sonner';

	let { 
		vendedorNombre = '',
		vendedorTelefono = '',
		vendedorEmail = '',
		tituloPropiedad = '',
		anuncioId = '',
        tipoOperacion = ''
	}: {
		vendedorNombre?: string;
		vendedorTelefono?: string;
		vendedorEmail?: string;
		tituloPropiedad?: string;
		anuncioId?: string;
        tipoOperacion?: string;
	} = $props();

    tipoOperacion === 'venta' ? 'comprar' : 'alquilar';

	// ✅ Schema de validación
	const contactoSchema = z.object({
		nombre: z.string()
			.min(3, 'El nombre debe tener al menos 3 caracteres')
			.max(100, 'El nombre es muy largo'),
		email: z.string()
			.email('Email inválido')
			.min(1, 'El email es requerido'),
		telefono: z.string()
			.regex(/^[0-9+\-\s()]+$/, 'Teléfono inválido')
			.min(8, 'El teléfono debe tener al menos 8 dígitos')
			.optional().or(z.literal('')),
		mensaje: z.string()
			.min(10, 'El mensaje debe tener al menos 10 caracteres')
			.max(1000, 'El mensaje es muy largo')
	});

	type ContactoForm = z.infer<typeof contactoSchema>;

	let formulario = $state<ContactoForm>({
		nombre: '',
		email: '',
		telefono: '',
		mensaje: `Hola, estoy interesado en la propiedad: ${tituloPropiedad}`
	});

	let errors = $state<Partial<Record<keyof ContactoForm, string>>>({});
	let enviando = $state(false);

	async function enviarConsulta(e: Event) {
		e.preventDefault();
		errors = {};

		// ✅ Validar con Zod
		const validacion = contactoSchema.safeParse(formulario);

		if (!validacion.success) {
			const zodErrors = validacion.error.flatten().fieldErrors;
			errors = {
				nombre: zodErrors.nombre?.[0],
				email: zodErrors.email?.[0],
				telefono: zodErrors.telefono?.[0],
				mensaje: zodErrors.mensaje?.[0]
			};
			toast.error('Por favor corrige los errores del formulario');
			return;
		}

		enviando = true;

		try {
			const response = await fetch('/api/contacto/vendedor', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...validacion.data,
					anuncio_id: anuncioId,
					para_email: vendedorEmail,
					para_nombre: vendedorNombre,
					asunto: `Consulta sobre: ${tituloPropiedad}`
				})
			});

			const data = await response.json();

			if (response.ok) {
				toast.success('¡Mensaje enviado correctamente!');
				// Limpiar formulario
				formulario = {
					nombre: '',
					email: '',
					telefono: '',
					mensaje: `Hola, estoy interesado en la propiedad: ${tituloPropiedad}`
				};
			} else {
				toast.error(data.error || 'Error al enviar el mensaje');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al enviar el mensaje');
		} finally {
			enviando = false;
		}
	}
</script>

<div class="card">
    {#if tipoOperacion === 'venta'}
        <h3 class="section-title">Contactar al Vendedor</h3>
    {:else}
        <h3 class="section-title">Contactar al Arrendador</h3>
    {/if}
	
	<div class="vendedor-info">
		<div class="info-item">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
			</svg>
			<span>"{vendedorNombre}"</span>
		</div>
		
		{#if vendedorTelefono}
			<div class="info-item">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
				</svg>
				<a href="tel:{vendedorTelefono}" class="link">{vendedorTelefono}</a>
			</div>
		{/if}
	</div>

	<form onsubmit={enviarConsulta} class="formulario">
		<!-- Nombre -->
		<div class="form-group">
			<label for="nombre">Tu Nombre *</label>
			<input
				id="nombre"
				type="text"
				bind:value={formulario.nombre}
				placeholder="Ej: Juan Pérez"
				class:error={errors.nombre}
				required
			/>
			{#if errors.nombre}
				<span class="error-message">{errors.nombre}</span>
			{/if}
		</div>

		<!-- Email -->
		<div class="form-group">
			<label for="email">Tu Email *</label>
			<input
				id="email"
				type="email"
				bind:value={formulario.email}
				placeholder="tu@email.com"
				class:error={errors.email}
				required
			/>
			{#if errors.email}
				<span class="error-message">{errors.email}</span>
			{/if}
		</div>

		<!-- Teléfono -->
		<div class="form-group">
			<label for="telefono">Tu Teléfono</label>
			<input
				id="telefono"
				type="tel"
				bind:value={formulario.telefono}
				placeholder="+506 8888-8888"
				class:error={errors.telefono}
			/>
			{#if errors.telefono}
				<span class="error-message">{errors.telefono}</span>
			{/if}
		</div>

		<!-- Mensaje -->
		<div class="form-group">
			<label for="mensaje">Mensaje *</label>
			<textarea
				id="mensaje"
				bind:value={formulario.mensaje}
				rows="4"
				placeholder="Escribe tu consulta aquí..."
				class:error={errors.mensaje}
				required
			></textarea>
			{#if errors.mensaje}
				<span class="error-message">{errors.mensaje}</span>
			{/if}
		</div>

		<button type="submit" class="btn-enviar" disabled={enviando}>
			{#if enviando}
				<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Enviando...
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
				</svg>
				Enviar Consulta
			{/if}
		</button>
	</form>
</div>

<style>
	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 24px;
	}

	.section-title {
		font-size: 20px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 16px 0;
	}

	.vendedor-info {
		background: #f9fafb;
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 20px;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #4b5563;
		margin-bottom: 8px;
	}

	.info-item:last-child {
		margin-bottom: 0;
	}

	.info-item svg {
		width: 18px;
		height: 18px;
		color: #3b82f6;
	}

	.link {
		color: #3b82f6;
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}

	.formulario {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	input,
	textarea {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.2s;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input.error,
	textarea.error {
		border-color: #ef4444;
	}

	.error-message {
		font-size: 13px;
		color: #ef4444;
	}

	.btn-enviar {
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px 16px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all 0.2s;
	}

	.btn-enviar:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-enviar:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-enviar svg {
		width: 20px;
		height: 20px;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>