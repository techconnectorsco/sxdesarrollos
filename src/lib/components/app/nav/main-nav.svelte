<script lang="ts">
  /**
   * @module MainNavigation
   * @description Navigation header with logo, theme toggle and user account dropdown.
   */
	import Account from './account-icon.svelte';
	import { siteConfig } from '$lib/config/site';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';

	// Solo recibir session, user y opcional perfil (para avatar)
	let {
		session = null,
		user = null,
		perfil = null
	} = $props<{
		session?: any;
		user?: any;
		perfil?: any;
	}>();

	function handleToggleMode() {
		toggleMode();
	}
</script>

<header
	class="fixed inset-x-0 top-0 z-50 border-b-2 bg-background shadow-md"
>
	<div
		class="flex w-full items-center justify-between px-4 py-3 sm:px-8 md:px-12 lg:px-16"
		aria-label="Global"
	>
		<!-- Logo -->
		<div class="flex items-center">
			<a href="/" class="flex items-center gap-3 group">
				<img
					src={siteConfig.logo}
					alt={siteConfig.title}
					class="h-12 w-auto transition-transform duration-300 group-hover:scale-105 py-1"
				/>
			</a>
		</div>

		<!-- Navegación y controles -->
		<div class="flex items-center gap-2">
			<Button onclick={handleToggleMode} variant="outline" size="icon" class="relative overflow-hidden">
				<SunIcon
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>

			<div class="p-2 rounded-lg hover:bg-accent transition-colors">
				<Account {session} {user} {perfil} />
			</div>
		</div>
	</div>
</header>