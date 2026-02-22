<script>
	import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte';
</script>

<div class="min-h-screen bg-gray-50">
	<SidebarAdmin />

	<!-- Main Content -->
	<main class="pl-80 pr-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Consultas</h1>
			<p class="text-gray-600">
				Gestión de consultas y leads de usuarios
			</p>
		</div>

		<!-- Placeholder Content -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
			<div class="text-center py-12">
				<div class="text-6xl mb-4">💬</div>
				<h2 class="text-xl font-semibold text-gray-700 mb-2">Módulo en Desarrollo</h2>
				<p class="text-gray-500">
					La gestión de consultas estará disponible próximamente
				</p>
			</div>
		</div>
	</main>
</div>