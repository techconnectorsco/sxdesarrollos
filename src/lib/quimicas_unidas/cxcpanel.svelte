<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		AuditoriaCliente,
		ClienteSAP,
		CuentaPadre,
		MetodoEnvio
	} from '$lib/quimicas_unidas/types';

	let { apiBase = '/quimicas_unidas/api' } = $props();

	// ── Carga de clientes ──
	let cargando = $state(true);
	let errorCarga = $state<string | null>(null);
	let clientes = $state<ClienteSAP[]>([]);
	let padres = $state<CuentaPadre[]>([]);
	let total = $state(0);

	const hijasPorPadre = $derived(new Map(padres.map((p) => [p.cardCode, p.hijos.length])));

	// ── Solicitud de envío ──
	let metodo = $state<MetodoEnvio>('cliente');
	let alcance = $state<'completo' | 'cliente'>('cliente');
	const alcanceEfectivo = $derived(metodo === 'revision' ? 'cliente' : alcance);

	let busqueda = $state('');
	let mostrarSugerencias = $state(false);
	let seleccionados = $state<ClienteSAP[]>([]);

	const sugerencias = $derived.by(() => {
		const q = busqueda.trim().toLowerCase();
		const yaElegidos = new Set(seleccionados.map((c) => c.cardCode));
		const base = clientes.filter((c) => !yaElegidos.has(c.cardCode));
		const filtrados = q
			? base.filter(
					(c) => c.cardCode.toLowerCase().includes(q) || c.cardName.toLowerCase().includes(q)
				)
			: base;
		return filtrados.slice(0, 50);
	});

	let ejecutando = $state(false);
	let resultado = $state<{ ok: boolean; texto: string } | null>(null);

	// Correo destino para el modo revisión (editable, default crédito)
	let correoRevision = $state('credito@qu.cr');

	const ayudaMetodo = $derived(
		metodo === 'cliente'
			? 'El estado de cuenta se envía directo a los correos del cliente registrados en SAP.'
			: 'El estado de cuenta llegará al correo indicado abajo. El cliente no lo recibe.'
	);

	// ── Consulta / auditoría ──
	let auditTexto = $state('');
	let auditSel = $state<ClienteSAP | null>(null);
	let auditSugerencias = $state(false);
	let auditCargando = $state(false);
	let auditError = $state<string | null>(null);
	let auditData = $state<AuditoriaCliente | null>(null);

	const auditFiltrados = $derived.by(() => {
		const q = auditTexto.trim().toLowerCase();
		if (!q) return clientes.slice(0, 50);
		return clientes
			.filter((c) => c.cardCode.toLowerCase().includes(q) || c.cardName.toLowerCase().includes(q))
			.slice(0, 50);
	});

	async function cargarClientes() {
		cargando = true;
		errorCarga = null;
		try {
			const res = await fetch(`${apiBase}/clientes`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			clientes = data.clientes;
			padres = data.padres;
			total = data.total;
		} catch (e) {
			errorCarga = 'No se pudo cargar la lista de clientes. Verificá la conexión al Service Layer.';
			console.error(e);
		} finally {
			cargando = false;
		}
	}

	function agregar(c: ClienteSAP) {
		if (!seleccionados.some((s) => s.cardCode === c.cardCode)) {
			seleccionados = [...seleccionados, c];
		}
		busqueda = '';
		mostrarSugerencias = false;
	}

	function quitar(code: string) {
		seleccionados = seleccionados.filter((c) => c.cardCode !== code);
	}

	async function ejecutar() {
		resultado = null;
		if (alcanceEfectivo === 'cliente' && seleccionados.length === 0) {
			resultado = { ok: false, texto: 'Seleccioná al menos un cliente.' };
			return;
		}
		ejecutando = true;
		try {
			const res = await fetch(`${apiBase}/ejecutar`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					metodo,
					alcance: alcanceEfectivo,
					cardCodes: alcanceEfectivo === 'cliente' ? seleccionados.map((c) => c.cardCode) : [],
					correoRevision: metodo === 'revision' ? correoRevision.trim() : undefined
				})
			});
			const data = await res.json();
			resultado = {
				ok: res.ok,
				texto: data.mensaje ?? (res.ok ? 'Orden enviada.' : 'No se pudo enviar la orden.')
			};
		} catch (e) {
			resultado = { ok: false, texto: 'Error de red al enviar la orden.' };
			console.error(e);
		} finally {
			ejecutando = false;
		}
	}

	function elegirAudit(c: ClienteSAP) {
		auditSel = c;
		auditTexto = `${c.cardCode} — ${c.cardName}`;
		auditSugerencias = false;
	}

	async function consultar() {
		const code = (auditSel?.cardCode ?? auditTexto.trim()).toUpperCase();
		if (!code) return;
		auditCargando = true;
		auditError = null;
		auditData = null;
		try {
			const res = await fetch(`${apiBase}/auditar?cardCode=${encodeURIComponent(code)}`);
			if (res.status === 404) {
				auditError = `El cliente ${code} no existe en SAP.`;
				return;
			}
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			auditData = await res.json();
		} catch (e) {
			auditError = 'No se pudo consultar el cliente. Verificá la conexión al Service Layer.';
			console.error(e);
		} finally {
			auditCargando = false;
		}
	}

	function fmt(n: number, moneda: 'CRC' | 'USD') {
		const s = new Intl.NumberFormat('es-CR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(Math.abs(n));
		const simbolo = moneda === 'USD' ? '$' : '₡';
		return n < 0 ? `(${simbolo}${s})` : `${simbolo}${s}`;
	}

	const badge: Record<ClienteSAP['tipo'], string> = {
		padre: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 ring-indigo-200 dark:ring-indigo-800',
		hijo: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800',
		individual: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700'
	};

	const envioHabilitado = $derived(
		['Y', 'S', 'SI', 'SÍ'].includes((auditData?.cliente.envioAutomatico ?? '').trim().toUpperCase())
	);

	onMount(cargarClientes);
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
	<header class="mb-8 text-center">
		<img src="/QU.png" alt="Químicas Unidas" class="mx-auto mb-4 h-16 w-auto" />
		<p class="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Químicas Unidas</p>
		<h1 class="mt-1 text-2xl font-bold text-foreground">Estados de Cuenta (CXC)</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Ejecuta el envío de estados de cuenta y consulta la actual de un cliente con saldo pendiente.
		</p>
	</header>

	{#if errorCarga}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
			<p class="font-medium">{errorCarga}</p>
			<button
				class="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
				onclick={cargarClientes}
			>
				Reintentar
			</button>
		</div>
	{/if}

	<!-- ════════════ SOLICITUD DE ENVÍO ════════════ -->
	<section class="rounded-xl border border-border bg-card p-6 shadow-sm">
		<h2 class="text-base font-semibold text-foreground">Solicitud de envío</h2>

		<!-- Método -->
		<div class="mt-4">
			<label for="metodo" class="mb-1 block text-xs font-medium text-muted-foreground">Método</label>
			<select
				id="metodo"
				bind:value={metodo}
				class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
			>
				<option value="cliente">Enviar al cliente</option>
				<option value="revision">Enviar a revisión (crédito)</option>
			</select>
			<p class="mt-1.5 text-xs text-muted-foreground">{ayudaMetodo}</p>

			{#if metodo === 'revision'}
				<div class="mt-3">
					<label for="correoRevision" class="mb-1 block text-xs font-medium text-muted-foreground">
						Correo destino
					</label>
					<input
						id="correoRevision"
						type="email"
						placeholder="correo@empresa.com"
						bind:value={correoRevision}
						class="w-full rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20 px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
					<p class="mt-1 text-xs text-muted-foreground">
						El PDF llegará únicamente a este correo. Podés cambiarlo antes de enviar.
					</p>
				</div>
			{/if}
		</div>

		<!-- Alcance (solo para envío al cliente) -->
		{#if metodo === 'cliente'}
			<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<button
					type="button"
					onclick={() => (alcance = 'cliente')}
					class="rounded-lg border px-4 py-3 text-left transition
                        {alcance === 'cliente'
						? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
						: 'border-border hover:border-muted-foreground/40'}"
				>
					<span class="block text-sm font-medium text-foreground">Clientes específicos</span>
					<span class="mt-0.5 block text-xs text-muted-foreground">Elegí uno o varios</span>
				</button>
				<button
					type="button"
					onclick={() => (alcance = 'completo')}
					class="rounded-lg border px-4 py-3 text-left transition
                        {alcance === 'completo'
						? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
						: 'border-border hover:border-muted-foreground/40'}"
				>
					<span class="block text-sm font-medium text-foreground">Cartera completa</span>
					<span class="mt-0.5 block text-xs text-muted-foreground">Solo clientes con envío automático</span
					>
				</button>
			</div>
		{/if}

		<!-- Selector de clientes -->
		{#if alcanceEfectivo === 'cliente'}
			<div class="relative mt-5">
				<label for="buscar" class="mb-1 block text-xs font-medium text-muted-foreground">
					Clientes {#if !cargando}<span class="text-muted-foreground/60">({total} cuentas con saldo)</span
						>{/if}
				</label>
				<input
					id="buscar"
					type="text"
					autocomplete="off"
					placeholder="Buscar por código o nombre…"
					bind:value={busqueda}
					oninput={() => (mostrarSugerencias = true)}
					onfocus={() => (mostrarSugerencias = true)}
					disabled={cargando}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-muted"
				/>

				{#if mostrarSugerencias && sugerencias.length > 0}
					<ul
						class="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg"
					>
						{#each sugerencias as c (c.cardCode)}
							<li>
								<button
									class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
									onclick={() => agregar(c)}
								>
									<span class="min-w-0">
										<span class="font-mono text-xs text-muted-foreground">{c.cardCode}</span>
										<span class="ml-2 truncate text-foreground">{c.cardName}</span>
									</span>
									<span
										class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ring-1 ring-inset {badge[
											c.tipo
										]}"
									>
										{c.tipo}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Chips de seleccionados -->
			{#if seleccionados.length > 0}
				<div class="mt-3 flex flex-wrap gap-2">
					{#each seleccionados as c (c.cardCode)}
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pl-2.5 pr-1.5 text-xs text-foreground"
						>
							<span class="font-mono text-muted-foreground">{c.cardCode}</span>
							<span class="max-w-[16rem] truncate">{c.cardName}</span>
							{#if c.tipo === 'padre'}
								<span class="text-indigo-600 dark:text-indigo-400">+{hijasPorPadre.get(c.cardCode) ?? 0} suc.</span>
							{/if}
							<button
								class="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
								onclick={() => quitar(c.cardCode)}
								aria-label="Quitar"
							>
								✕
							</button>
						</span>
					{/each}
				</div>
			{/if}

			<p class="mt-3 text-xs text-muted-foreground">
				Las cuentas padre consolidan sus sucursales en un solo estado de cuenta. Un cliente sin
				saldo en SAP no se envía.
			</p>
		{:else}
			<p class="mt-5 rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
				Procesa toda la cartera con saldo y respeta el envío automático configurado por cliente.
			</p>
		{/if}

		<!-- Acción -->
		<div class="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
			<button
				type="button"
				onclick={ejecutar}
				disabled={ejecutando || cargando}
				class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{ejecutando ? 'Enviando…' : metodo === 'revision' ? 'Enviar a revisión' : 'Ejecutar CXC'}
			</button>
			{#if alcanceEfectivo === 'cliente' && seleccionados.length > 0}
				<span class="text-xs text-muted-foreground">{seleccionados.length} cliente(s) seleccionado(s)</span
				>
			{/if}
		</div>

		{#if resultado}
			<div
				class="mt-4 rounded-lg px-4 py-3 text-sm {resultado.ok
					? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400'
					: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}"
			>
				{resultado.texto}
			</div>
		{/if}
	</section>

	<!-- ════════════ CONSULTA / AUDITORÍA ════════════ -->
	<section class="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
		<h2 class="text-base font-semibold text-foreground">Auditoría de Cliente</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Vista unificada de documentos y saldos consolidados idéntica al PDF final.
		</p>

		<div class="relative mt-4 flex gap-2">
			<div class="relative flex-1">
				<input
					type="text"
					autocomplete="off"
					placeholder="Código o nombre del cliente…"
					bind:value={auditTexto}
					oninput={() => {
						auditSugerencias = true;
						auditSel = null;
					}}
					onfocus={() => (auditSugerencias = true)}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
				/>
				{#if auditSugerencias && !auditSel && auditFiltrados.length > 0}
					<ul
						class="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg"
					>
						{#each auditFiltrados as c (c.cardCode)}
							<li>
								<button
									class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
									onclick={() => elegirAudit(c)}
								>
									<span class="font-mono text-xs text-muted-foreground">{c.cardCode}</span>
									<span class="truncate text-foreground">{c.cardName}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<button
				type="button"
				onclick={consultar}
				disabled={auditCargando}
				class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
			>
				{auditCargando ? 'Consultando…' : 'Consultar'}
			</button>
		</div>

		{#if auditError}
			<div class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">{auditError}</div>
		{/if}

		{#if auditData}
			<!-- ── Tarjetas de Resumen (Estilo Dashboard) ── -->
			<div class="mt-6">
				<div class="flex items-baseline justify-between mb-3">
					<h3 class="text-lg font-bold text-foreground">
						<span class="font-mono text-muted-foreground text-base font-medium mr-1"
							>{auditData.cliente.cardCode}</span
						>
						{auditData.cliente.cardName}
					</h3>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<!-- Tarjeta 1: Saldo -->
					<div class="rounded-xl border border-border bg-muted/50 p-4">
						<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Saldo Global en SAP
						</p>
						<p
							class="mt-1 text-2xl font-bold {auditData.cliente.saldoActual < 0
								? 'text-amber-600'
								: 'text-foreground'}"
						>
							{fmt(auditData.cliente.saldoActual, 'CRC')}
						</p>
					</div>

					<!-- Tarjeta 2: Correos -->
					<div class="rounded-xl border border-border bg-muted/50 p-4">
						<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destinatarios</p>
						<div class="mt-2 space-y-1">
							<p
								class="text-sm text-foreground truncate"
								title={auditData.cliente.correoCxc || 'No configurado'}
							>
								<span class="text-xs text-muted-foreground mr-1">CXC:</span>
								{auditData.cliente.correoCxc || '—'}
							</p>
							<p
								class="text-sm text-foreground truncate"
								title={auditData.cliente.correoPrincipal || 'No configurado'}
							>
								<span class="text-xs text-muted-foreground mr-1">Gral:</span>
								{auditData.cliente.correoPrincipal || '—'}
							</p>
						</div>
					</div>

					<!-- Tarjeta 3: Estatus Envío -->
					<div
						class="rounded-xl border border-border bg-muted/50 p-4 flex flex-col justify-center items-start"
					>
						<p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
							Envío Automático
						</p>
						<span
							class="rounded-full px-3 py-1 text-xs font-semibold {envioHabilitado
								? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
								: 'bg-muted text-muted-foreground'}"
						>
							{envioHabilitado ? 'Habilitado' : 'Deshabilitado'}
						</span>
						{#if !envioHabilitado}
							<p class="mt-2 text-[10px] text-muted-foreground leading-tight">
								El RPA ignorará a este cliente en ejecuciones masivas.
							</p>
						{/if}
					</div>
				</div>

				{#if auditData.cliente.saldoActual === 0 && (auditData.documentos.usd.length > 0 || auditData.documentos.crc.length > 0)}
					<div
						class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
					>
						<strong>Nota:</strong> Este cliente tiene el saldo general en cero, pero posee documentos
						abiertos (probablemente facturas que se matan con notas de crédito no aplicadas). El envío
						automático no lo procesará.
					</div>
				{/if}
			</div>

			<!-- ════════════ TABLA CON SCROLL (MAX-H) Y STICKY HEADER ════════════ -->
			<div class="mt-8 rounded-xl border border-border shadow-sm bg-card overflow-hidden">
				<!-- Contenedor con altura máxima y scroll -->
				<div class="overflow-x-auto overflow-y-auto max-h-[500px] relative custom-scrollbar">
					<table class="w-full text-sm min-w-[900px] text-left">
						<thead
							class="bg-muted text-[11px] font-bold uppercase text-muted-foreground sticky top-0 z-10 shadow-sm"
						>
							<tr>
								<th class="px-4 py-3 text-center whitespace-nowrap">No de Doc</th>
								<th class="px-4 py-3 text-center whitespace-nowrap">No de Orden</th>
								<th class="px-4 py-3 text-center whitespace-nowrap">Fecha Factura</th>
								<th class="px-4 py-3 text-center whitespace-nowrap">Fecha Venc.</th>
								<th class="px-4 py-3 text-center whitespace-nowrap">Tipo Doc</th>
								<th class="px-4 py-3">Descripción</th>
								<th class="px-4 py-3 text-right whitespace-nowrap">Monto Factura</th>
								<th class="px-4 py-3 text-center whitespace-nowrap">Estatus</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<!-- SECCIÓN DÓLARES -->
							{#if auditData.documentos.usd.length > 0}
								{#each auditData.documentos.usd as doc}
									<tr class="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
										<td class="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground"
											>{doc.consecutivo}</td
										>
										<td class="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground"
											>{doc.ordenCompra}</td
										>
										<td class="px-4 py-2.5 text-center text-muted-foreground">{doc.fecha}</td>
										<td class="px-4 py-2.5 text-center text-muted-foreground">{doc.fechaVence}</td>
										<td class="px-4 py-2.5 text-center text-muted-foreground">{doc.tipoDoc}</td>
										<td
											class="px-4 py-2.5 text-xs text-muted-foreground max-w-56 truncate"
											title={doc.descripcion}>{doc.descripcion}</td
										>
										<td
											class="px-4 py-2.5 text-right font-medium {doc.saldo < 0
												? 'text-amber-600'
												: 'text-foreground'}">{fmt(doc.saldo, 'USD')}</td
										>
										<td class="px-4 py-2.5 text-center">
											<span
												class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium {doc.estatus ===
												'Vencido'
													? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800/40'
													: doc.estatus === 'A favor'
														? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800/40'
														: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/40 dark:text-green-400 dark:ring-green-800/40'}"
											>
												{doc.estatus}
											</span>
										</td>
									</tr>
								{/each}
								<!-- TOTAL DÓLARES -->
								<tr class="bg-indigo-900 text-white">
									<td
										colspan="6"
										class="px-4 py-3 text-right font-bold tracking-wide border-r border-indigo-800"
										>TOTAL GENERAL USD:</td
									>
									<td colspan="2" class="px-4 py-3 text-right font-bold"
										>{fmt(auditData.totales.usd, 'USD')}</td
									>
								</tr>
							{/if}

							<!-- SECCIÓN COLONES -->
							{#if auditData.documentos.crc.length > 0}
								{#each auditData.documentos.crc as doc}
									<tr class="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
										<td class="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground"
											>{doc.consecutivo}</td
										>
										<td class="px-4 py-2.5 text-center font-mono text-xs text-muted-foreground"
											>{doc.ordenCompra}</td
										>
										<td class="px-4 py-2.5 text-center text-muted-foreground">{doc.fecha}</td>
										<td class="px-4 py-2.5 text-center text-muted-foreground">{doc.fechaVence}</td>
										<td class="px-4 py-2.5 text-center text-muted-foreground">{doc.tipoDoc}</td>
										<td
											class="px-4 py-2.5 text-xs text-muted-foreground max-w-56 truncate"
											title={doc.descripcion}>{doc.descripcion}</td
										>
										<td
											class="px-4 py-2.5 text-right font-medium {doc.saldo < 0
												? 'text-amber-600'
												: 'text-foreground'}">{fmt(doc.saldo, 'CRC')}</td
										>
										<td class="px-4 py-2.5 text-center">
											<span
												class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium {doc.estatus ===
												'Vencido'
													? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800/40'
													: doc.estatus === 'A favor'
														? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800/40'
														: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/40 dark:text-green-400 dark:ring-green-800/40'}"
											>
												{doc.estatus}
											</span>
										</td>
									</tr>
								{/each}
								<!-- TOTAL COLONES -->
								<tr class="bg-indigo-900 text-white">
									<td
										colspan="6"
										class="px-4 py-3 text-right font-bold tracking-wide border-r border-indigo-800"
										>TOTAL GENERAL COLONES:</td
									>
									<td colspan="2" class="px-4 py-3 text-right font-bold"
										>{fmt(auditData.totales.crc, 'CRC')}</td
									>
								</tr>
							{/if}

							{#if auditData.documentos.usd.length === 0 && auditData.documentos.crc.length === 0}
								<tr>
									<td colspan="8" class="py-12 text-center text-muted-foreground">
										No hay documentos pendientes para este cliente.
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>

			<!-- SECCIÓN DE RANGOS DE VENCIMIENTO -->
			{#if auditData.rangos.usd.totalVencido > 0 || auditData.rangos.crc.totalVencido > 0}
				<div class="mt-8 flex flex-wrap justify-center gap-6">
					{#each [{ m: 'USD', title: 'Dólares', data: auditData.rangos.usd }, { m: 'CRC', title: 'Colones', data: auditData.rangos.crc }] as rango}
						{#if rango.data.totalVencido > 0}
							<div
								class="w-full max-w-sm rounded-xl border border-border shadow-sm overflow-hidden text-sm"
							>
								<div
									class="bg-indigo-50/80 dark:bg-indigo-950/50 px-4 py-3 text-center font-bold text-indigo-900 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-900"
								>
									Facturas Vencidas en {rango.title}
								</div>
								<div class="bg-card">
									<div class="flex justify-between border-b border-border px-5 py-2.5">
										<span class="font-medium text-muted-foreground">Total 0-30</span>
										<span class="text-foreground"
											>{rango.data['0_30'] > 0
												? fmt(rango.data['0_30'], rango.m as any)
												: '—'}</span
										>
									</div>
									<div
										class="flex justify-between border-b border-border px-5 py-2.5 bg-muted/30"
									>
										<span class="font-medium text-muted-foreground">Total 31-60</span>
										<span class="text-foreground"
											>{rango.data['31_60'] > 0
												? fmt(rango.data['31_60'], rango.m as any)
												: '—'}</span
										>
									</div>
									<div class="flex justify-between border-b border-border px-5 py-2.5">
										<span class="font-medium text-muted-foreground">Total 61-90</span>
										<span class="text-foreground"
											>{rango.data['61_90'] > 0
												? fmt(rango.data['61_90'], rango.m as any)
												: '—'}</span
										>
									</div>
									<div
										class="flex justify-between border-b border-border px-5 py-2.5 bg-muted/30"
									>
										<span class="font-medium text-muted-foreground">Total 91-120</span>
										<span class="text-foreground"
											>{rango.data['91_120'] > 0
												? fmt(rango.data['91_120'], rango.m as any)
												: '—'}</span
										>
									</div>
									<div class="flex justify-between border-b border-border px-5 py-2.5">
										<span class="font-medium text-muted-foreground">Total 120+</span>
										<span class="text-foreground"
											>{rango.data['mas_120'] > 0
												? fmt(rango.data['mas_120'], rango.m as any)
												: '—'}</span
										>
									</div>
									<div
										class="flex justify-between bg-indigo-900 px-5 py-3 font-bold text-white tracking-wide"
									>
										<span>TOTAL VENCIDO</span>
										<span>{fmt(rango.data.totalVencido, rango.m as any)}</span>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	</section>
</div>

<style>
	/* Estilo de scrollbar sutil solo para la tabla */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: #f1f5f9;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-track {
		background: #1e293b;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background: #475569;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #64748b;
	}
</style>
