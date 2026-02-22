<script lang="ts">
	import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte';
	import { onMount } from 'svelte';
	
	let usuarios = $state([]);
	let loading = $state(true);
	let error = $state(null);
	
	// Paginación
	let paginaActual = $state(1);
	let usuariosPorPagina = 20;
	let totalUsuarios = $state(0);
	
	// Filtros
	let busqueda = $state('');
	let filtroAdmin = $state('todos');
	let filtroBaneado = $state('todos');
	
	// Expandir detalles
	let usuarioExpandido = $state<string | null>(null);
	let anunciosUsuario = $state([]);
	let loadingAnuncios = $state(false);
	
	// Modal confirmación
	let showModal = $state(false);
	let modalData = $state<any>(null);
	
	onMount(() => {
		cargarUsuarios();
	});
	
	async function cargarUsuarios() {
		loading = true;
		error = null;
		
		try {
			const params = new URLSearchParams({
				busqueda,
				filtro_admin: filtroAdmin,
				filtro_baneado: filtroBaneado,
				pagina: paginaActual.toString(),
				limite: usuariosPorPagina.toString()
			});
			
			const response = await fetch(`/api/admin/usuarios?${params}`);
			
			if (!response.ok) throw new Error('Error al cargar usuarios');
			
			const data = await response.json();
			usuarios = data.usuarios || [];
			totalUsuarios = data.total || 0;
		} catch (err: any) {
			error = err.message;
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}
	
	// Recargar cuando cambian los filtros (resetear a página 1)
	$effect(() => {
		paginaActual = 1;
		cargarUsuarios();
	});
	
	// Cambiar página
	function cambiarPagina(nuevaPagina: number) {
		paginaActual = nuevaPagina;
		cargarUsuarios();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
	
	async function toggleUsuario(usuarioId: string) {
		if (usuarioExpandido === usuarioId) {
			usuarioExpandido = null;
			anunciosUsuario = [];
		} else {
			usuarioExpandido = usuarioId;
			await cargarAnunciosUsuario(usuarioId);
		}
	}
	
	async function cargarAnunciosUsuario(usuarioId: string) {
		loadingAnuncios = true;
		try {
			const response = await fetch(`/api/admin/usuarios/${usuarioId}/anuncios`);
			if (!response.ok) throw new Error('Error al cargar anuncios');
			
			const data = await response.json();
			anunciosUsuario = data.anuncios || [];
		} catch (err) {
			console.error('Error:', err);
			anunciosUsuario = [];
		} finally {
			loadingAnuncios = false;
		}
	}
	
	function abrirModal(usuario: any, accion: string) {
		modalData = { usuario, accion };
		showModal = true;
	}
	
	function cerrarModal() {
		showModal = false;
		modalData = null;
	}
	
	async function ejecutarAccion() {
		if (!modalData) return;
		
		const { usuario, accion } = modalData;
		
		try {
			let campo = '';
			let valor = false;
			
			if (accion === 'banear') {
				campo = 'esta_baneado';
				valor = true;
			} else if (accion === 'desbanear') {
				campo = 'esta_baneado';
				valor = false;
			} else if (accion === 'hacer_admin') {
				campo = 'es_admin';
				valor = true;
			} else if (accion === 'quitar_admin') {
				campo = 'es_admin';
				valor = false;
			}
			
			const response = await fetch('/api/admin/usuarios', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					usuario_id: usuario.id,
					campo,
					valor
				})
			});
			
			if (!response.ok) throw new Error('Error al actualizar usuario');
			
			await cargarUsuarios();
			cerrarModal();
		} catch (err: any) {
			error = err.message;
		}
	}
	
	// Stats generales
	let stats = $derived.by(() => ({
		total: totalUsuarios,
		admins: usuarios.filter((u: any) => u.es_admin).length,
		baneados: usuarios.filter((u: any) => u.esta_baneado).length,
		conAnuncios: usuarios.filter((u: any) => u.total_anuncios > 0).length
	}));
	
	// Paginación calculada
	let totalPaginas = $derived(Math.ceil(totalUsuarios / usuariosPorPagina));
	let paginasVisibles = $derived.by(() => {
		const paginas = [];
		const maxPaginas = 5;
		let inicio = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
		let fin = Math.min(totalPaginas, inicio + maxPaginas - 1);
		
		if (fin - inicio < maxPaginas - 1) {
			inicio = Math.max(1, fin - maxPaginas + 1);
		}
		
		for (let i = inicio; i <= fin; i++) {
			paginas.push(i);
		}
		return paginas;
	});
	
	function formatearFecha(fecha: string) {
		return new Date(fecha).toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-gray-50">
	<SidebarAdmin />

	<main class="pl-80 pr-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Gestión de Usuarios</h1>
			<p class="text-gray-600">Administra usuarios, permisos y estados de cuenta</p>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<p class="text-sm text-gray-600 mb-1">Total Usuarios</p>
				<p class="text-3xl font-bold text-gray-800">{stats.total}</p>
			</div>
			<div class="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-5">
				<p class="text-sm text-blue-700 mb-1">👑 Administradores</p>
				<p class="text-3xl font-bold text-blue-600">{stats.admins}</p>
			</div>
			<div class="bg-red-50 rounded-xl shadow-sm border border-red-100 p-5">
				<p class="text-sm text-red-700 mb-1">🚫 Baneados</p>
				<p class="text-3xl font-bold text-red-600">{stats.baneados}</p>
			</div>
			<div class="bg-green-50 rounded-xl shadow-sm border border-green-100 p-5">
				<p class="text-sm text-green-700 mb-1">📝 Con Anuncios</p>
				<p class="text-3xl font-bold text-green-600">{stats.conAnuncios}</p>
			</div>
		</div>

		<!-- Filtros -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<input
					type="text"
					bind:value={busqueda}
					placeholder="🔍 Buscar por nombre o email..."
					class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
				/>
				<select bind:value={filtroAdmin} class="px-4 py-2 border border-gray-300 rounded-lg">
					<option value="todos">Todos los roles</option>
					<option value="admin">Solo admins</option>
					<option value="usuario">Solo usuarios</option>
				</select>
				<select bind:value={filtroBaneado} class="px-4 py-2 border border-gray-300 rounded-lg">
					<option value="todos">Todos los estados</option>
					<option value="activo">Solo activos</option>
					<option value="baneado">Solo baneados</option>
				</select>
			</div>
		</div>

		<!-- Lista de Usuarios -->
		{#if loading}
			<div class="bg-white rounded-xl p-12 text-center">
				<div class="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
				<p class="text-gray-600">Cargando usuarios...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-xl p-6">
				<p class="text-red-800">❌ {error}</p>
			</div>
		{:else if usuarios.length === 0}
			<div class="bg-white rounded-xl p-12 text-center">
				<p class="text-gray-600">No se encontraron usuarios</p>
			</div>
		{:else}
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
				{#each usuarios as usuario}
					<div class="border-b border-gray-100 last:border-b-0">
						<!-- Fila principal del usuario -->
						<div class="p-6 hover:bg-gray-50 transition-colors">
							<div class="flex items-center justify-between gap-4">
								<div class="flex items-center gap-4 flex-1">
									<!-- Avatar -->
									<div class="w-14 h-14 rounded-full overflow-hidden bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
										{#if usuario.url_imagen}
											<img src={usuario.url_imagen} alt={usuario.nombre_completo || usuario.email} class="w-full h-full object-cover" />
										{:else}
											<span class="text-white font-bold text-xl">
												{usuario.nombre_completo?.charAt(0)?.toUpperCase() || usuario.email.charAt(0).toUpperCase()}
											</span>
										{/if}
									</div>
									
									<!-- Info del usuario -->
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1 flex-wrap">
											<p class="font-semibold text-gray-900 truncate">
												{usuario.nombre_completo || 'Sin nombre'}
											</p>
											{#if usuario.es_admin}
												<span class="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-700 whitespace-nowrap">
													👑 ADMIN
												</span>
											{/if}
											{#if usuario.esta_baneado}
												<span class="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700 whitespace-nowrap">
													🚫 BANEADO
												</span>
											{/if}
										</div>
										<p class="text-sm text-gray-600 truncate">{usuario.email}</p>
										<div class="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
											<span>📝 {usuario.total_anuncios} anuncios</span>
											<span>✅ {usuario.anuncios_activos} activos</span>
											<span>⏳ {usuario.anuncios_pendientes} pendientes</span>
											<span>👁️ {usuario.total_vistas.toLocaleString()} vistas</span>
											<span>📅 {formatearFecha(usuario.fecha_creacion)}</span>
										</div>
									</div>
								</div>
								
								<!-- Botones de acción -->
								<div class="flex gap-2 flex-wrap justify-end">
									{#if usuario.total_anuncios > 0}
										<button
											onclick={() => toggleUsuario(usuario.id)}
											class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap"
										>
											{usuarioExpandido === usuario.id ? '▲ Ocultar' : '▼ Ver'} Anuncios ({usuario.total_anuncios})
										</button>
									{/if}
									
									{#if usuario.esta_baneado}
										<button
											onclick={() => abrirModal(usuario, 'desbanear')}
											class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-green-600 text-green-600 bg-white hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap"
										>
											✓ Desbanear
										</button>
									{:else}
										<button
											onclick={() => abrirModal(usuario, 'banear')}
											class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-colors whitespace-nowrap"
										>
											🚫 Banear
										</button>
									{/if}
									
									{#if usuario.es_admin}
										<button
											onclick={() => abrirModal(usuario, 'quitar_admin')}
											class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-gray-600 text-gray-600 bg-white hover:bg-gray-600 hover:text-white transition-colors whitespace-nowrap"
										>
											👤 Quitar Admin
										</button>
									{:else}
										<button
											onclick={() => abrirModal(usuario, 'hacer_admin')}
											class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-amber-600 text-amber-600 bg-white hover:bg-amber-600 hover:text-white transition-colors whitespace-nowrap"
										>
											👑 Hacer Admin
										</button>
									{/if}
								</div>
							</div>
						</div>
						
						<!-- Anuncios expandidos -->
						{#if usuarioExpandido === usuario.id}
							<div class="px-6 pb-6 bg-gray-50">
								{#if loadingAnuncios}
									<p class="text-center text-gray-600 py-4">Cargando anuncios...</p>
								{:else if anunciosUsuario.length === 0}
									<p class="text-center text-gray-600 py-4">No hay anuncios</p>
								{:else}
									<div class="space-y-2">
										{#each anunciosUsuario as anuncio}
											<div class="bg-white rounded-lg p-4 flex justify-between items-center gap-4">
												<div class="flex-1 min-w-0">
													<p class="font-semibold text-gray-900 truncate">{anuncio.titulo}</p>
													<div class="flex gap-3 mt-1 text-xs text-gray-600 flex-wrap">
														<span class="px-2 py-0.5 rounded font-semibold {anuncio.estado === 'activo' ? 'bg-green-100 text-green-700' : anuncio.estado === 'pendiente_revision' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
															{anuncio.estado.replace('_', ' ')}
														</span>
														<span class="px-2 py-0.5 rounded font-semibold {anuncio.publico ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}">
															{anuncio.publico ? '👁️ Público' : '🔒 Privado'}
														</span>
														<span class="px-2 py-0.5 rounded font-semibold {anuncio.tipo_transaccion === 'venta' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
															{anuncio.tipo_transaccion}
														</span>
														<span>💰 {anuncio.moneda} {anuncio.precio?.toLocaleString()}</span>
														<span>👁️ {anuncio.vistas_total || 0} vistas</span>
													</div>
												</div>
												
												
												<a	href="/admin/propiedades/preview/{anuncio.id}"
													target="_blank"
													class="px-4 py-2.5 text-sm font-semibold rounded-lg border border-blue-600 text-blue-600 bg-white hover:bg-blue-600 hover:text-white transition-colors whitespace-nowrap"
												>
													👁️ Ver Preview
												</a>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Paginación -->
			{#if totalPaginas > 1}
				<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
					<div class="flex items-center justify-between gap-4 flex-wrap">
						<p class="text-sm text-gray-600">
							Mostrando {(paginaActual - 1) * usuariosPorPagina + 1} - {Math.min(paginaActual * usuariosPorPagina, totalUsuarios)} de {totalUsuarios} usuarios
						</p>
						
						<div class="flex gap-2">
							<button
								onclick={() => cambiarPagina(paginaActual - 1)}
								disabled={paginaActual === 1}
								class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								← Anterior
							</button>
							
							{#each paginasVisibles as pagina}
								<button
									onclick={() => cambiarPagina(pagina)}
									class="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors {paginaActual === pagina ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}"
								>
									{pagina}
								</button>
							{/each}
							
							<button
								onclick={() => cambiarPagina(paginaActual + 1)}
								disabled={paginaActual === totalPaginas}
								class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Siguiente →
							</button>
						</div>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Modal Confirmación -->
		{#if showModal && modalData}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000 p-5">
				<div class="bg-white rounded-xl p-6 max-w-md w-full">
					<h3 class="text-xl font-bold text-gray-900 mb-2">
						{#if modalData.accion === 'banear'}
							🚫 Banear Usuario
						{:else if modalData.accion === 'desbanear'}
							✓ Desbanear Usuario
						{:else if modalData.accion === 'hacer_admin'}
							👑 Hacer Administrador
						{:else}
							👤 Quitar Administrador
						{/if}
					</h3>
					<p class="text-sm text-gray-600 mb-5">
						{modalData.usuario.nombre_completo || modalData.usuario.email}
					</p>
					
					<p class="text-sm text-gray-700 mb-6">
						{#if modalData.accion === 'banear'}
							¿Estás seguro de banear a este usuario? No podrá acceder a la plataforma.
						{:else if modalData.accion === 'desbanear'}
							¿Estás seguro de desbanear a este usuario? Podrá volver a acceder.
						{:else if modalData.accion === 'hacer_admin'}
							¿Estás seguro de dar permisos de administrador a este usuario?
						{:else}
							¿Estás seguro de quitar permisos de administrador a este usuario?
						{/if}
					</p>

					<div class="flex gap-3">
						<button
							onclick={cerrarModal}
							class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
						>
							Cancelar
						</button>
						<button
							onclick={ejecutarAccion}
							class="flex-1 px-4 py-2.5 {modalData.accion === 'banear' ? 'bg-red-500 hover:bg-red-600' : modalData.accion === 'hacer_admin' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg text-sm font-semibold transition-colors"
						>
							Confirmar
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>