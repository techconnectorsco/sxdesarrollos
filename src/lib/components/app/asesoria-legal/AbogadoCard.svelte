<script lang="ts">
	export let abogado: {
		id: number;
		nombre: string;
		email: string;
		telefono: string;
		especialidad: string;
		ubicacion: string;
		foto_url: string;
		horarios: string;
		tipo_asesoria: 'abogado' | 'bufete';
		whatsapp?: string;
	};

	const tipoLabel = abogado.tipo_asesoria === 'abogado' ? 'Abogado Independiente' : 'Bufete Legal';
	const tipoColor = abogado.tipo_asesoria === 'abogado' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';

	function contactarWhatsApp() {
		const telefono = abogado.whatsapp || abogado.telefono.replace(/\D/g, '');
		const mensaje = encodeURIComponent(
			`Hola ${abogado.nombre}, lo contacto desde SITO. Me gustaría consultarle sobre asesoría legal relacionada con una propiedad.`
		);
		window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
	}
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
	<!-- Foto grande con tag -->
	<div class="relative w-full h-64 overflow-hidden bg-gray-200">
		<img
			src={abogado.foto_url}
			alt={abogado.nombre}
			class="w-full h-full object-cover"
		/>
		<!-- Tag posicionado arriba a la derecha -->
		<div class="absolute top-4 right-4">
			<span class="px-3 py-1 rounded-full text-xs font-semibold {tipoColor} shadow-md">
				{tipoLabel}
			</span>
		</div>
	</div>

	<!-- Información -->
	<div class="p-6">
		<h3 class="text-xl font-bold text-gray-900 mb-2">{abogado.nombre}</h3>

		<p class="text-sm text-blue-600 font-semibold mb-4">{abogado.especialidad}</p>

		<div class="space-y-3 mb-6 text-sm text-gray-600">
			<div class="flex items-center gap-2">
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				<span>{abogado.ubicacion}</span>
			</div>

			<div class="flex items-center gap-2">
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
					/>
				</svg>
				<span>{abogado.telefono}</span>
			</div>

			<div class="flex items-center gap-2">
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				<span class="truncate">{abogado.email}</span>
			</div>

			<div class="flex items-center gap-2">
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{abogado.horarios}</span>
			</div>
		</div>

		<!-- Botón contactar -->
		<button
			on:click={contactarWhatsApp}
			class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path
					fill="white"
					d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.75 21 3 13.25 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
				/>
			</svg>
			Contactar por WhatsApp
		</button>
	</div>
</div>

<style>
	/* Estilos adicionales si son necesarios */
</style>
