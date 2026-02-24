<script lang="ts">
	import { onMount } from 'svelte';
	// import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte'; // componente pendiente
	// import AbogadoModal from '$lib/components/app/admin/AbogadoModal.svelte'; // componente pendiente
	// import AbogadoTable from '$lib/components/app/admin/AbogadoTable.svelte'; // componente pendiente  

	let { data } = $props();
	
	let showModal = $state(false);
	let selectedAbogado = $state<any>(null);
	let abogados = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		await loadAbogados();
	});

	async function loadAbogados() {
		loading = true;
		try {
			const response = await fetch('/api/asesoria-legal');
			if (response.ok) {
				abogados = await response.json();
			} else {
				console.error('Error cargando abogados');
			}
		} catch (error) {
			console.error('Error cargando abogados:', error);
		} finally {
			loading = false;
		}
	}

	function handleAddClick() {
		selectedAbogado = null;
		showModal = true;
	}

	function handleEdit(abogado: any) {
		selectedAbogado = abogado;
		showModal = true;
	}

	async function handleSave(formData: any) {
		// console.log('handleSave ejecutado con:', formData);
		try {
			if (selectedAbogado) {
				// Actualizar existente
				// console.log('Actualizando abogado:', selectedAbogado.id);
				const response = await fetch(`/api/asesoria-legal/${selectedAbogado.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(formData)
				});
				
				// console.log('Response status:', response.status);
				if (response.ok) {
					const updated = await response.json();
					const index = abogados.findIndex((a) => a.id === selectedAbogado.id);
					if (index !== -1) {
						abogados[index] = updated;
						abogados = abogados;
					}
				}
			} else {
				// Crear nuevo
				// console.log('Creando nuevo abogado');
				const response = await fetch('/api/asesoria-legal', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(formData)
				});
				
				// console.log('Response status:', response.status);
				if (response.ok) {
					const newAbogado = await response.json();
					// console.log('Abogado creado:', newAbogado);
					abogados = [newAbogado, ...abogados];
				} else {
					const error = await response.json();
					console.error('Error response:', error);
				}
			}
			
			showModal = false;
			selectedAbogado = null;
		} catch (error) {
			console.error('Error guardando:', error);
			alert('Error al guardar. Intenta de nuevo.');
		}
	}

	async function handleToggleActive(id: number, activo: boolean) {
		try {
			const abogado = abogados.find((a) => a.id === id);
			if (!abogado) return;
			
			const response = await fetch(`/api/asesoria-legal/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...abogado, activo })
			});
			
			if (response.ok) {
				const updated = await response.json();
				const index = abogados.findIndex((a) => a.id === id);
				if (index !== -1) {
					abogados[index] = updated;
					abogados = abogados;
				}
			}
		} catch (error) {
			console.error('Error cambiando estado:', error);
			alert('Error al cambiar estado. Intenta de nuevo.');
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- <SidebarAdmin /> -->

	<!-- Main Content - Con margen para el sidebar flotante -->
	<main class="pl-80 pr-8 py-8">
		<!-- Encabezado -->
		<div class="flex justify-between items-center mb-8">
			<div>
				<h1 class="text-3xl font-bold text-gray-800">Gestión de Asesoría Legal</h1>
				<p class="text-gray-600 mt-1">Administra abogados y bufetes legales</p>
			</div>
			<button
				onclick={handleAddClick}
				class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Agregar Profesional
			</button>
		</div>

		<!-- Tabla -->
		<div class="bg-white rounded-lg shadow">
			{#if loading}
				<div class="flex justify-center items-center py-12">
					<div class="animate-spin">
						<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</div>
				</div>
			{:else}
				<!-- <AbogadoTable {abogados} onEdit={handleEdit} onToggleActive={handleToggleActive} /> -->
				<div class="p-8 text-center text-gray-500">Tabla de abogados (componente pendiente)</div>
			{/if}
		</div>
	</main>
</div>

<!-- AbogadoModal: componente pendiente -->
