<script lang="ts">
	import type { AgenteSAP, MetodoEnvioGira, OrdenEjecucionGira } from '$lib/quimicas_unidas/types';
	import type { BrandConfig } from '$lib/brand/types';

	let {
		apiBase = '/quimicas_unidas/api',
		brand
	}: {
		apiBase?: string;
		brand: BrandConfig;
	} = $props();

	let abierto = $state(false);
	let cargando = $state(false);
	let cargados = $state(false);
	let errorCarga = $state<string | null>(null);
	let agentes = $state<AgenteSAP[]>([]);

	let seleccionado = $state<AgenteSAP | null>(null);
	let metodo = $state<MetodoEnvioGira>('agente');
	let correoRevision = $state(brand.correoRevisionDefault);

	let confirmando = $state(false);
	let enviando = $state(false);
	let resultado = $state<{ ok: boolean; texto: string } | null>(null);

	const ayudaMetodo = $derived(
		metodo === 'agente'
			? 'La gira se envía directo al correo del agente registrado en SAP.'
			: 'La gira llega al correo indicado abajo (por ejemplo, para reimprimirla en oficina). El agente no la recibe.'
	);

	async function abrir() {
		abierto = true;
		resultado = null;
		confirmando = false;
		if (!cargados) await cargarAgentes();
	}

	function cerrar() {
		abierto = false;
		confirmando = false;
	}

	async function cargarAgentes() {
		cargando = true;
		errorCarga = null;
		try {
			const res = await fetch(`${apiBase}/agentes`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			agentes = data.agentes;
			cargados = true;
		} catch (e) {
			errorCarga = 'No se pudo cargar la lista de agentes. Verificá la conexión al Service Layer.';
			console.error(e);
		} finally {
			cargando = false;
		}
	}

	function elegirAgente(e: Event) {
		const cod = Number((e.currentTarget as HTMLSelectElement).value);
		seleccionado = agentes.find((a) => a.codigo === cod) ?? null;
	}

	function puedeContinuar() {
		if (!seleccionado) return false;
		if (metodo === 'revision' && !correoRevision.trim()) return false;
		return true;
	}

	function pedirConfirmacion() {
		if (!puedeContinuar()) return;
		confirmando = true;
	}

	async function enviarGira() {
		if (!seleccionado) return;
		enviando = true;
		resultado = null;
		try {
			const body: OrdenEjecucionGira = {
				agenteCodigo: String(seleccionado.codigo),
				metodo,
				correoRevision: metodo === 'revision' ? correoRevision.trim() : undefined
			};
			const res = await fetch(`${apiBase}/ejecutar-gira`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const data = await res.json();
			resultado = {
				ok: res.ok,
				texto: data.mensaje ?? (res.ok ? 'Gira enviada.' : 'No se pudo enviar la gira.')
			};
		} catch (e) {
			resultado = { ok: false, texto: 'Error de red al enviar la gira.' };
			console.error(e);
		} finally {
			enviando = false;
			confirmando = false;
		}
	}
</script>

<div
	style="
		--brand-primary:        {brand.css.primary};
		--brand-primary-hover:  {brand.css.primaryHover};
		--brand-primary-light:  {brand.css.primaryLight};
		--brand-primary-border: {brand.css.primaryBorder};
		--brand-primary-text:   {brand.css.primaryText};
		--brand-primary-ring:   {brand.css.primaryRing};
	"
>
	<!-- ══ BOTÓN FLOTANTE ═══════════════════════════════════════════════════ -->
	<button
		type="button"
		onclick={abrir}
		class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
		style="background-color: var(--brand-primary);"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M3 13l3-8h9l3 6h3v6h-2m-14 0H3v-4m0 0h13m-13 0l2-4"
			/>
			<circle cx="7.5" cy="17.5" r="1.5" />
			<circle cx="16.5" cy="17.5" r="1.5" />
		</svg>
		Gira de Agentes
	</button>

	<!-- ══ MODAL ════════════════════════════════════════════════════════════ -->
	{#if abierto}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onclick={(e) => {
				if (e.target === e.currentTarget) cerrar();
			}}
		>
			<div class="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
				<div class="flex items-center justify-between border-b border-border px-6 py-4">
					<h2 class="text-base font-semibold text-foreground">Enviar Gira Manual</h2>
					<button
						type="button"
						onclick={cerrar}
						class="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
						aria-label="Cerrar"
					>
						✕
					</button>
				</div>

				<div class="p-6">
					{#if errorCarga}
						<div
							class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
						>
							<p class="font-medium">{errorCarga}</p>
							<button
								class="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
								onclick={cargarAgentes}
							>
								Reintentar
							</button>
						</div>
					{:else if cargando}
						<p class="text-sm text-muted-foreground">Cargando agentes desde SAP…</p>
					{:else if !confirmando}
						<label for="agente" class="mb-1 block text-xs font-medium text-muted-foreground">
							Agente ({agentes.length} con correo asignado)
						</label>
						<select
							id="agente"
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all"
							onchange={elegirAgente}
						>
							<option value="">Seleccioná un agente…</option>
							{#each agentes as a (a.codigo)}
								<option value={a.codigo}>{a.nombre} — {a.correo}</option>
							{/each}
						</select>

						<div class="mt-4">
							<label for="metodo-gira" class="mb-1 block text-xs font-medium text-muted-foreground">
								Método
							</label>
							<select
								id="metodo-gira"
								bind:value={metodo}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all"
							>
								<option value="agente">Enviar al agente</option>
								<option value="revision">Enviar a revisión (oficina)</option>
							</select>
							<p class="mt-1.5 text-xs text-muted-foreground">{ayudaMetodo}</p>

							{#if metodo === 'revision'}
								<div class="mt-3">
									<label
										for="correoRevisionGira"
										class="mb-1 block text-xs font-medium text-muted-foreground"
									>
										Correo destino
									</label>
									<input
										id="correoRevisionGira"
										type="text"
										placeholder="credito@qu.cr"
										bind:value={correoRevision}
										class="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all"
										style="border-color: var(--brand-primary-border); background-color: var(--brand-primary-light);"
									/>
								</div>
							{/if}
						</div>

						<button
							type="button"
							onclick={pedirConfirmacion}
							disabled={!puedeContinuar()}
							class="mt-5 w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
							style="background-color: var(--brand-primary);"
						>
							Continuar
						</button>
					{:else}
						{#if metodo === 'agente'}
							<p class="text-sm text-foreground">
								¿Confirmás el envío de la gira a
								<span class="font-semibold">{seleccionado?.nombre}</span>
								(<span class="font-mono text-xs">{seleccionado?.correo}</span>)?
							</p>
						{:else}
							<p class="text-sm text-foreground">
								¿Confirmás el envío de la gira de
								<span class="font-semibold">{seleccionado?.nombre}</span>
								a revisión (<span class="font-mono text-xs">{correoRevision}</span>)? El agente no
								la recibirá.
							</p>
						{/if}

						<div class="mt-5 flex gap-3">
							<button
								type="button"
								onclick={() => (confirmando = false)}
								disabled={enviando}
								class="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:opacity-50"
							>
								Cancelar
							</button>
							<button
								type="button"
								onclick={enviarGira}
								disabled={enviando}
								class="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
								style="background-color: var(--brand-primary);"
							>
								{enviando ? 'Enviando…' : 'Sí, enviar'}
							</button>
						</div>
					{/if}

					{#if resultado}
						<div
							class="mt-4 rounded-lg px-4 py-3 text-sm {resultado.ok
								? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400'
								: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}"
						>
							{resultado.texto}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
