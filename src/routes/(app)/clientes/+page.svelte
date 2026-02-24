<script lang="ts">
    // ─── Mock data (reemplazar con queries de Supabase) ───────────────────────

    const clients = [
        {
            id: 'cli_001',
            company: 'Empresa ABC',
            contact: 'Carlos Mendoza',
            email: 'cmendoza@empresaabc.com',
            plan: 'enterprise' as const,
            botsCount: 3,
            activeRuns: 1,
            lastActivity: 'hace 5 min',
            portalActive: true,
            initials: 'AB',
            color: 'bg-blue-600',
        },
        {
            id: 'cli_002',
            company: 'XYZ Corp',
            contact: 'María García',
            email: 'mgarcia@xyzcorp.com',
            plan: 'profesional' as const,
            botsCount: 2,
            activeRuns: 0,
            lastActivity: 'hace 2h',
            portalActive: true,
            initials: 'XY',
            color: 'bg-violet-600',
        },
        {
            id: 'cli_003',
            company: 'Tech Solutions',
            contact: 'Roberto Jiménez',
            email: 'rjimenez@techsolutions.mx',
            plan: 'profesional' as const,
            botsCount: 1,
            activeRuns: 0,
            lastActivity: 'hace 1d',
            portalActive: false,
            initials: 'TS',
            color: 'bg-emerald-600',
        },
        {
            id: 'cli_004',
            company: 'Distribuidora MX',
            contact: 'Ana López',
            email: 'alopez@distribuidoramx.com',
            plan: 'basico' as const,
            botsCount: 1,
            activeRuns: 1,
            lastActivity: 'hace 30 min',
            portalActive: true,
            initials: 'DM',
            color: 'bg-amber-600',
        },
    ];

    const planConfig = {
        enterprise:   { label: 'Enterprise',   color: 'bg-blue-50 text-blue-700 border-blue-100' },
        profesional:  { label: 'Profesional',  color: 'bg-violet-50 text-violet-700 border-violet-100' },
        basico:       { label: 'Básico',        color: 'bg-slate-50 text-slate-600 border-slate-200' },
    };

    // Resumen de stats
    const totalBots    = clients.reduce((s, c) => s + c.botsCount, 0);
    const portalsActive = clients.filter(c => c.portalActive).length;
    const runningNow   = clients.reduce((s, c) => s + c.activeRuns, 0);

    // Estado modal nuevo cliente (mock - sin backend aún)
    let showNewModal = $state(false);
</script>

<div class="space-y-6 animate-fade-in">

    <!-- ─── Encabezado ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold text-slate-900">Registro de Clientes</h1>
            <p class="text-slate-500 mt-1">Gestiona las organizaciones y su acceso al portal SX.</p>
        </div>
        <button
            onclick={() => showNewModal = true}
            class="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 text-sm"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo Cliente
        </button>
    </div>

    <!-- ─── Stats de resumen ────────────────────────────────────────────────── -->
    <div class="grid grid-cols-3 gap-4">
        <div class="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p class="text-2xl font-bold text-slate-900">{clients.length}</p>
            <p class="text-xs text-slate-500 mt-0.5 font-medium">Clientes totales</p>
        </div>
        <div class="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p class="text-2xl font-bold text-emerald-600">{portalsActive}</p>
            <p class="text-xs text-slate-500 mt-0.5 font-medium">Portales activos</p>
        </div>
        <div class="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p class="text-2xl font-bold text-blue-600">{totalBots}</p>
            <p class="text-xs text-slate-500 mt-0.5 font-medium">Bots desplegados</p>
        </div>
    </div>

    <!-- ─── Grid de tarjetas de clientes ──────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        {#each clients as c}
            {@const plan = planConfig[c.plan]}
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">

                <!-- Franja superior con color del cliente -->
                <div class="h-1.5 {c.color}"></div>

                <div class="p-5">
                    <!-- Fila superior: avatar + info + plan -->
                    <div class="flex items-start gap-4">
                        <!-- Avatar con iniciales -->
                        <div class="w-12 h-12 rounded-2xl {c.color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                            {c.initials}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h3 class="text-base font-bold text-slate-900 truncate">{c.company}</h3>
                                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border {plan.color}">{plan.label}</span>
                            </div>
                            <p class="text-sm text-slate-500 mt-0.5 truncate">{c.contact}</p>
                            <p class="text-xs text-slate-400 truncate">{c.email}</p>
                        </div>
                    </div>

                    <!-- Separador -->
                    <div class="my-4 border-t border-slate-100"></div>

                    <!-- Stats del cliente -->
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="text-center">
                            <p class="text-xl font-bold text-slate-900">{c.botsCount}</p>
                            <p class="text-[11px] text-slate-400 font-medium">Bots</p>
                        </div>
                        <div class="text-center border-x border-slate-100">
                            <p class="text-xl font-bold {c.activeRuns > 0 ? 'text-blue-600' : 'text-slate-400'}">{c.activeRuns}</p>
                            <p class="text-[11px] text-slate-400 font-medium">En ejecución</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[11px] font-semibold text-slate-600 mt-1">{c.lastActivity}</p>
                            <p class="text-[11px] text-slate-400 font-medium">Últ. actividad</p>
                        </div>
                    </div>

                    <!-- Portal status + acciones -->
                    <div class="flex items-center justify-between gap-3">
                        <!-- Portal badge -->
                        <div class="flex items-center gap-2">
                            {#if c.portalActive}
                                <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
                                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Portal activo
                                </span>
                            {:else}
                                <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-500">
                                    <span class="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                    Sin portal
                                </span>
                            {/if}
                        </div>

                        <!-- Botones de acción -->
                        <div class="flex items-center gap-2">
                            {#if c.portalActive}
                                <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                    </svg>
                                    Ver Portal
                                </button>
                            {:else}
                                <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                    Activar Portal
                                </button>
                            {/if}
                            <button class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>

</div>

<!-- ─── Modal: Nuevo Cliente (placeholder) ──────────────────────────────────── -->
{#if showNewModal}
    <!-- Backdrop -->
    <button
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 cursor-default"
        onclick={() => showNewModal = false}
        aria-label="Cerrar modal"
    ></button>

    <!-- Panel -->
    <div class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-slate-200">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-slate-900">Nuevo Cliente</h2>
            <button onclick={() => showNewModal = false} class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Empresa</label>
                <input type="text" placeholder="Nombre de la empresa" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Contacto</label>
                <input type="text" placeholder="Nombre del contacto" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
                <input type="email" placeholder="contacto@empresa.com" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Plan</label>
                <select class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all">
                    <option value="basico">Básico</option>
                    <option value="profesional">Profesional</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>
        </div>
        <div class="flex gap-3 mt-6">
            <button onclick={() => showNewModal = false} class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancelar
            </button>
            <button class="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                Crear Cliente
            </button>
        </div>
        <p class="text-center text-[11px] text-slate-400 mt-3">La integración con Supabase se habilitará próximamente.</p>
    </div>
{/if}

<style>
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.45s ease-out forwards; }
</style>
