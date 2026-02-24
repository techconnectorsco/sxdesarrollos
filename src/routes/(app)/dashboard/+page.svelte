<script lang="ts">
    // ─── Mock data (reemplazar con queries de Supabase) ───────────────────────

    const weekly = [
        { day: 'Lun', v: 118 },
        { day: 'Mar', v: 142 },
        { day: 'Mié', v: 96 },
        { day: 'Jue', v: 165 },
        { day: 'Vie', v: 134 },
        { day: 'Sáb', v: 28 },
        { day: 'Hoy', v: 142, today: true },
    ];

    const maxV = Math.max(...weekly.map(d => d.v));
    const bw = 44;
    const chartWidth = 460;
    const n = weekly.length;
    const gap = (chartWidth - n * bw) / (n + 1);
    const bars = weekly.map((d, i) => ({
        ...d,
        x: 40 + gap * (i + 1) + bw * i,
        h: (d.v / maxV) * 148,
    }));

    // Distribución de estado de bots (donut)
    const botHealth = [
        { label: 'Ejecutando', n: 1, color: '#3b82f6' },
        { label: 'Activos',    n: 5, color: '#22c55e' },
        { label: 'Error',      n: 2, color: '#ef4444' },
        { label: 'Inactivos',  n: 2, color: '#cbd5e1' },
    ];
    const totalBots = botHealth.reduce((s, b) => s + b.n, 0);
    const r = 48;
    const circ = 2 * Math.PI * r;
    let cum = 0;
    const donut = botHealth.map(b => {
        const len = (b.n / totalBots) * circ;
        const offset = -cum;
        cum += len;
        return { ...b, len, offset };
    });

    // Feed de actividad reciente
    const activity = [
        { time: '10:24', bot: 'Bot_Contabilidad_v2',  status: 'running', msg: 'Procesando 142 registros contables en SAP...', client: 'Empresa ABC' },
        { time: '10:18', bot: 'Bot_Facturacion_SAP',  status: 'success', msg: '38 facturas generadas y enviadas exitosamente', client: 'Empresa ABC' },
        { time: '09:55', bot: 'Bot_Reportes_BI',      status: 'success', msg: 'Reporte mensual exportado a Power BI (4.2 MB)', client: 'XYZ Corp' },
        { time: '09:32', bot: 'Bot_CRM_Sync',         status: 'error',   msg: 'TIMEOUT: No se pudo conectar a CRM API v4 en 30s', client: 'XYZ Corp' },
        { time: '08:45', bot: 'Bot_RRHH_Nomina',      status: 'success', msg: 'Nómina Q1 procesada: 87 empleados – $1,240,800', client: 'Tech Solutions' },
        { time: '08:12', bot: 'Bot_Inventario_v1',    status: 'success', msg: 'Stock actualizado: 1,240 SKUs – 12 alertas emitidas', client: 'Distribuidora MX' },
    ];

    const statusLabel: Record<string, string> = {
        running: 'PROCESANDO',
        success: 'ÉXITO',
        error:   'ERROR',
    };
</script>

<div class="space-y-6 animate-fade-in">

    <!-- ─── Encabezado ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold text-slate-900">Dashboard Operativo</h1>
            <p class="text-slate-500 mt-1">Vista general del rendimiento de automatizaciones SX.</p>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 shadow-sm">
            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="font-semibold">Sistemas operativos</span>
        </div>
    </div>

    <!-- ─── KPI Cards ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Bots Activos -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
                    </svg>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">+2 esta sem.</span>
            </div>
            <p class="text-3xl font-bold text-slate-900">8 <span class="text-lg font-normal text-slate-400">/ 10</span></p>
            <p class="text-sm text-slate-500 mt-1 font-medium">Bots Activos</p>
        </div>

        <!-- Ejecuciones Hoy -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">+8.2% vs ayer</span>
            </div>
            <p class="text-3xl font-bold text-slate-900">142</p>
            <p class="text-sm text-slate-500 mt-1 font-medium">Ejecuciones Hoy</p>
        </div>

        <!-- Tasa de Éxito -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">+1.2% vs sem.</span>
            </div>
            <p class="text-3xl font-bold text-slate-900">97.8%</p>
            <p class="text-sm text-slate-500 mt-1 font-medium">Tasa de Éxito</p>
        </div>

        <!-- Ahorro Estimado -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">+$380 vs mes ant.</span>
            </div>
            <p class="text-3xl font-bold text-blue-600">$4,250</p>
            <p class="text-sm text-slate-500 mt-1 font-medium">Ahorro Estimado (mes)</p>
        </div>
    </div>

    <!-- ─── Fila de Gráficas ────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Gráfica de barras - Ejecuciones semanales -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between mb-1">
                <h3 class="font-bold text-slate-900">Ejecuciones Semanales</h3>
                <span class="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Últimos 7 días</span>
            </div>
            <p class="text-xs text-slate-400 mb-5">Total de corridas de automatización por día</p>

            <svg viewBox="0 0 500 185" class="w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
                <!-- Líneas de grilla -->
                {#each [0, 0.25, 0.5, 0.75, 1] as frac}
                    {@const yPos = 158 - frac * 148}
                    <line x1="40" y1={yPos} x2="498" y2={yPos} stroke="#f1f5f9" stroke-width="1"/>
                    <text x="34" y={yPos + 3.5} text-anchor="end" fill="#cbd5e1" font-size="9" font-family="ui-sans-serif, system-ui, sans-serif">
                        {Math.round(frac * maxV)}
                    </text>
                {/each}

                <!-- Barras -->
                {#each bars as b}
                    <!-- Barra de fondo hover (invisible) -->
                    <rect x={b.x} y="10" width={bw} height="148" rx="4" fill="transparent" class="cursor-pointer hover:fill-slate-50"/>
                    <!-- Barra principal -->
                    <rect
                        x={b.x}
                        y={158 - b.h}
                        width={bw}
                        height={b.h}
                        rx="5"
                        fill={b.today ? '#3b82f6' : '#bfdbfe'}
                        class="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                    />
                    <!-- Acento superior en barra de hoy -->
                    {#if b.today}
                        <rect x={b.x + 6} y={158 - b.h} width={bw - 12} height="3" rx="1.5" fill="#1d4ed8"/>
                    {/if}
                    <!-- Etiqueta del día -->
                    <text x={b.x + bw / 2} y="175" text-anchor="middle" fill={b.today ? '#3b82f6' : '#94a3b8'} font-size="11" font-weight={b.today ? '700' : '400'} font-family="ui-sans-serif, system-ui, sans-serif">
                        {b.day}
                    </text>
                    <!-- Valor sobre la barra -->
                    <text x={b.x + bw / 2} y={158 - b.h - 6} text-anchor="middle" fill={b.today ? '#1d4ed8' : '#94a3b8'} font-size="10" font-weight={b.today ? '700' : '400'} font-family="ui-sans-serif, system-ui, sans-serif">
                        {b.v}
                    </text>
                {/each}
            </svg>
        </div>

        <!-- Donut - Estado de Bots -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="font-bold text-slate-900">Estado de Bots</h3>
                <span class="text-xs text-slate-400">{totalBots} registrados</span>
            </div>

            <div class="flex flex-col items-center">
                <!-- Donut SVG -->
                <div class="relative w-40 h-40">
                    <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90" xmlns="http://www.w3.org/2000/svg">
                        <!-- Track -->
                        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" stroke-width="13"/>
                        <!-- Segmentos -->
                        {#each donut as seg}
                            <circle
                                cx="60" cy="60" r={r}
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
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span class="text-2xl font-bold text-slate-900">{totalBots}</span>
                        <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">bots</span>
                    </div>
                </div>

                <!-- Leyenda -->
                <div class="mt-5 w-full space-y-2.5">
                    {#each botHealth as b}
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2.5">
                                <span class="w-3 h-3 rounded-full shrink-0" style="background-color: {b.color}"></span>
                                <span class="text-xs text-slate-600">{b.label}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-bold text-slate-900">{b.n}</span>
                                <span class="text-[10px] text-slate-400">{Math.round(b.n / totalBots * 100)}%</span>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <!-- ─── Feed de Actividad Reciente ─────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-slate-900">Actividad Reciente</h3>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <span class="text-xs font-bold text-emerald-600 uppercase tracking-wide">En Vivo</span>
                </div>
                <a href="/logs" class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Ver bitácora completa →
                </a>
            </div>
        </div>
        <div class="divide-y divide-slate-50">
            {#each activity as a}
                <div class="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/70 transition-colors">
                    <span class="w-2 h-2 rounded-full shrink-0 {
                        a.status === 'running' ? 'bg-blue-500 shadow-[0_0_6px_#3b82f6] animate-pulse' :
                        a.status === 'success' ? 'bg-emerald-500' :
                        'bg-red-500'
                    }"></span>
                    <span class="font-mono text-[11px] text-slate-400 shrink-0 w-10 tabular-nums">{a.time}</span>
                    <span class="text-[11px] font-bold text-slate-800 shrink-0 w-44 truncate">{a.bot}</span>
                    <span class="text-[11px] text-slate-500 flex-1 truncate">{a.msg}</span>
                    <span class="text-[10px] text-slate-400 shrink-0 hidden md:block w-28 truncate text-right">{a.client}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 {
                        a.status === 'running' ? 'bg-blue-50 text-blue-600' :
                        a.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-red-50 text-red-600'
                    }">
                        {statusLabel[a.status]}
                    </span>
                </div>
            {/each}
        </div>
    </div>

</div>

<style>
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fade-in 0.45s ease-out forwards;
    }
</style>
