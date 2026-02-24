<script lang="ts">
    // ─── Mock data (reemplazar con queries de Supabase) ───────────────────────

    type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM';

    const allLogs: {
        id: number; ts: string; level: LogLevel;
        bot: string; client: string; jobId: string; msg: string;
    }[] = [
        { id: 12, ts: '10:24:11', level: 'INFO',    bot: 'Bot_Contabilidad_v2', client: 'Empresa ABC',     jobId: 'JOB_9923', msg: 'INICIANDO ciclo de extracción — 142 registros en cola' },
        { id: 11, ts: '10:24:09', level: 'INFO',    bot: 'Bot_Contabilidad_v2', client: 'Empresa ABC',     jobId: 'JOB_9923', msg: 'Autenticación SAP Cloud OK — sesión establecida' },
        { id: 10, ts: '10:18:32', level: 'SUCCESS', bot: 'Bot_Facturacion_SAP', client: 'Empresa ABC',     jobId: 'JOB_9920', msg: 'Proceso completado: 38 facturas generadas y enviadas' },
        { id:  9, ts: '10:18:28', level: 'INFO',    bot: 'Bot_Facturacion_SAP', client: 'Empresa ABC',     jobId: 'JOB_9920', msg: 'Validando esquema XML de facturas electrónicas...' },
        { id:  8, ts: '10:18:15', level: 'INFO',    bot: 'Bot_Facturacion_SAP', client: 'Empresa ABC',     jobId: 'JOB_9920', msg: 'Conectando a endpoint SAP FI — host: sap-fi.empresaabc.local' },
        { id:  7, ts: '09:55:41', level: 'SUCCESS', bot: 'Bot_Reportes_BI',     client: 'XYZ Corp',        jobId: 'JOB_9915', msg: 'Reporte mensual generado: 4.2 MB — exportado a Power BI workspace' },
        { id:  6, ts: '09:55:30', level: 'INFO',    bot: 'Bot_Reportes_BI',     client: 'XYZ Corp',        jobId: 'JOB_9915', msg: 'Consolidando datos de ventas Q1 2024 — 14 hojas procesadas' },
        { id:  5, ts: '09:32:17', level: 'ERROR',   bot: 'Bot_CRM_Sync',        client: 'XYZ Corp',        jobId: 'JOB_9910', msg: 'TIMEOUT: Sin respuesta del endpoint /api/v4/contacts en 30s' },
        { id:  4, ts: '09:32:10', level: 'WARNING', bot: 'Bot_CRM_Sync',        client: 'XYZ Corp',        jobId: 'JOB_9910', msg: 'Reintento 3/3 — CRM API responde con latencia > 5000ms' },
        { id:  3, ts: '09:31:58', level: 'WARNING', bot: 'Bot_CRM_Sync',        client: 'XYZ Corp',        jobId: 'JOB_9910', msg: 'Reintento 2/3 — conexión inestable detectada' },
        { id:  2, ts: '08:45:55', level: 'SUCCESS', bot: 'Bot_RRHH_Nomina',     client: 'Tech Solutions',  jobId: 'JOB_9905', msg: 'Nómina Q1 procesada: 87 empleados — total $1,240,800.00 MXN' },
        { id:  1, ts: '08:12:03', level: 'SUCCESS', bot: 'Bot_Inventario_v1',   client: 'Distribuidora MX',jobId: 'JOB_9900', msg: 'Stock actualizado: 1,240 SKUs — 12 alertas de mínimo emitidas' },
        { id:  0, ts: '07:00:00', level: 'SYSTEM',  bot: 'SX-ENGINE',           client: '—',               jobId: 'SYS',      msg: 'SX RPA ENGINE v1.0.0 — TODOS LOS SERVICIOS INICIADOS CORRECTAMENTE' },
    ];

    const bots = [...new Set(allLogs.map(l => l.bot))];

    // Estado reactivo
    let levelFilter = $state<LogLevel | 'ALL'>('ALL');
    let botFilter   = $state('ALL');
    let search      = $state('');

    const filteredLogs = $derived(
        allLogs.filter(l => {
            const matchLevel = levelFilter === 'ALL' || l.level === levelFilter;
            const matchBot   = botFilter   === 'ALL' || l.bot   === botFilter;
            const matchText  = search === '' || l.msg.toLowerCase().includes(search.toLowerCase()) || l.bot.toLowerCase().includes(search.toLowerCase());
            return matchLevel && matchBot && matchText;
        })
    );

    // Config visual por nivel
    type LevelCfg = { label: string; text: string; badge: string; dot: string };
    const levelCfg: Record<LogLevel, LevelCfg> = {
        INFO:    { label: 'INFO',       text: 'text-slate-400',   badge: 'bg-slate-800 text-slate-300',    dot: 'bg-slate-500' },
        SUCCESS: { label: 'SUCCESS',    text: 'text-emerald-400', badge: 'bg-emerald-900/60 text-emerald-400', dot: 'bg-emerald-500' },
        WARNING: { label: 'WARNING',    text: 'text-amber-400',   badge: 'bg-amber-900/50 text-amber-400', dot: 'bg-amber-500' },
        ERROR:   { label: 'ERROR',      text: 'text-red-400',     badge: 'bg-red-900/60 text-red-400',     dot: 'bg-red-500' },
        SYSTEM:  { label: 'SYSTEM',     text: 'text-blue-400',    badge: 'bg-blue-900/60 text-blue-400',   dot: 'bg-blue-500' },
    };

    const filterTabs: { label: string; value: LogLevel | 'ALL'; count?: () => number }[] = [
        { label: 'Todos',        value: 'ALL' },
        { label: 'Info',         value: 'INFO' },
        { label: 'Éxito',        value: 'SUCCESS' },
        { label: 'Advertencia',  value: 'WARNING' },
        { label: 'Error',        value: 'ERROR' },
    ];

    const countByLevel = $derived({
        ALL:     allLogs.length,
        INFO:    allLogs.filter(l => l.level === 'INFO').length,
        SUCCESS: allLogs.filter(l => l.level === 'SUCCESS').length,
        WARNING: allLogs.filter(l => l.level === 'WARNING').length,
        ERROR:   allLogs.filter(l => l.level === 'ERROR').length,
    });
</script>

<div class="space-y-5 animate-fade-in">

    <!-- ─── Encabezado ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold text-slate-900">Bitácora Global</h1>
            <p class="text-slate-500 mt-1">Historial completo de ejecuciones y eventos del sistema SX.</p>
        </div>
        <button class="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Exportar logs
        </button>
    </div>

    <!-- ─── Filtros ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-3">
        <!-- Tabs de nivel -->
        <div class="flex items-center gap-2 flex-wrap">
            {#each filterTabs as tab}
                {@const cnt = countByLevel[tab.value as keyof typeof countByLevel]}
                <button
                    onclick={() => levelFilter = tab.value}
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all {
                        levelFilter === tab.value
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }"
                >
                    {tab.label}
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {levelFilter === tab.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}">
                        {cnt}
                    </span>
                </button>
            {/each}
        </div>

        <!-- Búsqueda + filtro por bot -->
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                    type="text"
                    placeholder="Buscar en logs..."
                    bind:value={search}
                    class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
            </div>
            <select
                bind:value={botFilter}
                class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all min-w-48"
            >
                <option value="ALL">Todos los bots</option>
                {#each bots as b}
                    <option value={b}>{b}</option>
                {/each}
            </select>
        </div>
    </div>

    <!-- ─── Terminal de logs ────────────────────────────────────────────────── -->
    <div class="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">

        <!-- Barra del terminal -->
        <div class="bg-slate-950 px-5 py-3 flex items-center justify-between border-b border-slate-800">
            <div class="flex items-center gap-3">
                <div class="flex gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-red-500/60"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500/60"></div>
                </div>
                <span class="text-slate-500 text-xs font-mono">sx_log_stream — {filteredLogs.length} entradas</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span class="text-[11px] text-emerald-500 font-mono font-semibold">LIVE</span>
            </div>
        </div>

        <!-- Entradas de log -->
        <div class="p-4 font-mono text-xs space-y-0.5 max-h-[520px] overflow-y-auto scrollbar-thin">

            {#if filteredLogs.length === 0}
                <div class="py-12 flex flex-col items-center justify-center text-slate-600">
                    <svg class="w-8 h-8 mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="text-slate-500">Sin entradas para los filtros seleccionados</p>
                </div>
            {:else}
                {#each filteredLogs as log}
                    {@const cfg = levelCfg[log.level]}
                    <div class="flex items-start gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors group">
                        <!-- Dot -->
                        <span class="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 {cfg.dot}"></span>
                        <!-- Timestamp -->
                        <span class="text-slate-500 shrink-0 tabular-nums w-16">{log.ts}</span>
                        <!-- Level badge -->
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 {cfg.badge} w-16 text-center">{cfg.label}</span>
                        <!-- Bot -->
                        <span class="text-slate-400 shrink-0 w-44 truncate hidden sm:block">{log.bot}</span>
                        <!-- Message -->
                        <span class="{cfg.text} flex-1 leading-relaxed">{log.msg}</span>
                        <!-- Job ID -->
                        <span class="text-slate-700 shrink-0 hidden lg:block tabular-nums group-hover:text-slate-500 transition-colors">{log.jobId}</span>
                    </div>
                {/each}
                <!-- Cursor parpadeante al final -->
                {#if levelFilter === 'ALL' && botFilter === 'ALL' && search === ''}
                    <div class="flex items-center gap-3 px-3 py-1.5">
                        <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-700"></span>
                        <span class="text-slate-600 w-16 tabular-nums">—</span>
                        <span class="text-slate-700 w-16"></span>
                        <span class="text-slate-700 hidden sm:block w-44"></span>
                        <span class="text-slate-600">Esperando eventos del sistema</span>
                        <span class="inline-block w-2 h-4 bg-slate-600 animate-pulse ml-1"></span>
                    </div>
                {/if}
            {/if}
        </div>
    </div>

</div>

<style>
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.45s ease-out forwards; }

    .scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: #334155 #0f172a;
    }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: #0f172a; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
</style>
