<script lang="ts">
    import MainNav from '$lib/components/app/nav/main-nav.svelte';
    import Footer from '$lib/components/app/nav/footer.svelte';
    
    let { data } = $props();
</script>

<div class="flex min-h-screen flex-col bg-slate-50">
	<MainNav session={data.session} user={data.user} perfil={data.perfilNav} />
	
	<main class="flex-1 pt-24 pb-16">
		<!-- Hero Section -->
		<section class="relative px-6 py-20 md:py-32 overflow-hidden">
			<div class="max-w-7xl mx-auto relative z-10">
				<div class="text-center md:text-left md:max-w-3xl">
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
						<span class="relative flex h-2 w-2">
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
						</span>
						Oficina de Transformación Digital
					</div>
					<h1 class="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
						Elevamos la <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Eficiencia Operativa</span>
					</h1>
					<p class="text-xl text-slate-600 mb-10 leading-relaxed">
						En <span class="font-bold text-slate-800">SoporteXperto (SX)</span>, diseñamos y desplegamos ecosistemas de <span class="italic text-indigo-600">RPA y Automatización</span> que liberan el potencial de las organizaciones modernas.
					</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
						<button class="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300">
							Explorar Soluciones
						</button>
						<a href="/dashboard" class="px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-all duration-300 text-center inline-block">
							Ver Dashboard
						</a>

					</div>
				</div>
                
                <!-- Hero Image Integration -->
                <div class="hidden lg:block absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-40 mix-blend-multiply pointer-events-none">
                    <img 
                        src="/hero_automation.png" 
                        alt="AI Automation Concept" 
                        class="w-full h-full object-contain"
                    />
                </div>


			</div>

			<!-- Background Decoration -->
			<div class="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-50 -z-0"></div>
			<div class="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl opacity-50 -z-0"></div>
		</section>

		<!-- Stats Section (Hardcoded for now) -->
		<section class="max-w-7xl mx-auto px-6 py-12">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
					<p class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Procesos Activos</p>
					<h3 class="text-3xl font-bold text-blue-600">24</h3>
					<div class="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
						+12% vs mes anterior
					</div>
				</div>
				<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
					<p class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Horas Ahorradas</p>
					<h3 class="text-3xl font-bold text-slate-900">1,240h</h3>
					<p class="mt-4 text-xs text-slate-400 font-medium">Este periodo operacional</p>
				</div>
				<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
					<p class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Tasa de Éxito</p>
					<h3 class="text-3xl font-bold text-slate-900">99.8%</h3>
					<div class="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
						<div class="bg-blue-600 h-full w-[99.8%]"></div>
					</div>
				</div>
				<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
					<p class="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Clientes SX</p>
					<div class="flex -space-x-3 mt-4">
						{#each Array(4) as _, i}
							<div class="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
								C{i+1}
							</div>
						{/each}
						<div class="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
							+15
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Services / What we do -->
		<section class="max-w-7xl mx-auto px-6 py-20">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Ingeniería en Automatización</h2>
				<p class="text-slate-600 max-w-2xl mx-auto">Soluciones personalizadas para la oficina moderna.</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-10">
				<!-- Service 1 -->
				<div class="group">
					<div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
						<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
					</div>
					<h3 class="text-xl font-bold text-slate-900 mb-3">RPA Avanzado</h3>
					<p class="text-slate-600 leading-relaxed">Bots inteligentes que manejan tareas repetitivas en Windows, Web y Legacy systems con precisión quirúrgica.</p>
				</div>
				<!-- Service 2 -->
				<div class="group">
					<div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
						<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
					</div>
					<h3 class="text-xl font-bold text-slate-900 mb-3">Ecosistemas en la Nube</h3>
					<p class="text-slate-600 leading-relaxed">Microservicios y contenedores Docker diseñados para escalar procesos de datos sin interrupciones.</p>
				</div>
				<!-- Service 3 -->
				<div class="group">
					<div class="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
						<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
					</div>
					<h3 class="text-xl font-bold text-slate-900 mb-3">Auditoría & Seguridad</h3>
					<p class="text-slate-600 leading-relaxed">Garantizamos que cada automatización opere bajo los estándares más estrictos de cumplimiento y seguridad.</p>
				</div>
			</div>
		</section>
	</main>
	
	<Footer />
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.8s ease-out forwards;
	}
</style>
