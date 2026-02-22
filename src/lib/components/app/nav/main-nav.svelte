<script lang="ts">
  /**
   * @module MainNavigation
   * @description Navigation header with logo and user account dropdown.
   */
	import Account from './account-icon.svelte';
	import { siteConfig } from '$lib/config/site';

	// Solo recibir session, user y opcional perfil (para avatar)
	let { session = null, user = null, perfil = null } = $props<{ 
		session?: any; 
		user?: any;
		perfil?: any;
	}>();
</script>

<header
	class="fixed inset-x-0 top-0 z-50 border-b-2 bg-white shadow-md"
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
			<div class="p-2 rounded-lg hover:bg-blue-50 transition-colors">
				<Account {session} {user} {perfil} />
			</div>
		</div>
	</div>
</header>