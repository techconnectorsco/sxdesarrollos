<script>
	import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte';
	import HistorialBoletines from '$lib/components/app/admin/HistorialBoletines.svelte';
	
	let { data } = $props();

	
	let historialRef;
	let selectedFile = $state(null);
	let processing = $state(false);
	let saving = $state(false);
	let resultado = $state(null);
	let error = $state(null);
	let previewData = $state(null);
	let progress = $state({ current: 0, total: 0, percentage: 0 });
	let processingLog = $state([]);
	let expandedRow = $state(null); // Para expandir raw_text
	let stats = $state({
		totalEntradas: 0,
		rematesPropiedades: 0,
		insertados: 0,
		actualizados: 0,
		errores: 0
	});

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file && file.name.endsWith('.txt')) {
			selectedFile = file;
			error = null;
			previewData = null;
			resultado = null;
			progress = { current: 0, total: 0, percentage: 0 };
			processingLog = [];
		} else {
			error = 'Por favor selecciona un archivo .txt válido';
			selectedFile = null;
		}
	}

	async function procesarBoletin() {
		if (!selectedFile) {
			error = 'Debes seleccionar un archivo primero';
			return;
		}

		processing = true;
		error = null;
		previewData = null;
		processingLog = ['📄 Iniciando procesamiento...'];
		progress = { current: 0, total: 0, percentage: 0 };

		try {
			// Preparar FormData
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('preview_only', 'true');
			formData.append('stream_progress', 'true'); // Activar streaming
			
			const bulletinMatch = selectedFile.name.match(/N[°_\s]*(\d+)/i);
			const bulletinNumber = bulletinMatch ? bulletinMatch[1] : null;
			
			if (bulletinNumber) {
				formData.append('bulletin_number', bulletinNumber);
			}

			processingLog = [...processingLog, '🔍 Analizando archivo...'];

			// Usar fetch normal para enviar
			const response = await fetch('/api/admin/procesar-remates', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				error = errorData.message || 'Error al procesar el archivo';
				processingLog = [...processingLog, `❌ ${error}`];
				processing = false;
				return;
			}

			// Leer el stream de eventos
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;

					const eventData = JSON.parse(line.substring(6));

					if (eventData.type === 'total') {
						// Recibir total de remates
						progress = { current: 0, total: eventData.total, percentage: 0 };
						//processingLog = [...processingLog, `✅ Encontrados: ${eventData.total} remates de propiedades`];
						processingLog = [
						...processingLog, 
						/* `📊 Total remates en archivo: ${eventData.total}`, */
						/* `✨ Regex identificó: ${eventData.con_matricula_regex}`,
						`⏭️  Saltando (Ya existen): ${eventData.existentes}`, */
						`🔥 Enviando a OpenAI: ${eventData.total_openai}`
					];
					}
					else if (eventData.type === 'progress') {
						// Actualizar progreso REAL
						progress = {
							current: eventData.current,
							total: eventData.total,
							percentage: Math.round((eventData.current / eventData.total) * 100)
						};
					}
					else if (eventData.type === 'complete') {
    previewData = eventData;
    stats = eventData.stats || stats;
    processingLog = [
        ...processingLog, 
        '✅ EXTRACCIÓN COMPLETADA',
        `🚀 ${eventData.total_nuevos} remates listos para ser insertados.` // Cambiado para ser más claro
    ];
}
					else if (eventData.type === 'error_critico') {
	error = `❌ ERROR CRÍTICO en remate #${eventData.remate_numero}: ${eventData.error}`;
	processingLog = [...processingLog, `❌ ${error}`];
	processingLog = [...processingLog, `📌 Posible causa: ${eventData.detalles.posible_causa}`];
	processing = false; // Detener procesamiento
}
else if (eventData.type === 'error_remate') {
	processingLog = [...processingLog, 
		`⚠️ Remate #${eventData.remate_numero}: ${eventData.error}`
	];
}
				}
			}

		} catch (err) {
			error = 'Error de conexión: ' + err.message;
			processingLog = [...processingLog, `❌ Error: ${err.message}`];
			console.error('Error:', err);
		} finally {
			processing = false;
		}
	}

	async function guardarEnBaseDatos() {
	if (!previewData || !previewData.data) {
		error = 'No hay datos para guardar. Procesa primero.';
		return;
	}

	saving = true;
	error = null;

	try {
		const bulletinMatch = selectedFile.name.match(/N[°_\s]*(\d+)/i);
		const bulletinNumber = bulletinMatch ? bulletinMatch[1] : null;
		
		// OBTENER USER ID DEL CLIENTE
		const userId = data.user?.id;
		// console.log('👤 User ID:', userId);
		
		const bodyData = {
			remates: previewData.data,
			bulletin_number: bulletinNumber,
			user_id: userId
		};

	
		const response = await fetch('/api/admin/guardar-remates', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(bodyData)
		});

	
		const responseData = await response.json();


		if (response.ok) {
			resultado = responseData;  
			stats = responseData.stats || stats; 
			previewData = null;
			
			if (historialRef?.refrescar) {
				historialRef.refrescar();
			}
		} else {
			error = responseData.message || 'Error al guardar';
		}
	} catch (err) {
		console.error('💥 ERROR COMPLETO:', err);
		console.error('   Stack:', err.stack);
		error = 'Error de conexión: ' + err.message;
	} finally {
		saving = false;
	}
}

	function reiniciar() {
		// Limpiar todo para procesar otro boletín
		selectedFile = null;
		previewData = null;
		resultado = null;
		error = null;
		processingLog = [];
		progress = { current: 0, total: 0, percentage: 0 };
		stats = {
			totalEntradas: 0,
			rematesPropiedades: 0,
			insertados: 0,
			actualizados: 0,
			errores: 0
		};
		
		//REFRESCAR HISTORIAL AL REINICIAR
		if (historialRef?.refrescar) {
			historialRef.refrescar();
		}
	}

	function descargarCSV() {
		const csvData = previewData?.csv_data || resultado?.csv_data;
		if (!csvData) return;
		
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `remates_preview_${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<SidebarAdmin />

	<!-- Main Content -->
	<main class="pl-80 pr-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Procesar Remates Judiciales</h1>
			<p class="text-gray-600">
				Sube el boletín judicial (.txt) → Previsualiza los datos → Confirma para guardar en base de datos
			</p>
		</div>

		<!-- HISTORIAL DE PROCESAMIENTOS -->
		<div class="mb-6">
			<HistorialBoletines bind:this={historialRef} />
		</div>

		<!-- Upload Section -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
			<label for="file-upload" class="block text-sm font-semibold text-gray-700 mb-3">
				📁 Seleccionar Boletín Judicial (.txt)
			</label>
			
			<div class="flex items-center gap-4">
				<input
					id="file-upload"
					type="file"
					accept=".txt"
					onchange={handleFileSelect}
					class="block w-full text-sm text-gray-600
						file:mr-4 file:py-2.5 file:px-4
						file:rounded-xl file:border-0
						file:text-sm file:font-semibold
						file:bg-blue-50 file:text-blue-600
						hover:file:bg-blue-100
						file:transition-colors file:duration-200
						cursor-pointer"
				/>
			</div>

			{#if selectedFile}
				<div class="mt-4 p-4 bg-linear-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
					<p class="text-sm text-blue-800 font-medium">
						✓ Archivo seleccionado: <span class="font-bold">{selectedFile.name}</span>
					</p>
					<p class="text-xs text-blue-600 mt-1">
						Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB
					</p>
				</div>
			{/if}

			<button
				onclick={procesarBoletin}
				disabled={!selectedFile || processing || !!previewData}
				class="mt-6 w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl 
					hover:from-blue-600 hover:to-blue-700 
					disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
					transition-all duration-200 font-semibold shadow-sm hover:shadow-md
					flex items-center justify-center gap-2"
			>
				{#if processing}
					<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Extrayendo datos con IA...
				{:else}
					🤖 Extraer y Previsualizar
				{/if}
			</button>
		</div>

		<!-- Processing Log -->
		{#if processing || processingLog.length > 0}
			<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
				<h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
					<span class="text-lg">📋</span> Log de Procesamiento
				</h3>
				
				<!-- Barra de progreso -->
				{#if progress.total > 0}
					<div class="mb-4">
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm font-medium text-gray-700">
								Progreso: {progress.current}/{progress.total} remates
							</span>
							<span class="text-sm font-bold text-blue-600">
								{progress.percentage}%
							</span>
						</div>
						<div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
							<div 
								class="bg-linear-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out shadow-sm"
								style="width: {progress.percentage}%"
							></div>
						</div>
					</div>
				{/if}

				<!-- Log entries -->
				<div class="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-48 overflow-y-auto">
					{#each processingLog as logEntry}
						<p class="text-xs text-gray-700 font-mono mb-1.5 leading-relaxed">{logEntry}</p>
					{/each}
					{#if processing && progress.current < progress.total}
						<p class="text-xs text-blue-600 font-mono animate-pulse mt-2">⏳ Extrayendo datos con IA...</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Error Display -->
		{#if error}
	<div class="bg-linear-to-r from-red-50 to-red-100 border border-red-300 rounded-2xl p-6 mb-6 shadow-md">
		<div class="flex items-start gap-4">
			<span class="text-4xl">🚨</span>
			<div>
				<p class="text-red-900 font-bold text-base">ERROR CRÍTICO</p>
				<p class="text-red-800 text-sm mt-2 font-mono">{error}</p>
				<p class="text-red-700 text-xs mt-3 italic">
					Revisa tu API Key de OpenAI o contacta soporte si el problema persiste
				</p>
			</div>
		</div>
	</div>
{/if}

		<!-- Preview Data Table -->
		{#if previewData}
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
						<span class="text-2xl">👁️</span>
						Vista Previa - {previewData.data.length} Remates
					</h2>
					<button
						onclick={descargarCSV}
						class="px-5 py-2.5 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl 
							hover:from-green-600 hover:to-green-700 
							transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md
							flex items-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Descargar CSV
					</button>
				</div>

				<!-- Table -->
				<div class="overflow-x-auto rounded-xl border border-gray-200">
					<div class="max-h-[600px] overflow-y-auto">
						<table class="min-w-full divide-y divide-gray-200 text-xs">
							<thead class="bg-linear-to-r from-gray-50 to-gray-100 sticky top-0">
								<tr>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Matrícula</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Finca ID</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provincia</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cantón</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distrito</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Naturaleza</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Área m²</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Base</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">1ra Subasta</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">2da Subasta</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">3ra Subasta</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Caso</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Demandante</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Demandado</th>
									<th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Raw Text</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-100">
								{#each previewData.data as remate, i}
									<!-- Fila principal -->
									<tr class="hover:bg-blue-50 transition-colors duration-150">
										<td class="px-3 py-3 text-xs text-gray-900 font-medium">{i + 1}</td>
										<td class="px-3 py-3 text-xs font-semibold text-gray-900">{remate.matricula || '-'}</td>
										<td class="px-3 py-3 text-xs text-gray-600">{remate.finca_id || '-'}</td>
										<td class="px-3 py-3 text-xs text-gray-600">{remate.provincia || '-'}</td>
										<td class="px-3 py-3 text-xs text-gray-600">{remate.canton || '-'}</td>
										<td class="px-3 py-3 text-xs text-gray-600">{remate.distrito || '-'}</td>
										<td class="px-3 py-3 text-xs text-gray-600 max-w-xs truncate" title={remate.naturaleza}>
											{remate.naturaleza || '-'}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600">
											{remate.area_numeric ? remate.area_numeric.toLocaleString() : '-'}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600 font-medium">
											{#if remate.base_price_numeric}
												{remate.currency === 'USD' ? '$' : '₡'}{remate.base_price_numeric.toLocaleString()}
											{:else}
												-
											{/if}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600">
											{#if remate.first_auction_date}
												{remate.first_auction_date}
												{#if remate.first_auction_time}
													<br><span class="text-blue-600">{remate.first_auction_time}</span>
												{/if}
											{:else}
												-
											{/if}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600">
											{#if remate.second_auction_date}
												{remate.second_auction_date}<br>
												<span class="font-medium">{remate.second_auction_base ? `${remate.currency === 'USD' ? '$' : '₡'}${remate.second_auction_base.toLocaleString()}` : ''}</span>
											{:else}
												-
											{/if}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600">
											{#if remate.third_auction_date}
												{remate.third_auction_date}<br>
												<span class="font-medium">{remate.third_auction_base ? `${remate.currency === 'USD' ? '$' : '₡'}${remate.third_auction_base.toLocaleString()}` : ''}</span>
											{:else}
												-
											{/if}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600 max-w-xs truncate" title={remate.case_type}>
											{remate.case_type || '-'}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600 max-w-xs truncate" title={remate.plaintiff}>
											{remate.plaintiff || '-'}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600 max-w-xs truncate" title={remate.defendant}>
											{remate.defendant || '-'}
										</td>
										<td class="px-3 py-3 text-xs text-gray-600">
											{#if remate.raw_text}
												<button
													onclick={() => expandedRow = expandedRow === i ? null : i}
													class="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
												>
													{expandedRow === i ? '▼' : '▶'} Ver texto
												</button>
											{:else}
												<span class="text-red-500 font-medium">❌ Falta</span>
											{/if}
										</td>
									</tr>

									<!-- Fila expandida con raw_text -->
									{#if expandedRow === i && remate.raw_text}
										<tr class="bg-linear-to-r from-blue-50 to-blue-100">
											<td colspan="16" class="px-6 py-4">
												<div class="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
													<div class="flex justify-between items-center mb-3">
														<h4 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
															<span class="text-lg">📄</span> Texto Original del Boletín - Remate #{i + 1}
														</h4>
														<button
															onclick={() => expandedRow = null}
															class="text-gray-400 hover:text-gray-600 font-bold text-lg"
														>
															✕
														</button>
													</div>
													<div class="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-96 overflow-y-auto">
														<pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{remate.raw_text}</pre>
													</div>
												</div>
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Confirm Button -->
				<div class="mt-6">
					<button
						onclick={guardarEnBaseDatos}
						disabled={saving}
						class="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl 
							hover:from-blue-600 hover:to-blue-700 
							disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
							transition-all duration-200 font-semibold shadow-md hover:shadow-lg
							flex items-center justify-center gap-2 text-base"
					>
						{#if saving}
							<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Guardando en Base de Datos...
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							✅ Confirmar y Guardar en Base de Datos
						{/if}
					</button>
				</div>
			</div>
		{/if}

		<!-- Results Display -->
		{#if resultado}
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
				<h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
					<span class="text-3xl">✅</span> Procesamiento Completado
				</h2>
				
				<!-- Stats Grid -->
				<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
					<div class="bg-linear-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
						<p class="text-xs text-gray-600 mb-2 font-medium">Total Entradas</p>
						<p class="text-3xl font-bold text-gray-800">{stats.totalEntradas}</p>
					</div>
					<div class="bg-linear-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
						<p class="text-xs text-blue-700 mb-2 font-medium">Remates Propiedades</p>
						<p class="text-3xl font-bold text-blue-800">{stats.rematesPropiedades}</p>
					</div>
					<div class="bg-linear-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
						<p class="text-xs text-green-700 mb-2 font-medium">Insertados</p>
						<p class="text-3xl font-bold text-green-800">{stats.insertados}</p>
					</div>
					<div class="bg-linear-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
						<p class="text-xs text-yellow-700 mb-2 font-medium">Actualizados</p>
						<p class="text-3xl font-bold text-yellow-800">{stats.actualizados}</p>
					</div>
					<div class="bg-linear-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
						<p class="text-xs text-red-700 mb-2 font-medium">Errores</p>
						<p class="text-3xl font-bold text-red-800">{stats.errores}</p>
					</div>
				</div>

				<!-- CSV Download -->
				{#if resultado.csv_data}
					<button
						onclick={descargarCSV}
						class="w-full bg-linear-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl 
							hover:from-green-600 hover:to-green-700 
							transition-all duration-200 font-semibold shadow-sm hover:shadow-md
							flex items-center justify-center gap-2 mb-6"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						📥 Descargar CSV de Prueba
					</button>
				{/if}

				<!-- Processing Log -->
				{#if resultado.log && resultado.log.length > 0}
					<div class="bg-gray-50 rounded-xl border border-gray-200 p-5">
						<h3 class="text-sm font-semibold text-gray-700 mb-3">📋 Log de Procesamiento</h3>
						<div class="bg-white rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-100">
							{#each resultado.log as logEntry}
								<p class="text-xs text-gray-600 mb-1.5 font-mono leading-relaxed">{logEntry}</p>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Botón Procesar Otro -->
				<button
					onclick={reiniciar}
					class="mt-6 w-full bg-linear-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-xl 
						hover:from-purple-600 hover:to-purple-700 
						transition-all duration-200 font-semibold shadow-md hover:shadow-lg
						flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					🔄 Procesar Otro Boletín
				</button>
			</div>
		{/if}
	</main>
</div>