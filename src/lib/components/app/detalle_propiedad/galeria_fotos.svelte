<script lang="ts">
	import { onMount } from 'svelte';
	
	let { 
		imagenes = [], 
		titulo = '' 
	}: { 
		imagenes?: (string | { url: string })[];
		titulo?: string;
	} = $props();
	
	// Normalizar imágenes
	const imagenesNormalizadas = $derived(
		imagenes.map(img => typeof img === 'string' ? img : img.url)
	);
	
	// ✅ Placeholder si no hay imágenes
	const PLACEHOLDER = 'https://placehold.co/800x600/E5E7EB/A3A3A3?text=Sin+Imagen+Disponible&font=montserrat'; 
	const imagenesFinales = $derived(
		imagenesNormalizadas.length > 0 
			? imagenesNormalizadas 
			: [PLACEHOLDER]
	);
	
	let indiceActual = $state(0);
	let mostrarModal = $state(false)
	
	function siguienteFoto() {
		indiceActual = (indiceActual + 1) % imagenesNormalizadas.length;
	}
	
	function anteriorFoto() {
		indiceActual = (indiceActual - 1 + imagenesNormalizadas.length) % imagenesNormalizadas.length;
	}
	
	function irAFoto(indice: number) {
		indiceActual = indice;
	}
	
	function abrirModal() {
		mostrarModal = true;
		document.body.style.overflow = 'hidden';
	}
	
	function cerrarModal() {
		mostrarModal = false;
		document.body.style.overflow = 'auto';
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (!mostrarModal) return;
		
		if (e.key === 'ArrowLeft') anteriorFoto();
		if (e.key === 'ArrowRight') siguienteFoto();
		if (e.key === 'Escape') cerrarModal();
	}
	
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="galeria-container">
	<!-- Foto principal -->
	<div class="foto-principal">
		<img src={imagenesNormalizadas[indiceActual]} alt={`${titulo} - Foto ${indiceActual + 1}`} />
		
		<!-- Controles de navegación -->
		{#if imagenesNormalizadas.length > 1}
			<button class="nav-btn prev" onclick={anteriorFoto} aria-label="Foto anterior">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
			</button>
			
			<button class="nav-btn next" onclick={siguienteFoto} aria-label="Foto siguiente">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
			</button>
		{/if}
		
		<!-- Botón ver todas -->
		<button class="btn-ver-todas" onclick={abrirModal}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
			</svg>
			Ver todas las fotos
		</button>
		
		<!-- Contador -->
		{#if imagenesNormalizadas.length > 1}
			<div class="contador">
				{indiceActual + 1} / {imagenesNormalizadas.length}
			</div>
		{/if}
	</div>
	
	<!-- Miniaturas -->
	{#if imagenesNormalizadas.length > 1}
		<div class="miniaturas">
			{#each imagenesNormalizadas as imagen, index}
				<button
					class="miniatura"
					class:activa={index === indiceActual}
					onclick={() => irAFoto(index)}
				>
					<img src={imagen} alt={`Miniatura ${index + 1}`} />
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if mostrarModal}
    <div 
        class="modal-overlay" 
        role="button" 
        tabindex="0" 
        onclick={(e) => {
            if (e.target === e.currentTarget) {
                cerrarModal();
            }
        }}
        onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target === e.currentTarget) cerrarModal();
            }
        }}
        aria-label="Cerrar galería"
    >
        <div class="modal-content">
            <button class="modal-close" onclick={cerrarModal} aria-label="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <div class="modal-imagen">
                <img src={imagenesNormalizadas[indiceActual]} alt={`${titulo} - Foto ${indiceActual + 1}`} />
            </div>
            
            {#if imagenesNormalizadas.length > 1}
                <button class="modal-nav prev" onclick={anteriorFoto} aria-label="Foto anterior">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                
                <button class="modal-nav next" onclick={siguienteFoto} aria-label="Foto siguiente">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
                
                <div class="modal-contador">
                    {indiceActual + 1} / {imagenesNormalizadas.length}
                </div>
            {/if}
            
            {#if imagenesNormalizadas.length > 1}
                <div class="modal-miniaturas">
                    {#each imagenesNormalizadas as imagen, index}
                        <button
                            class="modal-miniatura"
                            class:activa={index === indiceActual}
                            onclick={() => irAFoto(index)} 
                            aria-label={`Ver foto ${index + 1}`}
                        >
                            <img src={imagen} alt={`Miniatura ${index + 1}`} />
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
	.galeria-container {
		width: 100%;
		margin-bottom: 24px;
	}
	
	/* Foto principal */
	.foto-principal {
		position: relative;
		width: 100%;
		height: 500px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	.foto-principal img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	/* Botones de navegación */
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 2;
	}
	
	.nav-btn:hover {
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
	
	.nav-btn svg {
		width: 20px;
		height: 20px;
		color: #1f2937;
	}
	
	.nav-btn.prev {
		left: 16px;
	}
	
	.nav-btn.next {
		right: 16px;
	}
	
	/* Botón ver todas */
	.btn-ver-todas {
		position: absolute;
		bottom: 20px;
		right: 20px;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 10px 16px;
		font-size: 14px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 2;
	}
	
	.btn-ver-todas:hover {
		background: #f9fafb;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.btn-ver-todas svg {
		width: 18px;
		height: 18px;
	}
	
	/* Contador */
	.contador {
		position: absolute;
		bottom: 20px;
		left: 20px;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		z-index: 2;
	}
	
	/* Miniaturas */
	.miniaturas {
		display: flex;
		gap: 8px;
		margin-top: 12px;
		overflow-x: auto;
		padding: 4px;
		scrollbar-width: thin;
		scrollbar-color: #d1d5db #f3f4f6;
	}
	
	.miniaturas::-webkit-scrollbar {
		height: 6px;
	}
	
	.miniaturas::-webkit-scrollbar-track {
		background: #f3f4f6;
		border-radius: 3px;
	}
	
	.miniaturas::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}
	
	.miniatura {
		width: 100px;
		height: 75px;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		opacity: 0.6;
		transition: all 0.2s ease;
		flex-shrink: 0;
		border: 2px solid transparent;
		padding: 0;
		background: none;
	}
	
	.miniatura:hover {
		opacity: 0.9;
	}
	
	.miniatura.activa {
		opacity: 1;
		border-color: #3b82f6;
	}
	
	.miniatura img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.95);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.modal-content {
		position: relative;
		width: 90%;
		height: 90%;
		display: flex;
		flex-direction: column;
	}
	
	.modal-close {
		position: absolute;
		top: 20px;
		right: 20px;
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 10;
		transition: all 0.2s ease;
	}
	
	.modal-close:hover {
		background: white;
	}
	
	.modal-close svg {
		width: 20px;
		height: 20px;
		color: #1f2937;
	}
	
	.modal-imagen {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16px;
	}
	
	.modal-imagen img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	
	.modal-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.modal-nav:hover {
		background: white;
	}
	
	.modal-nav svg {
		width: 24px;
		height: 24px;
		color: #1f2937;
	}
	
	.modal-nav.prev {
		left: 20px;
	}
	
	.modal-nav.next {
		right: 20px;
	}
	
	.modal-contador {
		position: absolute;
		top: 30px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
	}
	
	.modal-miniaturas {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 8px;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		scrollbar-width: thin;
		scrollbar-color: #9ca3af #374151;
	}
	
	.modal-miniaturas::-webkit-scrollbar {
		height: 6px;
	}
	
	.modal-miniaturas::-webkit-scrollbar-track {
		background: #374151;
		border-radius: 3px;
	}
	
	.modal-miniaturas::-webkit-scrollbar-thumb {
		background: #9ca3af;
		border-radius: 3px;
	}
	
	.modal-miniatura {
		width: 80px;
		height: 60px;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		opacity: 0.5;
		transition: all 0.2s ease;
		flex-shrink: 0;
		border: 2px solid transparent;
		padding: 0;
		background: none;
	}
	
	.modal-miniatura:hover {
		opacity: 0.8;
	}
	
	.modal-miniatura.activa {
		opacity: 1;
		border-color: #3b82f6;
	}
	
	.modal-miniatura img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.foto-principal {
			height: 350px;
		}
		
		.miniatura {
			width: 80px;
			height: 60px;
		}
		
		.btn-ver-todas {
			padding: 8px 12px;
			font-size: 13px;
		}
		
		.modal-content {
			width: 95%;
			height: 95%;
		}
	}
</style>