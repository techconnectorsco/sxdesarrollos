<script lang="ts">
	import { page } from '$app/state';
	import { 
		LayoutDashboard, 
		Users, 
		Cpu, 
		FileText, 
		Settings, 
		ChevronLeft,
		ChevronRight,
		LogOut,
		ExternalLink
	} from 'lucide-svelte';
	import { siteConfig } from '$lib/config/site';

	let collapsed = $state(false);

	const navItems = [
		{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
		{ label: 'Clientes', icon: Users, href: '/clientes' },
		{ label: 'Centro de Control', icon: Cpu, href: '/bots' },
		{ label: 'Bitácora', icon: FileText, href: '/logs' },
	];

	const secondaryItems = [
		{ label: 'Configuración', icon: Settings, href: '/admin/ajustes' },
	];

	function toggleSidebar() {
		collapsed = !collapsed;
	}

    let currentPath = $derived(page.url.pathname);
</script>

<aside 
	class="fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 z-50 flex flex-col shadow-2xl {collapsed ? 'w-20' : 'w-64'}"
>
	<!-- Header / Logo -->
	<div class="h-20 flex items-center px-6 border-b border-slate-800/50">
		<div class="flex items-center gap-3 overflow-hidden">
			<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-500/20">
				SX
			</div>
			{#if !collapsed}
				<span class="font-bold text-xl text-white tracking-tight animate-fade-in truncate">
					Productivity
				</span>
			{/if}
		</div>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
		<div class="px-3 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
			{collapsed ? 'Main' : 'Gestión Principal'}
		</div>
		{#each navItems as item}
			<a 
				href={item.href}
				class="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 {currentPath.startsWith(item.href) ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}"
			>
				<svelte:component this={item.icon} class="w-5 h-5 shrink-0 {currentPath.startsWith(item.href) ? 'text-blue-500' : 'text-slate-500 group-hover:text-blue-400'}" />
				{#if !collapsed}
					<span class="text-sm truncate">{item.label}</span>
				{/if}
				{#if collapsed}
					<!-- Tooltip simple (Browser default) -->
					<div class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
						{item.label}
					</div>
				{/if}
			</a>
		{/each}

		<div class="pt-8 px-3 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
			{collapsed ? 'Ext' : 'Herramientas'}
		</div>
		{#each secondaryItems as item}
			<a 
				href={item.href}
				class="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 {currentPath.startsWith(item.href) ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'hover:bg-slate-800 hover:text-white'}"
			>
				<svelte:component this={item.icon} class="w-5 h-5 shrink-0 text-slate-500 group-hover:text-blue-400" />
				{#if !collapsed}
					<span class="text-sm truncate">{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Footer -->
	<div class="p-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
		<button 
			onclick={toggleSidebar}
			class="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white text-xs font-medium"
		>
			{#if collapsed}
				<ChevronRight class="w-4 h-4" />
			{:else}
				<ChevronLeft class="w-4 h-4" />
				<span>Colapsar</span>
			{/if}
		</button>
		
		{#if !collapsed}
			<div class="mt-4 flex items-center gap-3 px-2">
				<div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
					SX
				</div>
				<div class="overflow-hidden">
					<p class="text-[10px] text-slate-500 font-medium">Versión 1.0.0</p>
					<p class="text-xs text-slate-400 truncate">SoporteXperto</p>
				</div>
			</div>
		{/if}
	</div>
</aside>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateX(-10px); }
		to { opacity: 1; transform: translateX(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out forwards;
	}
</style>
