<script lang="ts">
	import MainNav from '$lib/components/app/nav/main-nav.svelte';
	import Footer from '$lib/components/app/nav/footer.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	let currentCaseIndex = $state(0);
	let visible = $state(false);

	const casosExito = [
		{
			id: 1,
			titulo: 'Automatización de Cuentas por Cobrar',
			descripcion: 'Implementamos un robot RPA que gestiona automáticamente estados de cuenta, notificaciones de pago y seguimiento de deudores.',
			industria: 'Finanzas',
			icon: '💰',
			stats: [
				{ valor: '75%',   label: 'Reducción de tiempo' },
				{ valor: '500+',  label: 'Documentos/mes'      },
				{ valor: '99.8%', label: 'Precisión'           }
			]
		},
		{
			id: 2,
			titulo: 'Procesamiento de Facturación Electrónica',
			descripcion: 'Robot que procesa facturas electrónicas automáticamente, extrae datos clave y los valida contra sistemas contables.',
			industria: 'Contabilidad',
			icon: '🧾',
			stats: [
				{ valor: '2,000+', label: 'Facturas procesadas'  },
				{ valor: '95%',    label: 'Reducción de errores' },
				{ valor: '120h',   label: 'Horas ahorradas'      }
			]
		},
		{
			id: 3,
			titulo: 'Automatización de Reportes y Alertas',
			descripcion: 'Sistema inteligente que genera y envía reportes operativos y alertas en tiempo real sin intervención manual.',
			industria: 'Operaciones',
			icon: '📊',
			stats: [
				{ valor: '3,000+', label: 'Emails mensuales'   },
				{ valor: '200+',   label: 'Reportes generados' },
				{ valor: '24/7',   label: 'Disponibilidad'     }
			]
		}
	];

	const servicios = [
		{
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
			titulo: 'RPA Avanzado',
			desc: 'Bots que automatizan tareas repetitivas en sistemas Windows, web y legacy con precisión milimétrica.'
		},
		{
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>`,
			titulo: 'Nube y Contenedores',
			desc: 'Ecosistemas escalables con Docker y microservicios para procesar datos sin interrupciones.'
		},
		{
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
			titulo: 'Seguridad y Auditoría',
			desc: 'Cumplimiento riguroso de estándares de seguridad y trazabilidad en cada proceso automatizado.'
		},
		{
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
			titulo: 'Analytics en Tiempo Real',
			desc: 'Dashboards que convierten datos crudos en decisiones estratégicas al instante.'
		},
		{
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
			titulo: 'Integración de APIs',
			desc: 'Conectamos sistemas legados con plataformas modernas vía APIs, webhooks y middleware.'
		},
		{
			icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
			titulo: 'Soporte 24/7',
			desc: 'Monitoreo continuo y respuesta inmediata para que tus procesos nunca se detengan.'
		}
	];

	const pasos = [
		{ n: '01', t: 'Diagnóstico',    d: 'Analizamos tus procesos e identificamos los de mayor impacto para automatizar primero.' },
		{ n: '02', t: 'Diseño',         d: 'Creamos el flujo y definimos las reglas de negocio con tu equipo.' },
		{ n: '03', t: 'Implementación', d: 'Desarrollamos, probamos y desplegamos el robot integrado a tus sistemas.' },
		{ n: '04', t: 'Monitoreo 24/7', d: 'Supervisamos con alertas en tiempo real y optimizamos continuamente.' }
	];

	const nextCase = () => (currentCaseIndex = (currentCaseIndex + 1) % casosExito.length);

	onMount(() => {
		setTimeout(() => (visible = true), 80);
		const interval = setInterval(nextCase, 7000);
		return () => clearInterval(interval);
	});
</script>

<!-- Sin bg aquí — hereda del body/html que maneja ModeWatcher -->
<div class="flex min-h-screen flex-col">
	<MainNav session={data.session} user={data.user} perfil={data.perfilNav} />

	<main class="flex-1 pt-[72px]">

		<!-- ================================================
		     HERO
		     ================================================ -->
		<section class="relative min-h-[88vh] flex items-center px-6 py-20 overflow-hidden">

			<div class="hero-grid absolute inset-0 pointer-events-none"></div>

			<!-- Blobs decorativos -->
			<div class="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none
			            bg-blue-100 opacity-80
			            dark:bg-blue-900/25 dark:opacity-40"></div>
			<div class="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none
			            bg-slate-200 opacity-60
			            dark:bg-slate-800/30 dark:opacity-50"></div>

			<div
				class="relative z-10 max-w-2xl transition-all duration-700 ease-out"
				class:opacity-100={visible} class:translate-y-0={visible}
				class:opacity-0={!visible}  class:translate-y-5={!visible}
			>
				<!-- Pill SX -->
				<a
					href="https://soportexperto.com"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full no-underline
					       border border-blue-300 dark:border-blue-800
					       bg-blue-50 dark:bg-blue-950/50
					       hover:border-blue-500 dark:hover:border-blue-600
					       hover:bg-blue-100 dark:hover:bg-blue-900/50
					       transition-colors duration-200"
				>
					<span class="w-1.5 h-1.5 rounded-full bg-blue-700 dark:bg-blue-400 animate-pulse"></span>
					<span class="text-xs text-slate-700 dark:text-slate-400">Una iniciativa de</span>
					<span class="text-xs font-bold uppercase tracking-wide text-blue-800 dark:text-blue-400">SoporteXperto</span>
					<svg class="w-3 h-3 text-blue-700 dark:text-blue-500 opacity-80" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.5 9.5l7-7M3.5 2.5h6v6"/>
					</svg>
				</a>

				<!-- Heading principal -->
				<h1 class="font-serif text-5xl md:text-6xl font-bold leading-[1.07] tracking-tight mb-5
				           text-slate-900 dark:text-white">
					Automatización<br />
					<em class="not-italic text-blue-800 dark:text-blue-400">que genera valor</em>
				</h1>

				<!-- Descripción de la oficina -->
				<div class="mb-9 pl-4 border-l-2 border-blue-600 dark:border-blue-500">
					<p class="text-base leading-relaxed text-slate-800 dark:text-slate-300">
						Somos la
						<strong class="font-semibold text-slate-900 dark:text-slate-100">Oficina de Transformación Digital</strong>
						de SoporteXperto — el equipo especializado en automatizar procesos empresariales para que tu organización
						opere más rápido, con menos errores y mayor rentabilidad.
					</p>
				</div>

				<!-- Botones -->
				<div class="flex flex-wrap gap-3 mb-12">
					<a href="/auth?mode=register"
					   class="inline-flex items-center gap-2 px-6 py-3 rounded-xl no-underline font-semibold text-sm
					          bg-blue-800 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600
					          text-white shadow-md shadow-blue-900/20 dark:shadow-blue-900/40
					          transition-all duration-200 hover:-translate-y-0.5">
						Comienza Ahora
						<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
						</svg>
					</a>
					<a href="#casos"
					   class="inline-flex items-center px-6 py-3 rounded-xl no-underline font-semibold text-sm
					          border border-slate-400 dark:border-slate-600
					          text-slate-800 dark:text-slate-200
					          hover:bg-slate-100 dark:hover:bg-slate-800
					          transition-colors duration-200">
						Ver Casos de Éxito
					</a>
				</div>

				<!-- Stats bar -->
				<div class="inline-flex divide-x divide-slate-300 dark:divide-slate-700 rounded-xl overflow-hidden
				            border border-slate-300 dark:border-slate-700
				            bg-white dark:bg-slate-900 shadow-sm">
					{#each [
						{ v: '24+',   l: 'Procesos activos' },
						{ v: '15+',   l: 'Clientes en CR'   },
						{ v: '12k+',  l: 'Horas ahorradas'  },
						{ v: '99.8%', l: 'Tasa de éxito'    }
					] as s}
						<div class="flex flex-col px-5 py-3.5 gap-1">
							<span class="text-xl font-extrabold leading-none text-blue-800 dark:text-blue-400">{s.v}</span>
							<span class="text-[10px] uppercase tracking-widest font-semibold text-slate-700 dark:text-slate-400">{s.l}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Terminal (siempre dark — es un bloque de código) -->
			<div class="absolute right-[5%] top-1/2 -translate-y-1/2 w-[375px] hidden xl:block z-10 shadow-2xl">
				<div class="rounded-xl overflow-hidden border border-white/10 font-mono text-xs" style="background:#0d1117">
					<div class="flex items-center gap-1.5 px-4 py-3 border-b border-white/8" style="background:#161b22">
						<span class="w-3 h-3 rounded-full" style="background:#ff5f56"></span>
						<span class="w-3 h-3 rounded-full" style="background:#ffbd2e"></span>
						<span class="w-3 h-3 rounded-full" style="background:#27c93f"></span>
						<span class="ml-2 text-[11px]" style="color:rgba(255,255,255,.35)">sx-automation.py</span>
					</div>
					<div class="px-5 py-5 leading-loose text-[12px]">
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">01</span><span style="color:#79c0ff">import</span> <span style="color:#c9d1d9">sx_rpa</span></p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">02</span></p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">03</span><span style="color:#d2a8ff">bot</span> = sx_rpa.<span style="color:#e3b341">Robot</span>(<span style="color:#56d364">"facturacion"</span>)</p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">04</span>bot.<span style="color:#e3b341">configurar</span>(retries=<span style="color:#f0883e">3</span>)</p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">05</span></p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">06</span><span style="color:#79c0ff">for</span> doc <span style="color:#79c0ff">in</span> bot.<span style="color:#e3b341">pendientes</span>():</p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">07</span>    bot.<span style="color:#e3b341">procesar</span>(doc)</p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">08</span>    bot.<span style="color:#e3b341">notificar</span>(doc.cliente)</p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">09</span></p>
						<p><span class="select-none mr-3" style="color:rgba(255,255,255,.2)">10</span><span style="color:#8b949e"># ✅ 2,847 docs procesados hoy</span></p>
					</div>
					<div class="flex items-center gap-2 px-5 py-2.5 border-t text-[11px]"
					     style="background:rgba(39,201,63,.08);border-color:rgba(255,255,255,.06);color:#56d364">
						<span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#27c93f"></span>
						Corriendo · 0 errores · 14:32:07
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================
		     TRUST BAR
		     ================================================ -->
		<div class="border-y border-slate-200 dark:border-slate-800
		            bg-slate-100 dark:bg-slate-900/80
		            px-6 py-5 text-center">
			<p class="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3
			          text-slate-700 dark:text-slate-400">
				Integramos con tus herramientas actuales
			</p>
			<div class="flex flex-wrap justify-center gap-2">
				{#each ['Microsoft 365','Dynamics 365','Power Automate','Azure','SAP','Google Workspace'] as tool}
					<span class="px-4 py-1.5 rounded-full text-xs font-medium
					             border border-slate-300 dark:border-slate-700
					             text-slate-800 dark:text-slate-300
					             bg-white dark:bg-slate-800">
						{tool}
					</span>
				{/each}
			</div>
		</div>

		<!-- ================================================
		     SERVICIOS
		     ================================================ -->
		<section class="py-24 px-6">
			<div class="max-w-6xl mx-auto">

				<div class="text-center mb-14">
					<p class="text-xs font-bold uppercase tracking-[0.14em] mb-3
					          text-blue-800 dark:text-blue-400">
						Lo que ofrecemos
					</p>
					<h2 class="font-serif text-4xl font-bold tracking-tight mb-3
					           text-slate-900 dark:text-white">
						Una suite completa<br />de automatización
					</h2>
					<p class="max-w-lg mx-auto leading-relaxed text-sm
					          text-slate-700 dark:text-slate-400">
						Desde robots RPA hasta pipelines en la nube, cubrimos todo el espectro de la automatización empresarial.
					</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden shadow-sm
				            bg-slate-200 dark:bg-slate-800
				            border border-slate-200 dark:border-slate-800">
					{#each servicios as s, i}
						<div
							class="group relative p-8 cursor-default transition-colors duration-200
							       bg-white dark:bg-slate-900
							       hover:bg-slate-50 dark:hover:bg-slate-800/80"
							style="animation: fadeUp 0.4s ease {i * 55}ms both"
						>
							<!-- Ícono -->
							<div class="w-11 h-11 flex items-center justify-center rounded-lg mb-5 transition-all duration-200
							            border border-slate-200 dark:border-slate-700
							            bg-slate-100 dark:bg-slate-800
							            text-slate-700 dark:text-slate-400
							            group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50
							            group-hover:border-blue-300 dark:group-hover:border-blue-800
							            group-hover:text-blue-800 dark:group-hover:text-blue-400">
								{@html s.icon}
							</div>
							<h3 class="text-sm font-bold mb-2 text-slate-900 dark:text-white">{s.titulo}</h3>
							<p class="text-sm leading-relaxed text-slate-700 dark:text-slate-400">{s.desc}</p>
							<span class="absolute bottom-5 right-5 font-semibold
							             opacity-0 -translate-x-1
							             group-hover:opacity-100 group-hover:translate-x-0
							             transition-all duration-200
							             text-blue-800 dark:text-blue-400">→</span>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ================================================
		     PROCESO
		     ================================================ -->
		<section class="py-24 px-6
		                bg-slate-100 dark:bg-slate-900/60
		                border-y border-slate-200 dark:border-slate-800">
			<div class="max-w-6xl mx-auto">

				<div class="text-center mb-14">
					<p class="text-xs font-bold uppercase tracking-[0.14em] mb-3
					          text-blue-800 dark:text-blue-400">
						¿Cómo funciona?
					</p>
					<h2 class="font-serif text-4xl font-bold tracking-tight
					           text-slate-900 dark:text-white">
						De cero a automatizado<br />en semanas, no meses
					</h2>
				</div>

				<div class="flex flex-wrap justify-center items-start gap-y-10">
					{#each pasos as step, i}
						<div class="flex items-start">
							<div class="text-center w-44 px-3">
								<div class="inline-flex items-center justify-center w-11 h-11 rounded-full mb-4
								            border-2 border-blue-300 dark:border-blue-800
								            bg-blue-50 dark:bg-blue-950/40
								            text-blue-800 dark:text-blue-400 text-xs font-extrabold tracking-wider">
									{step.n}
								</div>
								<h3 class="text-sm font-bold mb-2 text-slate-900 dark:text-white">{step.t}</h3>
								<p class="text-xs leading-relaxed text-slate-700 dark:text-slate-400">{step.d}</p>
							</div>
							{#if i < 3}
								<div class="hidden md:block w-10 h-px mt-[22px] flex-shrink-0
								            bg-gradient-to-r from-blue-400 to-slate-300
								            dark:from-blue-700 dark:to-slate-700 opacity-70"></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ================================================
		     CASOS DE ÉXITO
		     ================================================ -->
		<section id="casos" class="py-24 px-6">
			<div class="max-w-6xl mx-auto">

				<div class="text-center mb-14">
					<p class="text-xs font-bold uppercase tracking-[0.14em] mb-3
					          text-blue-800 dark:text-blue-400">
						Resultados reales
					</p>
					<h2 class="font-serif text-4xl font-bold tracking-tight
					           text-slate-900 dark:text-white">
						Casos de Éxito
					</h2>
				</div>

				<div class="flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-sm
				            border border-slate-200 dark:border-slate-800">

					<!-- Tabs -->
					<div class="md:w-72 flex-shrink-0 divide-y divide-slate-200 dark:divide-slate-800
					            bg-slate-100 dark:bg-slate-900/60">
						{#each casosExito as caso, i}
							<button
								onclick={() => (currentCaseIndex = i)}
								class="w-full flex items-start gap-3 px-5 py-5 text-left transition-colors duration-200
								       border-l-2
								       {i === currentCaseIndex
								         ? 'border-blue-700 dark:border-blue-500 bg-white dark:bg-slate-800/80'
								         : 'border-transparent hover:bg-white dark:hover:bg-slate-800/40'}"
							>
								<span class="text-xl flex-shrink-0 mt-0.5">{caso.icon}</span>
								<div>
									<p class="text-[10px] font-bold uppercase tracking-widest mb-1
									          text-blue-800 dark:text-blue-400">
										{caso.industria}
									</p>
									<p class="text-xs font-semibold leading-snug
									          {i === currentCaseIndex
									            ? 'text-slate-900 dark:text-slate-100'
									            : 'text-slate-800 dark:text-slate-300'}">
										{caso.titulo}
									</p>
								</div>
							</button>
						{/each}
					</div>

					<!-- Panel del caso -->
					<div class="flex-1 p-8 md:p-12 bg-white dark:bg-slate-900">
						{#each casosExito as caso, i}
							{#if i === currentCaseIndex}
								<div class="caso-animate">
									<!-- Badge industria -->
									<span class="inline-block px-3 py-1 rounded-full mb-4 text-[10px] font-bold uppercase tracking-widest
									            border border-blue-300 dark:border-blue-800
									            bg-blue-50 dark:bg-blue-950/40
									            text-blue-800 dark:text-blue-400">
										{caso.industria}
									</span>

									<h3 class="font-serif text-2xl md:text-3xl font-bold tracking-tight mb-3
									           text-slate-900 dark:text-white">
										{caso.titulo}
									</h3>

									<p class="text-sm leading-relaxed mb-8 text-slate-700 dark:text-slate-400">
										{caso.descripcion}
									</p>

									<!-- Métricas -->
									<div class="flex flex-wrap gap-4 mb-8">
										{#each caso.stats as stat}
											<div class="flex-1 min-w-[90px] px-5 py-4 rounded-xl
											            border border-slate-200 dark:border-slate-700
											            bg-slate-50 dark:bg-slate-800/50">
												<p class="text-2xl font-extrabold leading-none mb-1
												          text-blue-800 dark:text-blue-400">
													{stat.valor}
												</p>
												<p class="text-[10px] uppercase tracking-widest font-semibold
												          text-slate-700 dark:text-slate-400">
													{stat.label}
												</p>
											</div>
										{/each}
									</div>

									<a href="/auth?mode=register"
									   class="text-sm font-semibold no-underline transition-colors
									          text-blue-800 dark:text-blue-400
									          hover:text-blue-600 dark:hover:text-blue-300">
										Ver caso completo →
									</a>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Dots mobile -->
				<div class="flex justify-center gap-2 mt-5 md:hidden">
					{#each casosExito as _, i}
						<button
							onclick={() => (currentCaseIndex = i)}
							aria-label="Caso {i + 1}"
							class="h-1.5 rounded-full transition-all duration-200
							       {i === currentCaseIndex
							         ? 'w-6 bg-blue-700 dark:bg-blue-500'
							         : 'w-1.5 bg-slate-400 dark:bg-slate-700'}">
						</button>
					{/each}
				</div>
			</div>
		</section>

		<!-- ================================================
		     CTA FINAL
		     ================================================ -->
		<!-- CAMBIO CLAVE: light mode usa bg-blue-950 (más oscuro) para garantizar
		     contraste con todo el texto blanco interior -->
		<section class="relative py-28 px-6 overflow-hidden text-center
		                bg-blue-950 dark:bg-slate-900
		                border-t border-blue-900 dark:border-slate-800">

			<div class="cta-grid absolute inset-0 opacity-10 pointer-events-none"></div>
			<div class="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-blue-950/60 dark:from-blue-950/20 dark:to-transparent pointer-events-none"></div>
			<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] rounded-full blur-[120px] pointer-events-none
			            bg-blue-700/10 dark:bg-blue-700/10"></div>

			<div class="relative z-10 max-w-2xl mx-auto">

				<!-- Badge -->
				<!-- CAMBIO: border-blue-700/60 en light para ser visible sobre fondo oscuro -->
				<p class="inline-block px-4 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest
				          border border-blue-700/60 dark:border-blue-700/50
				          bg-white/10 dark:bg-blue-900/40
				          text-blue-100 dark:text-blue-200">
					Listo para empezar
				</p>

				<!-- Heading — siempre blanco (fondo oscuro en ambos modos) -->
				<h2 class="font-serif text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5 text-white">
					¿Cuántas horas pierde<br />tu equipo hoy?
				</h2>

				<!-- Subtítulo -->
				<p class="text-base leading-relaxed mb-10 max-w-md mx-auto text-blue-100 dark:text-slate-300">
					Cada día sin automatización es tiempo y dinero que no recuperas.
					Conversemos — diseñamos tu solución en 72 horas.
				</p>

				<!-- CTAs -->
				<div class="flex flex-wrap gap-3 justify-center mb-7">
					<!-- Botón primario: light = blanco sólido con texto oscuro, dark = azul -->
					<a href="/auth?mode=register"
					   class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl no-underline font-bold text-sm
					          bg-white text-blue-950 hover:bg-blue-50
					          dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600
					          shadow-lg shadow-black/25 transition-all duration-200 hover:-translate-y-0.5">
						Solicitar Demo Gratuita
						<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
						</svg>
					</a>
					<!-- Botón secundario: CAMBIO — border-blue-400/50 visible sobre fondo oscuro en light -->
					<a href="mailto:ventas@soportexperto.com"
					   class="inline-flex items-center px-7 py-3.5 rounded-xl no-underline font-semibold text-sm
					          border border-blue-400/50 dark:border-slate-600
					          bg-white/10 dark:bg-slate-800
					          text-white dark:text-slate-200
					          hover:bg-white/20 dark:hover:bg-slate-700
					          transition-colors duration-200">
						ventas@soportexperto.com
					</a>
				</div>

				<!-- Nota footer del CTA -->
				<!-- CAMBIO: text-blue-200/70 en lugar de text-white/60 — más legible -->
				<p class="text-xs tracking-wide mb-5 text-blue-200/70 dark:text-slate-500">
					Sin compromiso · Respuesta en menos de 24h · Implementación desde 2 semanas
				</p>

				<!-- Link SX -->
				<!-- CAMBIO: text-blue-200/80 en lugar de text-white/70 — evita perderse en fondo claro -->
				<a href="https://soportexperto.com" target="_blank" rel="noopener noreferrer"
				   class="text-sm font-medium no-underline transition-colors
				          text-blue-200/80 dark:text-slate-400
				          hover:text-white dark:hover:text-slate-200">
					Conoce más sobre SoporteXperto →
				</a>
			</div>
		</section>

	</main>
	<Footer />
</div>

<style>
	/* Grid hero */
	.hero-grid {
		background-image:
			linear-gradient(rgb(100 116 139 / 0.12) 1px, transparent 1px),
			linear-gradient(90deg, rgb(100 116 139 / 0.12) 1px, transparent 1px);
		background-size: 56px 56px;
		-webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 0%, black 20%, transparent 100%);
		mask-image: radial-gradient(ellipse 90% 90% at 50% 0%, black 20%, transparent 100%);
	}

	/* Grid CTA */
	.cta-grid {
		background-image:
			linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
			linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
		background-size: 48px 48px;
	}

	/* Entrada cards servicios */
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(12px); }
		to   { opacity: 1; transform: translateY(0);    }
	}

	/* Transición de caso activo */
	.caso-animate {
		animation: slideIn 0.28s ease both;
	}
	@keyframes slideIn {
		from { opacity: 0; transform: translateX(8px); }
		to   { opacity: 1; transform: translateX(0);   }
	}

	/* SVGs de servicio */
	div :global(svg) {
		width: 20px;
		height: 20px;
	}
</style>