<script lang="ts">
	// ✅ Svelte 5: Props con $props()
	let { 
		finca_id = '',
		naturaleza = '',
		area_terreno = 0,
		area_construccion = 0,
		valor_fiscal = 0,
		gravamenes = '',
		ultima_venta_fecha = '',
		ultima_venta_precio = 0
	}: {
		finca_id?: string;
		naturaleza?: string;
		area_terreno?: number;
		area_construccion?: number;
		valor_fiscal?: number;
		gravamenes?: string;
		ultima_venta_fecha?: string;
		ultima_venta_precio?: number;
	} = $props();
</script>

<div class="card-documentacion">
	<h2 class="titulo-seccion">Información del Registro Nacional</h2>
	
	<div class="grid-info">
		<div class="info-item">
			<div class="info-label">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
				Número de Finca
			</div>
			<div class="info-valor">{finca_id || 'N/A'}</div>
		</div>
		
		<div class="info-item">
			<div class="info-label">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
				</svg>
				Naturaleza
			</div>
			<div class="info-valor">{naturaleza || 'N/A'}</div>
		</div>
		
		<div class="info-item">
			<div class="info-label">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
				</svg>
				Área de Terreno
			</div>
			<div class="info-valor">
				{#if area_terreno > 0}
					{area_terreno.toLocaleString('en-US')} m²
				{:else}
					N/A
				{/if}
			</div>
		</div>
		
		<div class="info-item">
			<div class="info-label">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
				</svg>
				Área de Construcción
			</div>
			<div class="info-valor">
				{#if area_construccion > 0}
					{area_construccion.toLocaleString('en-US')} m²
				{:else}
					N/A
				{/if}
			</div>
		</div>
		
		<!-- <div class="info-item">
			<div class="info-label">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Valor Fiscal
			</div>
			<div class="info-valor">
				{#if valor_fiscal > 0}
					${valor_fiscal.toLocaleString('en-US')}
				{:else}
					N/A
				{/if}
			</div>
		</div> -->
		
		<div class="info-item full-width">
			<div class="info-label">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
				</svg>
				Gravámenes
			</div>
			<div class="info-valor">{gravamenes || 'Libre de gravámenes'}</div>
		</div>
		
		{#if ultima_venta_fecha}
			<div class="info-item">
				<div class="info-label">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
					</svg>
					Última Venta
				</div>
				<div class="info-valor">{new Date(ultima_venta_fecha).toLocaleDateString('es-CR')}</div>
			</div>
		{/if}
		
		{#if ultima_venta_precio > 0}
			<div class="info-item">
				<div class="info-label">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
					</svg>
					Precio de Última Venta
				</div>
				<div class="info-valor">${ultima_venta_precio.toLocaleString('en-US')}</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.card-documentacion {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 24px;
	}
	
	.titulo-seccion {
		font-size: 20px;
		font-weight: 700;
		margin: 0 0 24px 0;
		color: #1f2937;
	}
	
	.grid-info {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}
	
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.info-item.full-width {
		grid-column: 1 / -1;
	}
	
	.info-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
	}
	
	.info-label svg {
		width: 18px;
		height: 18px;
		color: #3b82f6;
		flex-shrink: 0;
	}
	
	.info-valor {
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
		padding-left: 26px;
	}
	
	@media (max-width: 768px) {
		.grid-info {
			grid-template-columns: 1fr;
		}
	}
</style>