<script lang="ts">
    // import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte'; // componente pendiente
    import { onMount } from 'svelte';
    import { 
        Bot, Activity, BookOpen, RefreshCw,
        CheckCircle2, XCircle, MessageSquare, User, X
    } from 'lucide-svelte';

    // --- VARIABLES DE ESTADO ---
    let health = $state<any>(null);
    let stats = $state<any>({ memory: { total: 0 } });
    let chats = $state<any[]>([]); 
    
    let loading = $state(true);
    let refreshing = $state(false);
    let error = $state<string | null>(null);
    let lastUpdate = $state(new Date());

    // Estado del Modal de Chat
    let chatSeleccionado = $state<any>(null);
    let mostrarModal = $state(false);

    onMount(() => {
        loadData();
    });

    async function loadData() {
        if (health) refreshing = true;
        error = null;
        
        try {
            // ✅ RUTAS CORREGIDAS (Basadas en tus carpetas reales)
            
            // 1. Salud
            const healthRes = await fetch('/api/chat/health');
            if (healthRes.ok) health = await healthRes.json();

            // 2. Estadísticas
            const statsRes = await fetch('/api/chat/stats');
            if (statsRes.ok) {
                const json = await statsRes.json();
                if (json.data) stats = json.data;
            }

            // 3. Conversaciones
            const logsRes = await fetch('/api/chat/logs');
            if (logsRes.ok) {
                const json = await logsRes.json();
                // Si viene data la usamos, si no array vacío
                chats = json.data || [];
            } else {
                console.warn("No se pudieron cargar los chats");
            }
            
            lastUpdate = new Date();
        } catch (err: any) {
            console.error(err);
            error = "Error de conexión. Revisa que el servidor esté corriendo.";
        } finally {
            loading = false;
            refreshing = false;
        }
    }

    function abrirChat(sesion: any) {
        chatSeleccionado = sesion;
        mostrarModal = true;
    }

    function cerrarChat() {
        mostrarModal = false;
        chatSeleccionado = null;
    }

    function formatFecha(fecha: string) {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleString('es-CR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
</script>

<div class="min-h-screen bg-gray-50 font-sans">
    <!-- <SidebarAdmin /> -->

    <main class="pl-80 pr-8 py-8">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Bot class="text-blue-600" size={28} />
                    Gestión Teo AI
                </h1>
                <p class="text-gray-500 mt-1">Supervisión de conversaciones y estado del bot.</p>
            </div>
            
            <button 
                onclick={loadData}
                disabled={loading || refreshing}
                class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
                <RefreshCw size={16} class={refreshing ? "animate-spin" : ""} />
                {refreshing ? 'Actualizando...' : 'Actualizar Todo'}
            </button>
        </div>

        {#if error}
            <div class="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-center gap-3">
                <Activity size={20} />
                <p class="font-medium">{error}</p>
            </div>
        {/if}

        {#if loading && !health}
             <div class="flex flex-col items-center justify-center h-64">
                <div class="animate-spin text-blue-600 mb-4"><RefreshCw size={32} /></div>
                <p class="text-gray-400">Cargando información...</p>
            </div>
        {:else if health}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div class="p-4 rounded-full {health.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                        {#if health.status === 'healthy'} <CheckCircle2 size={32} /> {:else} <XCircle size={32} /> {/if}
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 font-medium uppercase tracking-wider">Estado del Servicio</p>
                        <h3 class="text-2xl font-bold text-gray-800 mb-1">{health.status === 'healthy' ? 'En Línea' : 'Fuera de Servicio'}</h3>
                        <p class="text-xs text-gray-400">El bot está respondiendo correctamente.</p>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div class="p-4 rounded-full bg-purple-100 text-purple-600">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 font-medium uppercase tracking-wider">Base de Conocimiento</p>
                        <h3 class="text-2xl font-bold text-gray-800 mb-1">{stats.memory?.total || 0}</h3>
                        <p class="text-xs text-gray-400">Registros de información aprendidos.</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 class="font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare size={20} class="text-blue-500" />
                        Historial de Conversaciones
                    </h3>
                    <span class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">Últimas sesiones</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th class="px-6 py-4 w-48">Fecha</th>
                                <th class="px-6 py-4 w-48">Sesión</th>
                                <th class="px-6 py-4">Último Mensaje del Usuario</th>
                                <th class="px-6 py-4 text-right w-32">Acción</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#if chats.length === 0}
                                <tr>
                                    <td colspan="4" class="px-6 py-12 text-center text-gray-400">
                                        <div class="flex flex-col items-center gap-2">
                                            <MessageSquare size={32} class="text-gray-200" />
                                            <p>No se encontraron conversaciones recientes.</p>
                                        </div>
                                    </td>
                                </tr>
                            {:else}
                                {#each chats as chat}
                                    <tr class="hover:bg-gray-50 transition-colors group">
                                        <td class="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {formatFecha(chat.ultima_fecha)}
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-2">
                                                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={14} />
                                                </div>
                                                <span class="text-gray-500 text-xs truncate w-24" title={chat.id}>
                                                    {chat.id}
                                                </span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 text-gray-800 font-medium max-w-lg truncate">
                                            "{chat.ultimo_mensaje}"
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <button 
                                                onclick={() => abrirChat(chat)}
                                                class="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                Ver Chat
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}
    </main>

    {#if mostrarModal && chatSeleccionado}
        <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 overflow-hidden">
                
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 class="font-bold text-gray-800">Lectura de Chat</h3>
                        <p class="text-xs text-gray-500 mt-0.5">ID Sesión: {chatSeleccionado.id}</p>
                    </div>
                    <button onclick={cerrarChat} class="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {#each chatSeleccionado.mensajes as msg}
                        <div class="flex justify-end gap-3">
                            <div class="max-w-[85%]">
                                <div class="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm">
                                    <p class="text-sm leading-relaxed">{msg.user_message}</p>
                                </div>
                                <p class="text-[10px] text-gray-400 text-right mt-1 px-1">
                                    Usuario • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>

                        <div class="flex justify-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm mt-1">
                                <Bot size={16} />
                            </div>
                            <div class="max-w-[85%]">
                                <div class="bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                                    <p class="text-sm leading-relaxed whitespace-pre-wrap">{msg.assistant_response}</p>
                                </div>
                                <p class="text-[10px] text-gray-400 mt-1 px-1">TEO</p>
                            </div>
                        </div>
                    {/each}
                </div>

                <div class="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <button onclick={cerrarChat} class="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>