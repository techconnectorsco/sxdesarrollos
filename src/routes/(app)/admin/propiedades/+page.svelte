<script>
	// import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte'; // componente pendiente

	let { data } = $props();
	
	let anuncios = $state([]);
	let loading = $state(true);
	let error = $state(null);
	
	// Filtros
	let filtroTipo = $state('todos');
	let filtroEstado = $state('todos');
	let filtroPublico = $state('todos');
	let busqueda = $state('');
	
	// Paginación
	let paginaActual = $state(1);
	let itemsPorPagina = $state(20);
	
	// Modal rechazar
	let showModalRechazo = $state(false);
	let anuncioARechazar = $state(null);
	let razonRechazo = $state('');
	let notasAdmin = $state('');
	
	// Cargar anuncios
	$effect(() => {
		cargarAnuncios();
	});
	
	async function cargarAnuncios() {
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/admin/anuncios');
			
			if (!response.ok) throw new Error('Error al cargar anuncios');
			
			const responseData = await response.json();
			anuncios = responseData.anuncios || [];
		} catch (err) {
			error = err.message;
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}
	
	async function aprobarAnuncio(anuncioId) {
		try {
			const response = await fetch('/api/admin/anuncios', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					anuncio_id: anuncioId,
					action: 'aprobar',
					revisado_por: data.user?.id
				})
			});
			
			if (!response.ok) throw new Error('Error al aprobar');
			
			await cargarAnuncios();
		} catch (err) {
			error = err.message;
		}
	}
	
	function abrirModalRechazo(anuncio) {
		anuncioARechazar = anuncio;
		razonRechazo = '';
		notasAdmin = '';
		showModalRechazo = true;
	}
	
	function cerrarModalRechazo() {
		showModalRechazo = false;
		anuncioARechazar = null;
		razonRechazo = '';
		notasAdmin = '';
	}
	
	async function rechazarAnuncio() {
		if (!razonRechazo.trim()) {
			alert('Debes escribir una razón de rechazo');
			return;
		}
		
		try {
			const response = await fetch('/api/admin/anuncios', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					anuncio_id: anuncioARechazar.id,
					action: 'rechazar',
					razon_rechazo: razonRechazo,
					notas_admin: notasAdmin,
					revisado_por: data.user?.id
				})
			});
			
			if (!response.ok) throw new Error('Error al rechazar');
			
			await cargarAnuncios();
			cerrarModalRechazo();
		} catch (err) {
			error = err.message;
		}
	}
	
	async function cambiarVisibilidad(anuncioId, nuevoEstado) {
		try {
			const response = await fetch('/api/admin/anuncios', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					anuncio_id: anuncioId,
					publico: nuevoEstado
				})
			});
			
			if (!response.ok) throw new Error('Error al cambiar visibilidad');
			
			await cargarAnuncios();
		} catch (err) {
			error = err.message;
		}
	}
	
	// Filtros
	let anunciosFiltrados = $derived.by(() => {
		let resultado = anuncios;
		
		if (filtroTipo !== 'todos') {
			resultado = resultado.filter(a => a.tipo_transaccion === filtroTipo);
		}
		
		if (filtroEstado !== 'todos') {
			resultado = resultado.filter(a => a.estado === filtroEstado);
		}
		
		if (filtroPublico !== 'todos') {
			const esPublico = filtroPublico === 'publico';
			resultado = resultado.filter(a => a.publico === esPublico);
		}
		
		if (busqueda.trim()) {
			const termino = busqueda.toLowerCase();
			resultado = resultado.filter(a => 
				a.titulo?.toLowerCase().includes(termino) ||
				a.contacto_nombre?.toLowerCase().includes(termino) ||
				a.contacto_email?.toLowerCase().includes(termino)
			);
		}
		
		return resultado;
	});
	
	// Paginación
	let totalPaginas = $derived(Math.ceil(anunciosFiltrados.length / itemsPorPagina));
	let anunciosPaginados = $derived(
		anunciosFiltrados.slice(
			(paginaActual - 1) * itemsPorPagina,
			paginaActual * itemsPorPagina
		)
	);
	
	// Stats
	let stats = $derived.by(() => ({
		total: anuncios.length,
		pendientes: anuncios.filter(a => a.estado === 'pendiente_revision').length,
		activos: anuncios.filter(a => a.estado === 'activo').length,
		publicos: anuncios.filter(a => a.publico === true).length,
		rechazados: anuncios.filter(a => a.estado === 'rechazado').length
	}));
</script>

<div class="min-h-screen bg-gray-50">
	<!-- <SidebarAdmin /> -->

	<main class="pl-80 pr-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Propiedades</h1>
			<p class="text-gray-600">Administra todos los anuncios de venta, alquiler y proyectos</p>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<p class="text-sm text-gray-600 mb-1">Total</p>
				<p class="text-3xl font-bold text-gray-800">{stats.total}</p>
			</div>
			<div class="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 p-5">
				<p class="text-sm text-yellow-700 mb-1">⏳ Pendientes</p>
				<p class="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
			</div>
			<div class="bg-green-50 rounded-xl shadow-sm border border-green-100 p-5">
				<p class="text-sm text-green-700 mb-1">✅ Activos</p>
				<p class="text-3xl font-bold text-green-600">{stats.activos}</p>
			</div>
			<div class="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-5">
				<p class="text-sm text-blue-700 mb-1">👁️ Públicos</p>
				<p class="text-3xl font-bold text-blue-600">{stats.publicos}</p>
			</div>
			<div class="bg-red-50 rounded-xl shadow-sm border border-red-100 p-5">
				<p class="text-sm text-red-700 mb-1">❌ Rechazados</p>
				<p class="text-3xl font-bold text-red-600">{stats.rechazados}</p>
			</div>
		</div>

		<!-- Filtros -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<input
					type="text"
					bind:value={busqueda}
					placeholder="🔍 Buscar..."
					class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
				<select bind:value={filtroTipo} class="px-4 py-2 border border-gray-300 rounded-lg">
					<option value="todos">Todos los tipos</option>
					<option value="venta">Venta</option>
					<option value="alquiler">Alquiler</option>
					<option value="proyecto">Proyecto</option>
				</select>
				<select bind:value={filtroEstado} class="px-4 py-2 border border-gray-300 rounded-lg">
					<option value="todos">Todos los estados</option>
					<option value="pendiente_revision">Pendiente</option>
					<option value="activo">Activo</option>
					<option value="rechazado">Rechazado</option>
				</select>
				<select bind:value={filtroPublico} class="px-4 py-2 border border-gray-300 rounded-lg">
					<option value="todos">Toda visibilidad</option>
					<option value="publico">Público</option>
					<option value="privado">Privado</option>
				</select>
			</div>
		</div>

		<!-- Tabla -->
		{#if loading}
			<div class="bg-white rounded-xl p-12 text-center">
				<div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
				<p class="text-gray-600">Cargando...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-xl p-6">
				<p class="text-red-800">❌ {error}</p>
			</div>
		{:else if anunciosPaginados.length === 0}
			<div class="bg-white rounded-xl p-12 text-center">
				<p class="text-gray-600">No se encontraron anuncios</p>
			</div>
		{:else}
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Anuncio</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Público</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each anunciosPaginados as anuncio}
							<tr class="hover:bg-gray-50">
								<!-- Anuncio -->
								<td class="px-4 py-4">
									<p class="text-sm font-semibold text-gray-900">{anuncio.titulo}</p>
									<p class="text-xs text-gray-500">Finca: {anuncio.finca_id}</p>
								</td>
								
								<!-- Tipo -->
								<td class="px-4 py-4">
									<span class="px-2 py-1 text-xs font-bold rounded-full
										{anuncio.tipo_transaccion === 'venta' ? 'bg-green-100 text-green-700' : 
										 anuncio.tipo_transaccion === 'alquiler' ? 'bg-blue-100 text-blue-700' : 
										 'bg-purple-100 text-purple-700'}">
										{anuncio.tipo_transaccion}
									</span>
								</td>
								
								<!-- Precio -->
								<td class="px-4 py-4 text-sm font-medium text-gray-900">
									{anuncio.moneda === 'USD' ? '$' : '₡'}{parseFloat(anuncio.precio).toLocaleString()}
								</td>
								
								<!-- Usuario -->
								<td class="px-4 py-4">
									<p class="text-sm text-gray-900">{anuncio.contacto_nombre}</p>
									<p class="text-xs text-gray-500">{anuncio.contacto_email}</p>
								</td>
								
								<!-- Estado -->
								<td class="px-4 py-4">
									<span class="px-2 py-1 text-xs font-bold rounded-full
										{anuncio.estado === 'activo' ? 'bg-green-100 text-green-700' : 
										 anuncio.estado === 'pendiente_revision' ? 'bg-yellow-100 text-yellow-700' : 
										 'bg-red-100 text-red-700'}">
										{anuncio.estado.replace('_', ' ')}
									</span>
								</td>
								
								<!-- Público -->
								<td class="px-4 py-4">
									<button
										onclick={() => cambiarVisibilidad(anuncio.id, !anuncio.publico)}
										class="px-2 py-1 text-xs font-bold rounded-full transition
											{anuncio.publico ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
										{anuncio.publico ? '👁️ Público' : '🔒 Privado'}
									</button>
								</td>
								
								<!-- Acciones -->
								<td class="px-4 py-4">
									<div class="flex flex-col gap-2">
										<!-- Ver Preview -->
										
										<a	href="/admin/propiedades/preview/{anuncio.id}"
											target="_blank"
											class="px-4 py-1 text-sm font-semibold rounded-lg border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-colors text-center">
											👁️ Ver Preview
										</a>
										
										<!-- Aprobar/Rechazar si está pendiente -->
										{#if anuncio.estado === 'pendiente_revision'}
											<button
												onclick={() => aprobarAnuncio(anuncio.id)}
												class="px-4 py-1 text-sm font-semibold rounded-lg border border-green-600 text-green-600 bg-white hover:bg-green-600 hover:text-white transition-colors">
												✓ Aprobar
											</button>
											<button
												onclick={() => abrirModalRechazo(anuncio)}
												class="px-4 py-1 text-sm font-semibold rounded-lg border border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-colors">
												✗ Rechazar
											</button>
										{/if}
										
										<!-- ✅ NUEVO: Rechazar anuncios ya publicados -->
										{#if anuncio.estado === 'activo' && anuncio.publico}
											<button
												onclick={() => abrirModalRechazo(anuncio)}
												class="px-4 py-1 text-sm font-semibold rounded-lg border border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-colors">
												🚫 Rechazar
											</button>
										{/if}
										
										<!-- ✅ NUEVO: Re-aprobar anuncios rechazados -->
										{#if anuncio.estado === 'rechazado'}
											<button
												onclick={() => aprobarAnuncio(anuncio.id)}
												class="px-4 py-1 text-sm font-semibold rounded-lg border border-green-600 text-green-600 bg-white hover:bg-green-600 hover:text-white transition-colors">
												✓ Re-aprobar
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<!-- Paginación -->
				{#if totalPaginas > 1}
					<div class="bg-gray-50 px-6 py-4 flex justify-between border-t">
						<p class="text-sm text-gray-600">
							{(paginaActual - 1) * itemsPorPagina + 1} - 
							{Math.min(paginaActual * itemsPorPagina, anunciosFiltrados.length)} de 
							{anunciosFiltrados.length}
						</p>
						<div class="flex gap-2">
							<button
								onclick={() => paginaActual--}
								disabled={paginaActual === 1}
								class="px-4 py-2 border rounded-lg disabled:opacity-50">
								Anterior
							</button>
							<button
								onclick={() => paginaActual++}
								disabled={paginaActual === totalPaginas}
								class="px-4 py-2 border rounded-lg disabled:opacity-50">
								Siguiente
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Modal Rechazar -->
		{#if showModalRechazo}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div class="bg-white rounded-xl p-6 max-w-md w-full">
					<h3 class="text-lg font-bold text-gray-800 mb-4">
						{anuncioARechazar?.estado === 'activo' ? '🚫 Rechazar Anuncio Publicado' : '❌ Rechazar Anuncio'}
					</h3>
					<p class="text-sm text-gray-600 mb-4">{anuncioARechazar?.titulo}</p>
					
					{#if anuncioARechazar?.estado === 'activo'}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
							<p class="text-sm text-yellow-800">
								⚠️ Este anuncio ya está publicado. Al rechazarlo, dejará de ser visible para los usuarios.
							</p>
						</div>
					{/if}
					
					<div class="mb-4">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-sm font-semibold text-gray-700 mb-2">
							Razón de rechazo (visible al usuario) *
						</label>
						<textarea
							bind:value={razonRechazo}
							placeholder="Ejemplo: Las fotos no muestran claramente la propiedad..."
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
							rows="3"></textarea>
					</div>

					<div class="mb-6">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="block text-sm font-semibold text-gray-700 mb-2">
							Notas internas (solo admin)
						</label>
						<textarea
							bind:value={notasAdmin}
							placeholder="Notas privadas para el equipo admin..."
							class="w-full px-3 py-2 border rounded-lg"
							rows="2"></textarea>
					</div>

					<div class="flex gap-3">
						<button
							onclick={cerrarModalRechazo}
							class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
							Cancelar
						</button>
						<button
							onclick={rechazarAnuncio}
							class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">
							Rechazar
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>