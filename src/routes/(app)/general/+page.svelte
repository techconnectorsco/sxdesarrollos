<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import RobotCard from '$lib/components/app/robots/RobotCard.svelte';
	import ExecutionCard from '$lib/components/app/robots/ExecutionCard.svelte';
	import { apiService } from '$lib/services/api.service';
	import type { Ejecucion, Automatizacion } from '$lib/types/database';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import XCircle from '@lucide/svelte/icons/x-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import Activity from '@lucide/svelte/icons/activity';

	let { data }: { data: PageData } = $props();

	let { clienteId, esAdmin } = $derived(data);

	// Variables reactivas para datos
	let automatizacionesReactive = $state<Automatizacion[]>([]);
	let ejecucionesReactive = $state<Ejecucion[]>([]);
	let estadisticas = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Calcular KPIs desde datos reales
	let botsActivos = $derived(automatizacionesReactive.filter((a) => a.esta_activa).length);
	let totalAutomatizaciones = $derived(automatizacionesReactive.length);
	let totalEjecuciones = $derived(ejecucionesReactive.length);
	let exitosas = $derived(ejecucionesReactive.filter((e) => e.estado === 'Exitoso').length);
	let conAdvertencia = $derived(ejecucionesReactive.filter((e) => e.estado === 'Advertencia').length);
	let conError = $derived(ejecucionesReactive.filter((e) => e.estado === 'Error').length);
	let tasaExito = $derived(
		totalEjecuciones > 0 ? Math.round((exitosas / totalEjecuciones) * 10000) / 100 : 0
	);

	// Ejecuciones por día (últimos 7 días)
	let ejecucionesPorDia = $derived.by(() => {
		const hoy = new Date();
		const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
		const ejecucionesSemana = ejecucionesReactive.filter(
			(e) => new Date(e.fecha_inicio) >= hace7Dias
		);

		const porDia: Record<string, number> = {};
		ejecucionesSemana.forEach((e) => {
			const fecha = new Date(e.fecha_inicio).toISOString().split('T')[0];
			porDia[fecha] = (porDia[fecha] || 0) + 1;
		});

		// Llenar los últimos 7 días
		const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
		const resultado = [];
		for (let i = 6; i >= 0; i--) {
			const fecha = new Date(hoy.getTime() - i * 24 * 60 * 60 * 1000);
			const fechaStr = fecha.toISOString().split('T')[0];
			const diaNombre = dias[fecha.getDay()];
			const esHoy = i === 0;
			resultado.push({
				day: esHoy ? 'Hoy' : diaNombre,
				v: porDia[fechaStr] || 0,
				today: esHoy
			});
		}
		return resultado;
	});

	// Gráfico de barras
	let maxV = $derived(Math.max(...ejecucionesPorDia.map((d) => d.v), 1));
	let bw = 44;
	let chartWidth = 460;
	let n = $derived(ejecucionesPorDia.length);
	let gap = $derived((chartWidth - n * bw) / (n + 1));
	let bars = $derived(
		ejecucionesPorDia.map((d, i) => ({
			...d,
			x: 40 + gap * (i + 1) + bw * i,
			h: maxV > 0 ? (d.v / maxV) * 148 : 0
		}))
	);

	// Distribución de estado de bots (donut)
	let botHealth = $derived(() => {
		const activos = automatizacionesReactive.filter((a) => a.esta_activa).length;
		const inactivos = automatizacionesReactive.filter((a) => !a.esta_activa).length;
		const conError = automatizacionesReactive.filter(
			(a) => a.ultima_ejecucion?.estado === 'Error'
		).length;
		const exitosos = automatizacionesReactive.filter(
			(a) => a.esta_activa && a.ultima_ejecucion?.estado === 'Exitoso'
		).length;

		return [
			{ label: 'Exitosos', n: exitosos, color: '#22c55e' },
			{ label: 'Activos', n: activos - exitosos - conError, color: '#3b82f6' },
			{ label: 'Error', n: conError, color: '#ef4444' },
			{ label: 'Inactivos', n: inactivos, color: '#cbd5e1' }
		].filter((b) => b.n > 0);
	});

	let totalBots = $derived(automatizacionesReactive.length);
	let r = 48;
	let circ = 2 * Math.PI * r;
	let donut = $derived(() => {
		let cum = 0;
		return botHealth.map((b) => {
			const len = totalBots > 0 ? (b.n / totalBots) * circ : 0;
			const offset = -cum;
			cum += len;
			return { ...b, len, offset };
		});
	});

	// Cargar datos iniciales
	async function loadData() {
		loading = true;
		error = null;
		try {
			// Cargar en paralelo
			const [automatizacionesData, ejecucionesData, estadisticasData] = await Promise.all([
				apiService.getAutomatizaciones(clienteId || undefined),
				apiService.getEjecuciones({ limit: 20 }),
				clienteId ? apiService.getEstadisticas(clienteId) : Promise.resolve(null)
			]);

			automatizacionesReactive = automatizacionesData;
			ejecucionesReactive = ejecucionesData;
			estadisticas = estadisticasData;
		} catch (err) {
			console.error('Error cargando datos:', err);
			error = err instanceof Error ? err.message : 'Error al cargar datos';
		} finally {
			loading = false;
		}
	}

	// Cargar datos al montar el componente
	onMount(() => {
		loadData();

		// Opcional: Recargar cada 30 segundos para mantener datos actualizados
		const interval = setInterval(() => {
			loadData();
		}, 30000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

{#if loading}
	<div class="flex items-center justify-center h-96">
		<div class="text-center">
			<div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
			<p class="text-muted-foreground">Cargando dashboard...</p>
		</div>
	</div>
{:else if error}
	<div class="bg-destructive/10 border border-destructive rounded-xl p-6 text-center">
		<p class="text-destructive font-semibold mb-2">Error al cargar datos</p>
		<p class="text-sm text-muted-foreground mb-4">{error}</p>
		<button
			onclick={loadData}
			class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
		>
			Reintentar
		</button>
	</div>
{:else}
<div class="space-y-6 animate-fade-in">
	<!-- Encabezado -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-foreground">Dashboard Operativo</h1>
			<p class="text-muted-foreground mt-1">
				{esAdmin ? 'Vista global de todas las automatizaciones' : 'Vista general del rendimiento de tus automatizaciones'}
			</p>
		</div>
		<div
			class="flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground shadow-sm"
		>
			<span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
			<span class="font-semibold">Sistemas operativos</span>
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
		<!-- Bots Activos -->
		<div
			class="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
		>
			<div class="flex items-start justify-between mb-4">
				<div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
					<Activity class="w-5 h-5 text-primary" />
				</div>
			</div>
			<p class="text-3xl font-bold text-foreground">
				{botsActivos} <span class="text-lg font-normal text-muted-foreground">/ {totalAutomatizaciones}</span>
			</p>
			<p class="text-sm text-muted-foreground mt-1 font-medium">Bots Activos</p>
		</div>

		<!-- Ejecuciones Hoy -->
		<div
			class="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
		>
			<div class="flex items-start justify-between mb-4">
				<div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
					<Clock class="w-5 h-5 text-emerald-600" />
				</div>
			</div>
			<p class="text-3xl font-bold text-foreground">{totalEjecuciones}</p>
			<p class="text-sm text-muted-foreground mt-1 font-medium">Ejecuciones Recientes</p>
		</div>

		<!-- Tasa de Éxito -->
		<div
			class="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
		>
			<div class="flex items-start justify-between mb-4">
				<div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
					<CheckCircle2 class="w-5 h-5 text-primary" />
				</div>
			</div>
			<p class="text-3xl font-bold text-foreground">{tasaExito}%</p>
			<p class="text-sm text-muted-foreground mt-1 font-medium">Tasa de Éxito</p>
		</div>

		<!-- Errores -->
		<div
			class="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
		>
			<div class="flex items-start justify-between mb-4">
				<div class="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
					<XCircle class="w-5 h-5 text-red-600" />
				</div>
			</div>
			<p class="text-3xl font-bold text-red-600">{conError}</p>
			<p class="text-sm text-muted-foreground mt-1 font-medium">Ejecuciones con Error</p>
		</div>
	</div>

	<!-- Fila de Gráficas -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Gráfica de barras - Ejecuciones semanales -->
		<div class="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6">
			<div class="flex items-center justify-between mb-1">
				<h3 class="font-bold text-foreground">Ejecuciones Semanales</h3>
				<span class="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">Últimos 7 días</span>
			</div>
			<p class="text-xs text-muted-foreground mb-5">Total de corridas de automatización por día</p>

			{#if maxV > 0}
				<svg viewBox="0 0 500 185" class="w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
					<!-- Líneas de grilla -->
					{#each [0, 0.25, 0.5, 0.75, 1] as frac}
						{@const yPos = 158 - frac * 148}
						<line x1="40" y1={yPos} x2="498" y2={yPos} stroke="hsl(var(--border))" stroke-width="1" />
						<text
							x="34"
							y={yPos + 3.5}
							text-anchor="end"
							fill="hsl(var(--muted-foreground))"
							font-size="9"
							font-family="ui-sans-serif, system-ui, sans-serif"
						>
							{Math.round(frac * maxV)}
						</text>
					{/each}

					<!-- Barras -->
					{#each bars as b}
						<!-- Barra de fondo hover -->
						<rect
							x={b.x}
							y="10"
							width={bw}
							height="148"
							rx="4"
							fill="transparent"
							class="cursor-pointer hover:fill-muted"
						/>
						<!-- Barra principal -->
						<rect
							x={b.x}
							y={158 - b.h}
							width={bw}
							height={b.h}
							rx="5"
							fill={b.today ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
							class="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
						/>
						<!-- Acento superior en barra de hoy -->
						{#if b.today}
							<rect
								x={b.x + 6}
								y={158 - b.h}
								width={bw - 12}
								height="3"
								rx="1.5"
								fill="hsl(var(--primary))"
							/>
						{/if}
						<!-- Etiqueta del día -->
						<text
							x={b.x + bw / 2}
							y="175"
							text-anchor="middle"
							fill={b.today ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
							font-size="11"
							font-weight={b.today ? '700' : '400'}
							font-family="ui-sans-serif, system-ui, sans-serif"
						>
							{b.day}
						</text>
						<!-- Valor sobre la barra -->
						{#if b.v > 0}
							<text
								x={b.x + bw / 2}
								y={158 - b.h - 6}
								text-anchor="middle"
								fill={b.today ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
								font-size="10"
								font-weight={b.today ? '700' : '400'}
								font-family="ui-sans-serif, system-ui, sans-serif"
							>
								{b.v}
							</text>
						{/if}
					{/each}
				</svg>
			{:else}
				<div class="flex items-center justify-center h-48 text-muted-foreground">
					<p>No hay ejecuciones en los últimos 7 días</p>
				</div>
			{/if}
		</div>

		<!-- Donut - Estado de Bots -->
		<div class="bg-card rounded-2xl border border-border shadow-sm p-6">
			<div class="flex items-center justify-between mb-6">
				<h3 class="font-bold text-foreground">Estado de Bots</h3>
				<span class="text-xs text-muted-foreground">{totalBots} registrados</span>
			</div>

			{#if totalBots > 0}
				<div class="flex flex-col items-center">
					<!-- Donut SVG -->
					<div class="relative w-40 h-40">
						<svg
							viewBox="0 0 120 120"
							class="w-full h-full -rotate-90"
							xmlns="http://www.w3.org/2000/svg"
						>
							<!-- Track -->
							<circle
								cx="60"
								cy="60"
								r={r}
								fill="none"
								stroke="hsl(var(--muted))"
								stroke-width="13"
							/>
							<!-- Segmentos -->
							{#each donut as seg}
								<circle
									cx="60"
									cy="60"
									r={r}
									fill="none"
									stroke={seg.color}
									stroke-width="13"
									stroke-dasharray="{seg.len} {circ - seg.len}"
									stroke-dashoffset={seg.offset}
									stroke-linecap="butt"
								/>
							{/each}
						</svg>
						<!-- Centro -->
						<div
							class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
						>
							<span class="text-2xl font-bold text-foreground">{totalBots}</span>
							<span class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">bots</span>
						</div>
					</div>

					<!-- Leyenda -->
					<div class="mt-5 w-full space-y-2.5">
						{#each botHealth as b}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2.5">
									<span
										class="w-3 h-3 rounded-full shrink-0"
										style="background-color: {b.color}"
									></span>
									<span class="text-xs text-foreground">{b.label}</span>
								</div>
								<div class="flex items-center gap-1.5">
									<span class="text-sm font-bold text-foreground">{b.n}</span>
									<span class="text-[10px] text-muted-foreground">
										{Math.round((b.n / totalBots) * 100)}%
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex items-center justify-center h-48 text-muted-foreground">
					<p>No hay automatizaciones registradas</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Grid de Automatizaciones -->
	{#if automatizacionesReactive.length > 0}
		<div>
			<h2 class="text-xl font-bold text-foreground mb-4">Automatizaciones</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each automatizacionesReactive as automatizacion}
					<RobotCard {automatizacion} />
				{/each}
			</div>
		</div>
	{/if}

	<!-- Feed de Actividad Reciente -->
	<div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
		<div class="px-6 py-4 border-b border-border flex items-center justify-between">
			<h3 class="font-bold text-foreground">Actividad Reciente</h3>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-1.5">
					<span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
					<span class="text-xs font-bold text-emerald-600 uppercase tracking-wide">En Vivo</span>
				</div>
			</div>
		</div>
		<div class="divide-y divide-border">
			{#if ejecucionesReactive.length > 0}
				{#each ejecucionesReactive as ejecucion}
					<ExecutionCard {ejecucion} />
				{/each}
			{:else}
				<div class="px-6 py-12 text-center text-muted-foreground">
					<p>No hay ejecuciones recientes</p>
				</div>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.45s ease-out forwards;
	}
</style>
