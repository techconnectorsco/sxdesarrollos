<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Chart,
		CategoryScale,
		LinearScale,
		BarController,
		BarElement,
		LineController,
		LineElement,
		PointElement,
		Tooltip,
		Legend
	} from 'chart.js';

	Chart.register(
		CategoryScale,
		LinearScale,
		BarController,
		BarElement,
		LineController,
		LineElement,
		PointElement,
		Tooltip,
		Legend
	);

	Chart.defaults.color = '#64748b';
	Chart.defaults.elements.bar.borderRadius = 6;
	Chart.defaults.elements.line.borderWidth = 2.5;
	Chart.defaults.elements.point.radius = 3;

	// ── Types ──────────────────────────────────────────────────────────────
	interface MetricasCxc {
		tiempo_ejecucion?: number;
		total_clientes?: number;
		clientes_procesados?: number;
		clientes_omitidos_N?: number;
		clientes_sin_documentos?: number;
		clientes_sin_correo?: number;
		total_documentos_procesados?: number | null;
		reportes_generados?: number;
		emails_exitosos?: number;
		emails_fallidos?: number;
		monto_total_usd?: number;
		monto_total_colones?: number;
		monto_vencido_usd?: number;
		monto_vencido_colones?: number;
		tipo_ejecucion?: string;
		fuente?: string;
	}

	interface MetricasGiras {
		tiempo_ejecucion?: number;
		total_clientes?: number;
		clientes_evaluados?: number;
		total_agentes?: number;
		agentes_procesados?: number;
		reportes_generados?: number;
		total_documentos_procesados?: number | null;
		emails_exitosos?: number;
		emails_fallidos?: number;
		monto_total_usd?: number;
		monto_total_colones?: number;
		monto_vencido_usd?: number;
		monto_vencido_colones?: number;
		tipo_ejecucion?: string;
		fuente?: string;
	}

	interface Ejec {
		id: string;
		automatizacion_id: string;
		fecha_inicio: string;
		fecha_fin: string | null;
		estado: string;
		metricas: MetricasCxc | MetricasGiras | null;
	}

	// ── State ──────────────────────────────────────────────────────────────
	let activeTab = $state<'cxc' | 'giras'>('cxc');
	let modoCxc = $state<'historico' | 'una'>('historico');
	let modoGiras = $state<'historico' | 'una'>('historico');
	let cargando = $state(true);
	let errorMsg = $state<string | null>(null);
	let ejecCxc = $state<Ejec[]>([]);
	let ejecGiras = $state<Ejec[]>([]);
	let selCxc = $state('');
	let selGiras = $state('');

	// ── Derived ────────────────────────────────────────────────────────────
	const mCxcSel = $derived(
		((ejecCxc.find((e) => e.id === selCxc) ?? ejecCxc[0])?.metricas as MetricasCxc | null) ?? null
	);
	const mGirasSel = $derived(
		((ejecGiras.find((e) => e.id === selGiras) ?? ejecGiras[0])
			?.metricas as MetricasGiras | null) ?? null
	);

	// ── Helpers ────────────────────────────────────────────────────────────
	const fmtN = (n: number | null | undefined) =>
		n == null ? '—' : new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);

	const fmtM = (n: number | null | undefined, cur: 'USD' | 'CRC') => {
		if (n == null) return '—';
		const s = new Intl.NumberFormat('es-CR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(n);
		return cur === 'USD' ? `$${s}` : `CRC ${s}`;
	};

	const fmtDur = (s: number | null | undefined) =>
		s == null
			? '—'
			: s < 60
				? `${s.toFixed(0)}s`
				: s < 3600
					? `${(s / 60).toFixed(1)}m`
					: `${(s / 3600).toFixed(1)}h`;

	const fmtPct = (a: number | null | undefined, b: number | null | undefined) =>
		!a || !b ? '—' : `${((a / b) * 100).toFixed(1)}%`;

	const fmtF = (iso: string) =>
		new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: '2-digit' });

	// KPI agregados CxC (Histórico)
	const kpiCxc = $derived.by(() => {
		const arr = ejecCxc.map((e) => e.metricas as MetricasCxc).filter(Boolean);
		if (!arr.length) return null;
		const last = arr[0];
		return {
			total: arr.length,
			avgDur: arr.reduce((s, m) => s + (m?.tiempo_ejecucion ?? 0), 0) / arr.length,
			emails: arr.reduce((s, m) => s + (m?.emails_exitosos ?? 0), 0),
			lastUsd: last?.monto_total_usd,
			lastCrc: last?.monto_total_colones,
			lastVUsd: last?.monto_vencido_usd,
			lastVCrc: last?.monto_vencido_colones
		};
	});

	// KPI agregados Giras (Histórico)
	const kpiGiras = $derived.by(() => {
		const arr = ejecGiras.map((e) => e.metricas as MetricasGiras).filter(Boolean);
		if (!arr.length) return null;
		const last = arr[0];
		return {
			total: arr.length,
			avgDur: arr.reduce((s, m) => s + (m?.tiempo_ejecucion ?? 0), 0) / arr.length,
			reportes: arr.reduce((s, m) => s + (m?.reportes_generados ?? 0), 0),
			emails: arr.reduce((s, m) => s + (m?.emails_exitosos ?? 0), 0),
			lastUsd: last?.monto_total_usd,
			lastCrc: last?.monto_total_colones,
			lastVUsd: last?.monto_vencido_usd,
			lastVCrc: last?.monto_vencido_colones
		};
	});

	// ── Colors ─────────────────────────────────────────────────────────────
	const C = {
		indigo: 'rgb(79,70,229)', // indigo-600
		indigoBg: 'rgba(79,70,229,0.9)',
		amber: 'rgb(217,119,6)', // amber-600
		amberBg: 'rgba(217,119,6,0.9)',
		green: 'rgb(22,163,74)', // green-600
		greenBg: 'rgba(22,163,74,0.85)',
		greyBg: 'rgba(100,116,139,0.45)', // etapas neutras del embudo
		slate: 'rgba(148,163,184,0.25)', // líneas de la grilla
		txt: '#64748b' // slate-500, más contraste
	};

	const sc = {
		x: { grid: { color: C.slate }, ticks: { color: C.txt, font: { size: 11 } } },
		y: { grid: { color: C.slate }, ticks: { color: C.txt, font: { size: 11 } } }
	};

	// ── Chart factory ──────────────────────────────────────────────────────
	function mk(canvas: HTMLCanvasElement | null, cfg: any) {
		if (!canvas) return;
		const ch = new Chart(canvas, cfg);
		return () => ch.destroy();
	}

	// ── Canvas refs ────────────────────────────────────────────────────────
	// CxC · Una ejecución
	let cFunnel = $state<HTMLCanvasElement | null>(null);
	let cCxcUsd = $state<HTMLCanvasElement | null>(null);
	let cCxcCrc = $state<HTMLCanvasElement | null>(null);
	// CxC · Histórico
	let cHUsd = $state<HTMLCanvasElement | null>(null);
	let cHCrc = $state<HTMLCanvasElement | null>(null);
	let cHTasa = $state<HTMLCanvasElement | null>(null);
	let cHDur = $state<HTMLCanvasElement | null>(null);
	// Giras · Una ejecución
	let cGUsd = $state<HTMLCanvasElement | null>(null);
	let cGCrc = $state<HTMLCanvasElement | null>(null);
	// Giras · Histórico
	let cGHUsd = $state<HTMLCanvasElement | null>(null);
	let cGHCrc = $state<HTMLCanvasElement | null>(null);
	let cGHRep = $state<HTMLCanvasElement | null>(null);
	let cGHAg = $state<HTMLCanvasElement | null>(null);

	// ── Chart effects ──────────────────────────────────────────────────────
	// CxC Una · Embudo
	$effect(() => {
		const m = mCxcSel;
		return mk(cFunnel, {
			type: 'bar',
			data: {
				labels: ['Total', 'Omitidos', 'Sin docs', 'Sin correo', 'Procesados', 'Emails OK'],
				datasets: [
					{
						label: 'Clientes',
						data: [
							m?.total_clientes,
							m?.clientes_omitidos_N,
							m?.clientes_sin_documentos,
							m?.clientes_sin_correo,
							m?.clientes_procesados,
							m?.emails_exitosos
						],
						backgroundColor: [C.indigoBg, C.greyBg, C.greyBg, C.greyBg, C.indigoBg, C.greenBg]
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				plugins: { legend: { display: false } },
				scales: sc
			}
		});
	});

	// CxC Una · USD
	$effect(() => {
		const m = mCxcSel;
		return mk(cCxcUsd, {
			type: 'bar',
			data: {
				labels: ['Cartera USD'],
				datasets: [
					{ label: 'Total', data: [m?.monto_total_usd], backgroundColor: C.indigoBg },
					{ label: 'Vencido', data: [m?.monto_vencido_usd], backgroundColor: C.amberBg }
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// CxC Una · CRC
	$effect(() => {
		const m = mCxcSel;
		return mk(cCxcCrc, {
			type: 'bar',
			data: {
				labels: ['Cartera CRC'],
				datasets: [
					{ label: 'Total', data: [m?.monto_total_colones], backgroundColor: C.indigoBg },
					{ label: 'Vencido', data: [m?.monto_vencido_colones], backgroundColor: C.amberBg }
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// CxC Hist · Tendencia USD
	$effect(() => {
		const d = [...ejecCxc].reverse();
		return mk(cHUsd, {
			type: 'line',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Cartera USD',
						data: d.map((e) => (e.metricas as MetricasCxc)?.monto_total_usd),
						borderColor: C.indigo,
						tension: 0.3,
						fill: false
					},
					{
						label: 'Vencido USD',
						data: d.map((e) => (e.metricas as MetricasCxc)?.monto_vencido_usd),
						borderColor: C.amber,
						tension: 0.3,
						fill: false
					}
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// CxC Hist · Tendencia CRC
	$effect(() => {
		const d = [...ejecCxc].reverse();
		return mk(cHCrc, {
			type: 'line',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Cartera CRC',
						data: d.map((e) => (e.metricas as MetricasCxc)?.monto_total_colones),
						borderColor: C.indigo,
						tension: 0.3,
						fill: false
					},
					{
						label: 'Vencido CRC',
						data: d.map((e) => (e.metricas as MetricasCxc)?.monto_vencido_colones),
						borderColor: C.amber,
						tension: 0.3,
						fill: false
					}
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// CxC Hist · Tasa de envío
	$effect(() => {
		const d = [...ejecCxc].reverse();
		return mk(cHTasa, {
			type: 'line',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Tasa envío (%)',
						data: d.map((e) => {
							const m = e.metricas as MetricasCxc;
							if (!m?.emails_exitosos || !m?.clientes_procesados) return null;
							return +((m.emails_exitosos / m.clientes_procesados) * 100).toFixed(1);
						}),
						borderColor: C.green,
						tension: 0.3,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				plugins: { legend: { labels: { color: C.txt } } },
				scales: { ...sc, y: { ...sc.y, min: 0, max: 100 } }
			}
		});
	});

	// CxC Hist · Duración
	$effect(() => {
		const d = [...ejecCxc].reverse();
		return mk(cHDur, {
			type: 'bar',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Duración (seg)',
						data: d.map((e) => (e.metricas as MetricasCxc)?.tiempo_ejecucion),
						backgroundColor: C.indigoBg
					}
				]
			},
			options: { responsive: true, plugins: { legend: { display: false } }, scales: sc }
		});
	});

	// Giras Una · USD
	$effect(() => {
		const m = mGirasSel;
		return mk(cGUsd, {
			type: 'bar',
			data: {
				labels: ['Cartera USD'],
				datasets: [
					{ label: 'Total', data: [m?.monto_total_usd], backgroundColor: C.indigoBg },
					{ label: 'Vencido', data: [m?.monto_vencido_usd], backgroundColor: C.amberBg }
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// Giras Una · CRC
	$effect(() => {
		const m = mGirasSel;
		return mk(cGCrc, {
			type: 'bar',
			data: {
				labels: ['Cartera CRC'],
				datasets: [
					{ label: 'Total', data: [m?.monto_total_colones], backgroundColor: C.indigoBg },
					{ label: 'Vencido', data: [m?.monto_vencido_colones], backgroundColor: C.amberBg }
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// Giras Hist · Tendencia USD
	$effect(() => {
		const d = [...ejecGiras].reverse();
		return mk(cGHUsd, {
			type: 'line',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Cartera USD',
						data: d.map((e) => (e.metricas as MetricasGiras)?.monto_total_usd),
						borderColor: C.indigo,
						tension: 0.3,
						fill: false
					},
					{
						label: 'Vencido USD',
						data: d.map((e) => (e.metricas as MetricasGiras)?.monto_vencido_usd),
						borderColor: C.amber,
						tension: 0.3,
						fill: false
					}
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// Giras Hist · Tendencia CRC
	$effect(() => {
		const d = [...ejecGiras].reverse();
		return mk(cGHCrc, {
			type: 'line',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Cartera CRC',
						data: d.map((e) => (e.metricas as MetricasGiras)?.monto_total_colones),
						borderColor: C.indigo,
						tension: 0.3,
						fill: false
					},
					{
						label: 'Vencido CRC',
						data: d.map((e) => (e.metricas as MetricasGiras)?.monto_vencido_colones),
						borderColor: C.amber,
						tension: 0.3,
						fill: false
					}
				]
			},
			options: { responsive: true, plugins: { legend: { labels: { color: C.txt } } }, scales: sc }
		});
	});

	// Giras Hist · Reportes
	$effect(() => {
		const d = [...ejecGiras].reverse();
		return mk(cGHRep, {
			type: 'bar',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Reportes generados',
						data: d.map((e) => (e.metricas as MetricasGiras)?.reportes_generados),
						backgroundColor: C.indigoBg
					}
				]
			},
			options: { responsive: true, plugins: { legend: { display: false } }, scales: sc }
		});
	});

	// Giras Hist · Agentes
	$effect(() => {
		const d = [...ejecGiras].reverse();
		return mk(cGHAg, {
			type: 'bar',
			data: {
				labels: d.map((e) => fmtF(e.fecha_inicio)),
				datasets: [
					{
						label: 'Agentes activos',
						data: d.map((e) => (e.metricas as MetricasGiras)?.total_agentes),
						backgroundColor: C.greenBg
					}
				]
			},
			options: { responsive: true, plugins: { legend: { display: false } }, scales: sc }
		});
	});

	// ── Data load ──────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			const res = await fetch('/quimicas_unidas/api/ejecuciones');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			const porFecha = (a: Ejec, b: Ejec) =>
				new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
			ejecCxc = (data.cxc ?? []).sort(porFecha);
			ejecGiras = (data.giras ?? []).sort(porFecha);
			if (ejecCxc.length) selCxc = ejecCxc[0].id;
			if (ejecGiras.length) selGiras = ejecGiras[0].id;
		} catch {
			errorMsg = 'No se pudo cargar el historial de ejecuciones.';
		} finally {
			cargando = false;
		}
	});
</script>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
{#snippet kpi(label: string, value: string, sub?: string)}
	<div class="rounded-xl border border-border bg-muted/50 p-4">
		<p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
		<p class="mt-1 whitespace-nowrap text-lg font-bold tabular-nums leading-tight text-foreground">
			{value}
		</p>
		{#if sub}<p class="mt-0.5 text-xs text-muted-foreground">{sub}</p>{/if}
	</div>
{/snippet}

{#snippet toggleModo(modo: 'historico' | 'una', set: (m: 'historico' | 'una') => void)}
	<div class="inline-flex rounded-lg border border-border bg-muted p-1">
		<button
			type="button"
			onclick={() => set('historico')}
			class="rounded-md px-3 py-1.5 text-xs font-medium transition {modo === 'historico'
				? 'bg-card text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}">Histórico</button
		>
		<button
			type="button"
			onclick={() => set('una')}
			class="rounded-md px-3 py-1.5 text-xs font-medium transition {modo === 'una'
				? 'bg-card text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}">Una ejecución</button
		>
	</div>
{/snippet}

{#snippet estadoBadge(estado: string)}
	<span
		class="rounded-full px-2 py-0.5 text-[10px] font-semibold {[
			'exitoso',
			'Exitoso',
			'ok',
			'OK',
			'success'
		].includes(estado)
			? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
			: ['error', 'Error', 'ERROR', 'failed'].includes(estado)
				? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
				: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">{estado}</span
	>
{/snippet}

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<div class="mx-auto max-w-5xl px-4 py-8">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-xl font-bold text-foreground">Dashboard de RPAs</h2>
		<p class="mt-0.5 text-sm text-muted-foreground">
			Historial y métricas de las automatizaciones de Químicas Unidas.
		</p>
	</div>

	<!-- Loading / error -->
	{#if cargando}
		<div class="flex items-center justify-center py-16 text-sm text-muted-foreground">
			Cargando historial…
		</div>
	{:else if errorMsg}
		<div
			class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
		>
			{errorMsg}
		</div>
	{:else}
		<!-- Tab selector -->
		<div class="mb-6 flex gap-1 rounded-xl border border-border bg-muted p-1 w-fit">
			<button
				type="button"
				onclick={() => (activeTab = 'cxc')}
				class="rounded-lg px-5 py-2 text-sm font-semibold transition {activeTab === 'cxc'
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}">Estados de Cuenta (CxC)</button
			>
			<button
				type="button"
				onclick={() => (activeTab = 'giras')}
				class="rounded-lg px-5 py-2 text-sm font-semibold transition {activeTab === 'giras'
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}">Giras de Agentes</button
			>
		</div>

		<!-- ══════════════ TAB CXC ══════════════ -->
		{#if activeTab === 'cxc'}
			{#if ejecCxc.length === 0}
				<div
					class="rounded-xl border border-border bg-muted/40 py-16 text-center text-sm text-muted-foreground"
				>
					Aún no hay ejecuciones registradas para el RPA de Estados de Cuenta.
				</div>
			{:else}
				<!-- Mode toggle -->
				<div class="mb-5 flex flex-wrap items-center gap-4">
					{@render toggleModo(modoCxc, (m) => (modoCxc = m))}
					{#if modoCxc === 'una'}
						<select
							bind:value={selCxc}
							class="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-indigo-500"
						>
							{#each ejecCxc as e}
								<option value={e.id}>
									{fmtF(e.fecha_inicio)} — {e.estado}
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- ── UNA EJECUCIÓN ── -->
				{#if modoCxc === 'una'}
					{@const m = mCxcSel}
					<!-- KPIs -->
					<div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{@render kpi('Cartera USD', fmtM(m?.monto_total_usd, 'USD'))}
						{@render kpi('Cartera CRC', fmtM(m?.monto_total_colones, 'CRC'))}
					</div>
					<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{@render kpi('% Vencido USD', fmtPct(m?.monto_vencido_usd, m?.monto_total_usd))}
						{@render kpi('% Vencido CRC', fmtPct(m?.monto_vencido_colones, m?.monto_total_colones))}
						{@render kpi(
							'Tasa de envío',
							fmtPct(m?.emails_exitosos, m?.clientes_procesados),
							`${fmtN(m?.emails_exitosos)} de ${fmtN(m?.clientes_procesados)}`
						)}
						{@render kpi('Duración', fmtDur(m?.tiempo_ejecucion))}
					</div>
					<!-- Charts row -->
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Embudo de clientes
							</p>
							<canvas bind:this={cFunnel}></canvas>
						</div>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
								<p
									class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Cartera vs Vencido · USD
								</p>
								<canvas bind:this={cCxcUsd}></canvas>
							</div>
							<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
								<p
									class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
								>
									Cartera vs Vencido · CRC
								</p>
								<canvas bind:this={cCxcCrc}></canvas>
							</div>
						</div>
					</div>
					<!-- Extra stats row -->
					<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{@render kpi('Clientes totales', fmtN(m?.total_clientes))}
						{@render kpi('Procesados', fmtN(m?.clientes_procesados))}
						{@render kpi('Emails fallidos', fmtN(m?.emails_fallidos))}
						{@render kpi(
							'Documentos',
							m?.total_documentos_procesados != null ? fmtN(m.total_documentos_procesados) : '—'
						)}
					</div>
				{/if}

				<!-- ── HISTÓRICO ── -->
				{#if modoCxc === 'historico'}
					{@const k = kpiCxc}
					<div class="mb-3 grid grid-cols-3 gap-3">
						{@render kpi('Ejecuciones', fmtN(k?.total))}
						{@render kpi('Duración prom.', fmtDur(k?.avgDur))}
						{@render kpi('Emails totales', fmtN(k?.emails))}
					</div>
					<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{@render kpi('Última cartera USD', fmtM(k?.lastUsd, 'USD'))}
						{@render kpi('Último vencido USD', fmtM(k?.lastVUsd, 'USD'))}
						{@render kpi('Última cartera CRC', fmtM(k?.lastCrc, 'CRC'))}
						{@render kpi('Último vencido CRC', fmtM(k?.lastVCrc, 'CRC'))}
					</div>
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Tendencia cartera USD
							</p>
							<canvas bind:this={cHUsd}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Tendencia cartera CRC
							</p>
							<canvas bind:this={cHCrc}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Tasa de envío histórica (%)
							</p>
							<canvas bind:this={cHTasa}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Duración por corrida (seg)
							</p>
							<canvas bind:this={cHDur}></canvas>
						</div>
					</div>
					<!-- Execution list -->
					<div class="mt-6 overflow-hidden rounded-xl border border-border shadow-sm">
						<table class="w-full text-sm">
							<thead
								class="bg-muted text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
							>
								<tr>
									<th class="px-4 py-3 text-left">Fecha</th>
									<th class="px-4 py-3 text-center">Estado</th>
									<th class="px-4 py-3 text-right">Procesados</th>
									<th class="px-4 py-3 text-right">Emails OK</th>
									<th class="px-4 py-3 text-right">Cartera USD</th>
									<th class="px-4 py-3 text-right">Cartera CRC</th>
									<th class="px-4 py-3 text-right">Duración</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each ejecCxc as e}
									{@const m = e.metricas as MetricasCxc}
									<tr class="hover:bg-muted/40 transition-colors">
										<td class="px-4 py-2.5 text-sm text-foreground">{fmtF(e.fecha_inicio)}</td>
										<td class="px-4 py-2.5 text-center">{@render estadoBadge(e.estado)}</td>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtN(m?.clientes_procesados)}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtN(m?.emails_exitosos)}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtM(m?.monto_total_usd, 'USD')}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtM(m?.monto_total_colones, 'CRC')}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtDur(m?.tiempo_ejecucion)}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/if}
		{/if}

		<!-- ══════════════ TAB GIRAS ══════════════ -->
		{#if activeTab === 'giras'}
			{#if ejecGiras.length === 0}
				<div
					class="rounded-xl border border-border bg-muted/40 py-16 text-center text-sm text-muted-foreground"
				>
					Aún no hay ejecuciones registradas para el RPA de Giras de Agentes.
				</div>
			{:else}
				<!-- Mode toggle -->
				<div class="mb-5 flex flex-wrap items-center gap-4">
					{@render toggleModo(modoGiras, (m) => (modoGiras = m))}
					{#if modoGiras === 'una'}
						<select
							bind:value={selGiras}
							class="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-indigo-500"
						>
							{#each ejecGiras as e}
								<option value={e.id}>
									{fmtF(e.fecha_inicio)} — {e.estado}
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- ── UNA EJECUCIÓN ── -->
				{#if modoGiras === 'una'}
					{@const m = mGirasSel}
					<div class="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{@render kpi('Agentes activos', fmtN(m?.total_agentes))}
						{@render kpi('Reportes', fmtN(m?.reportes_generados))}
						{@render kpi(
							'Documentos',
							m?.total_documentos_procesados != null ? fmtN(m.total_documentos_procesados) : '—'
						)}
						{@render kpi('Duración', fmtDur(m?.tiempo_ejecucion))}
					</div>
					<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{@render kpi('Cartera USD', fmtM(m?.monto_total_usd, 'USD'))}
						{@render kpi('Cartera CRC', fmtM(m?.monto_total_colones, 'CRC'))}
						{@render kpi('Vencido USD', fmtM(m?.monto_vencido_usd, 'USD'))}
					</div>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Cartera vs Vencido · USD
							</p>
							<canvas bind:this={cGUsd}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Cartera vs Vencido · CRC
							</p>
							<canvas bind:this={cGCrc}></canvas>
						</div>
					</div>
				{/if}

				<!-- ── HISTÓRICO ── -->
				{#if modoGiras === 'historico'}
					{@const k = kpiGiras}
					<div class="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
						{@render kpi('Ejecuciones', fmtN(k?.total))}
						{@render kpi('Duración prom.', fmtDur(k?.avgDur))}
						{@render kpi('Reportes totales', fmtN(k?.reportes))}
						{@render kpi('Emails totales', fmtN(k?.emails))}
					</div>
					<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{@render kpi('Última cartera USD', fmtM(k?.lastUsd, 'USD'))}
						{@render kpi('Último vencido USD', fmtM(k?.lastVUsd, 'USD'))}
						{@render kpi('Última cartera CRC', fmtM(k?.lastCrc, 'CRC'))}
					</div>
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Tendencia cartera USD
							</p>
							<canvas bind:this={cGHUsd}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Tendencia cartera CRC
							</p>
							<canvas bind:this={cGHCrc}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Reportes generados por corrida
							</p>
							<canvas bind:this={cGHRep}></canvas>
						</div>
						<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Agentes activos por corrida
							</p>
							<canvas bind:this={cGHAg}></canvas>
						</div>
					</div>
					<!-- Execution list -->
					<div class="mt-6 overflow-hidden rounded-xl border border-border shadow-sm">
						<table class="w-full text-sm">
							<thead
								class="bg-muted text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
							>
								<tr>
									<th class="px-4 py-3 text-left">Fecha</th>
									<th class="px-4 py-3 text-center">Estado</th>
									<th class="px-4 py-3 text-right">Agentes</th>
									<th class="px-4 py-3 text-right">Reportes</th>
									<th class="px-4 py-3 text-right">Cartera USD</th>
									<th class="px-4 py-3 text-right">Cartera CRC</th>
									<th class="px-4 py-3 text-right">Duración</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each ejecGiras as e}
									{@const m = e.metricas as MetricasGiras}
									<tr class="hover:bg-muted/40 transition-colors">
										<td class="px-4 py-2.5 text-foreground">{fmtF(e.fecha_inicio)}</td>
										<td class="px-4 py-2.5 text-center">{@render estadoBadge(e.estado)}</td>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtN(m?.total_agentes)}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtN(m?.reportes_generados)}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtM(m?.monto_total_usd, 'USD')}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtM(m?.monto_total_colones, 'CRC')}</td
										>
										<td class="px-4 py-2.5 text-right text-muted-foreground"
											>{fmtDur(m?.tiempo_ejecucion)}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/if}
		{/if}
	{/if}
</div>
