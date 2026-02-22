<script lang="ts">
	import { contactoSchema, type ContactoFormData } from '$lib/schemas';
	
	// ✅ Svelte 5: Props con $props()
	let { tituloPropiedad = '', idPropiedad }: { tituloPropiedad?: string; idPropiedad: number } = $props();
	
	let formData = $state<ContactoFormData>({
		nombre: '',
		email: '',
		telefono: '',
		mensaje: 'Estoy interesado en esta propiedad y me gustaría agendar una visita.',
		id_propiedad: idPropiedad
	});
	
	let errores = $state<Record<string, string>>({});
	let enviando = $state(false);
	let mensajeEnviado = $state(false);
	let errorGeneral = $state('');
	
	async function enviarFormulario(e: Event) {
		e.preventDefault();
		
		// Limpiar errores previos
		errores = {};
		errorGeneral = '';
		
		// Validar con Zod
		const resultado = contactoSchema.safeParse(formData);
		
		if (!resultado.success) {
			// Extraer errores por campo
			const zodErrors = resultado.error.flatten().fieldErrors;
			errores = Object.fromEntries(
				Object.entries(zodErrors).map(([key, value]) => [key, value?.[0] || ''])
			);
			return;
		}
		
		enviando = true;
		
		try {
			// console.log('✅ Datos validados:', resultado.data);
			
			// TODO: Integrar con Supabase
			// const { data, error } = await supabase
			//   .from('consultas')
			//   .insert([resultado.data]);
			
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			mensajeEnviado = true;
			
			setTimeout(() => {
				formData = {
					nombre: '',
					email: '',
					telefono: '',
					mensaje: 'Estoy interesado en esta propiedad y me gustaría agendar una visita.',
					id_propiedad: idPropiedad
				};
				mensajeEnviado = false;
			}, 3000);
			
		} catch (err) {
			errorGeneral = 'Hubo un error al enviar el mensaje. Intente nuevamente.';
			console.error('Error:', err);
		} finally {
			enviando = false;
		}
	}
</script>

<div class="card-contacto">
	<h3 class="titulo">Contactar Agente</h3>
	
	<div class="info-agente">
		<div class="avatar">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
			</svg>
		</div>
		<div>
			<!-- <p class="nombre-agente">Equipo SITO</p>
			<p class="empresa">SITO.cr</p> -->
		</div>
	</div>
	
	<!-- <div class="contacto-info">
		<p>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
			</svg>
			<span>+506 8697-8542</span>
		</p>
	</div> -->
	
	<form onsubmit={enviarFormulario} class="formulario">
		<div class="form-group">
			<label for="nombre">Nombre*</label>
			<input
				type="text"
				id="nombre"
				bind:value={formData.nombre}
				class:error={errores.nombre}
				placeholder="Tu nombre completo"
			/>
			{#if errores.nombre}
				<span class="error-text">{errores.nombre}</span>
			{/if}
		</div>
		
		<div class="form-group">
			<label for="email">Email*</label>
			<input
				type="email"
				id="email"
				bind:value={formData.email}
				class:error={errores.email}
				placeholder="tu@email.com"
			/>
			{#if errores.email}
				<span class="error-text">{errores.email}</span>
			{/if}
		</div>
		
		<div class="form-group">
			<label for="telefono">Teléfono</label>
			<input
				type="tel"
				id="telefono"
				bind:value={formData.telefono}
				class:error={errores.telefono}
				placeholder="+506 1234-5678"
			/>
			{#if errores.telefono}
				<span class="error-text">{errores.telefono}</span>
			{/if}
		</div>
		
		<div class="form-group">
			<label for="mensaje">Mensaje*</label>
			<textarea
				id="mensaje"
				bind:value={formData.mensaje}
				class:error={errores.mensaje}
				rows="4"
			></textarea>
			{#if errores.mensaje}
				<span class="error-text">{errores.mensaje}</span>
			{/if}
		</div>
		
		{#if errorGeneral}
			<div class="error-message">{errorGeneral}</div>
		{/if}
		
		{#if mensajeEnviado}
			<div class="success-message">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				¡Mensaje enviado con éxito!
			</div>
		{/if}
		
		<button type="submit" class="btn-enviar" disabled={enviando}>
			{#if enviando}
				<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Enviando...
			{:else}
				Enviar Mensaje
			{/if}
		</button>
	</form>
</div>

<style>
	.card-contacto {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 24px;
	}
	
	.titulo {
		font-size: 18px;
		font-weight: 700;
		margin: 0 0 20px 0;
		color: #1f2937;
	}
	
	.info-agente {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		padding-bottom: 16px;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.avatar svg {
		width: 28px;
		height: 28px;
		color: #9ca3af;
	}
	
	.nombre-agente {
		font-weight: 600;
		font-size: 16px;
		margin: 0;
		color: #1f2937;
	}
	
	.empresa {
		font-size: 14px;
		color: #6b7280;
		margin: 2px 0 0 0;
	}
	
	.contacto-info {
		margin-bottom: 20px;
		font-size: 14px;
		color: #4b5563;
	}
	
	.contacto-info p {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
	}
	
	.contacto-info svg {
		width: 18px;
		height: 18px;
		color: #3b82f6;
		flex-shrink: 0;
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
	
	.form-group label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}
	
	.form-group input,
	.form-group textarea {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		transition: all 0.2s;
	}
	
	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group textarea {
		resize: vertical;
		min-height: 100px;
	}
	
	.form-group input.error,
	.form-group textarea.error {
		border-color: #ef4444;
	}
	
	.error-text {
		display: block;
		color: #dc2626;
		font-size: 12px;
		margin-top: 4px;
	}
	
	.error-message {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 12px;
		border-radius: 8px;
		font-size: 14px;
	}
	
	.success-message {
		background: #d1fae5;
		border: 1px solid #a7f3d0;
		color: #065f46;
		padding: 12px;
		border-radius: 8px;
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.success-message svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
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
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	
	.btn-enviar:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.btn-enviar:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
	
	.spinner {
		width: 20px;
		height: 20px;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>