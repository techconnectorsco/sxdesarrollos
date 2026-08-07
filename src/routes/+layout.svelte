<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	import ChatWidget from '$lib/widget/ChatWidget.svelte'; // ← 1. IMPORT
	import '../app.css';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<ModeWatcher defaultMode="light" />

<div class="relative flex min-h-screen flex-col">
	{@render children()}
</div>

<Toaster richColors duration={4000} />

<!-- 2. WIDGET -->
<ChatWidget
	apiBase="https://unlikable-fondly-scheme.ngrok-free.dev"
	logoPath="/widget/logo.png"
	title="SoporteXperto"
	subtitle="Asistente virtual"
	accentColor="#2563eb"
	position="bottom-right"
/>
