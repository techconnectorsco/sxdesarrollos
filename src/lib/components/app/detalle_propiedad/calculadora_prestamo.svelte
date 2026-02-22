<script lang="ts">
	import { calculadoraPrestamoSchema, type CalculadoraFormData, type Banco } from '$lib/schemas';
	import { onMount } from 'svelte';
	
	// Props
	let { precioPropiedad = 0, monedaPropiedad = 'USD' }: { 
		precioPropiedad?: number; 
		monedaPropiedad?: string;
	} = $props();
	
	// State
	let formData = $state<CalculadoraFormData>({
		monto_credito: Math.round(precioPropiedad * 0.8),
		moneda: monedaPropiedad === 'CRC' ? 'CRC' : 'USD',
		tasa_interes: 6.5,
		plazo_anios: 30,
		id_banco: undefined
	});
	
	let bancos = $state<Banco[]>([]);
	let bancoSeleccionado = $state<Banco | null>(null);
	let errores = $state<Record<string, string>>({});
	let pagoMensual = $state(0);
	let mostrarResultado = $state(false);
	let cargandoBancos = $state(true);
	
	// Cargar bancos desde Supabase
	onMount(async () => {
		await cargarBancos();
	});
	
	async function cargarBancos() {
		try {
			// TODO: Reemplazar con llamada real a Supabase
			// const { data, error } = await supabase
			//   .from('bancos')
			//   .select('*')
			//   .eq('activo', true)
			//   .order('orden');
			
			// Datos de ejemplo (eliminar cuando conectes Supabase)
			await new Promise(resolve => setTimeout(resolve, 500));
			
			bancos = [
				{
					id: 1,
					nombre: 'BAC Credomatic',
					logo_url: null,
					tasa_minima_colones: 8.50,
					tasa_maxima_colones: 11.50,
					tasa_minima_dolares: 5.00,
					tasa_maxima_dolares: 7.50,
					plazo_minimo_anios: 5,
					plazo_maximo_anios: 30,
					activo: true,
					orden: 1,
					enlace_solicitud: null
				},
				{
					id: 2,
					nombre: 'Banco Nacional',
					logo_url: null,
					tasa_minima_colones: 9.00,
					tasa_maxima_colones: 12.00,
					tasa_minima_dolares: 5.50,
					tasa_maxima_dolares: 8.00,
					plazo_minimo_anios: 5,
					plazo_maximo_anios: 25,
					activo: true,
					orden: 2,
					enlace_solicitud: null
				},
				{
					id: 3,
					nombre: 'BCR',
					logo_url: null,
					tasa_minima_colones: 8.75,
					tasa_maxima_colones: 11.75,
					tasa_minima_dolares: 5.25,
					tasa_maxima_dolares: 7.75,
					plazo_minimo_anios: 5,
					plazo_maximo_anios: 30,
					activo: true,
					orden: 3,
					enlace_solicitud: null
				}
			];
			
		} catch (err) {
			console.error('Error cargando bancos:', err);
		} finally {
			cargandoBancos = false;
		}
	}
	
	function seleccionarBanco(idBanco: number | null) {
		if (idBanco === null) {
			bancoSeleccionado = null;
			formData.id_banco = undefined;
			// Valores por defecto
			formData.tasa_interes = formData.moneda === 'USD' ? 6.5 : 9.5;
			formData.plazo_anios = 30;
		} else {
			const banco = bancos.find(b => b.id === idBanco);
			if (banco) {
				bancoSeleccionado = banco;
				formData.id_banco = idBanco;
				
				// Aplicar tasa promedio del banco según moneda
				if (formData.moneda === 'USD') {
					formData.tasa_interes = (banco.tasa_minima_dolares + banco.tasa_maxima_dolares) / 2;
				} else {
					formData.tasa_interes = (banco.tasa_minima_colones + banco.tasa_maxima_colones) / 2;
				}
				
				// Ajustar plazo si excede el máximo del banco
				if (formData.plazo_anios > banco.plazo_maximo_anios) {
					formData.plazo_anios = banco.plazo_maximo_anios;
				}
			}
		}
	}
	
	function cambiarMoneda() {
		// Ajustar tasa según moneda
		if (bancoSeleccionado) {
			if (formData.moneda === 'USD') {
				formData.tasa_interes = (bancoSeleccionado.tasa_minima_dolares + bancoSeleccionado.tasa_maxima_dolares) / 2;
			} else {
				formData.tasa_interes = (bancoSeleccionado.tasa_minima_colones + bancoSeleccionado.tasa_maxima_colones) / 2;
			}
		} else {
			formData.tasa_interes = formData.moneda === 'USD' ? 6.5 : 9.5;
		}
	}
	
	function calcular(e: Event) {
		e.preventDefault();
		
		// Limpiar errores
		errores = {};
		
		// Validar con Zod
		const resultado = calculadoraPrestamoSchema.safeParse(formData);
		
		if (!resultado.success) {
			const zodErrors = resultado.error.flatten().fieldErrors;
			errores = Object.fromEntries(
				Object.entries(zodErrors).map(([key, value]) => [key, value?.[0] || ''])
			);
			return;
		}
		
		const { monto_credito, tasa_interes, plazo_anios } = resultado.data;
		
		// Fórmula de pago mensual
		const tasaMensual = tasa_interes / 100 / 12;
		const numeroPagos = plazo_anios * 12;
		
		if (tasaMensual === 0) {
			pagoMensual = monto_credito / numeroPagos;
		} else {
			pagoMensual = monto_credito * 
				(tasaMensual * Math.pow(1 + tasaMensual, numeroPagos)) / 
				(Math.pow(1 + tasaMensual, numeroPagos) - 1);
		}
		
		mostrarResultado = true;
	}
	
	// Actualizar monto cuando cambia el precio
	$effect(() => {
		if (precioPropiedad > 0) {
			formData.monto_credito = Math.round(precioPropiedad * 0.8);
		}
	});
	
	// Formatear número con separadores
	function formatearNumero(num: number): string {
		return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	}
</script>

<div class="card-calculadora">
	<h3 class="titulo">Calculadora de Préstamo</h3>
	
	<form onsubmit={calcular} class="formulario">
		<!-- Selector de Banco -->
		<div class="form-group">
			<label for="banco">Banco (opcional)</label>
			<select
				id="banco"
				onchange={(e) => seleccionarBanco(e.target.value ? parseInt(e.target.value) : null)}
				class="select-banco"
			>
				<option value="">Cálculo manual</option>
				{#if cargandoBancos}
					<option disabled>Cargando bancos...</option>
				{:else}
					{#each bancos as banco}
						<option value={banco.id}>{banco.nombre}</option>
					{/each}
				{/if}
			</select>
			{#if bancoSeleccionado}
				<div class="info-banco">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
					<span>
						Tasa {formData.moneda}: {formData.moneda === 'USD' ? bancoSeleccionado.tasa_minima_dolares : bancoSeleccionado.tasa_minima_colones}% - {formData.moneda === 'USD' ? bancoSeleccionado.tasa_maxima_dolares : bancoSeleccionado.tasa_maxima_colones}%
						| Plazo: {bancoSeleccionado.plazo_minimo_anios}-{bancoSeleccionado.plazo_maximo_anios} años
					</span>
				</div>
			{/if}
		</div>
		
		<!-- Moneda -->
		<div class="form-group">
			<label>Moneda</label>
			<div class="radio-group">
				<label class="radio-option">
					<input
						type="radio"
						name="moneda"
						value="USD"
						checked={formData.moneda === 'USD'}
						onchange={() => { formData.moneda = 'USD'; cambiarMoneda(); }}
					/>
					<span>Dólares (USD)</span>
				</label>
				<label class="radio-option">
					<input
						type="radio"
						name="moneda"
						value="CRC"
						checked={formData.moneda === 'CRC'}
						onchange={() => { formData.moneda = 'CRC'; cambiarMoneda(); }}
					/>
					<span>Colones (₡)</span>
				</label>
			</div>
		</div>
		
		<!-- Monto del Préstamo -->
		<div class="form-group">
			<label for="monto">Monto del Préstamo</label>
			<div class="input-wrapper">
				<span class="currency-symbol">{formData.moneda === 'USD' ? '$' : '₡'}</span>
				<input
					type="text"
					id="monto"
					value={formatearNumero(formData.monto_credito)}
					oninput={(e) => {
						const valor = e.target.value.replace(/[^0-9]/g, '');
						formData.monto_credito = parseInt(valor) || 0;
					}}
					class:error={errores.monto_credito}
					placeholder="100,000"
				/>
			</div>
			{#if errores.monto_credito}
				<span class="error-text">{errores.monto_credito}</span>
			{/if}
		</div>
		
		<!-- Tasa de Interés -->
		<div class="form-group">
			<label for="tasa">Tasa de Interés Anual (%)</label>
			<input
				type="number"
				id="tasa"
				bind:value={formData.tasa_interes}
				class:error={errores.tasa_interes}
				min="0"
				max="30"
				step="0.1"
				disabled={!!bancoSeleccionado}
			/>
			{#if errores.tasa_interes}
				<span class="error-text">{errores.tasa_interes}</span>
			{/if}
		</div>
		
		<!-- Plazo -->
		<div class="form-group">
			<label for="plazo">Plazo (años)</label>
			<input
				type="number"
				id="plazo"
				bind:value={formData.plazo_anios}
				class:error={errores.plazo_anios}
				min={bancoSeleccionado?.plazo_minimo_anios || 1}
				max={bancoSeleccionado?.plazo_maximo_anios || 40}
			/>
			{#if errores.plazo_anios}
				<span class="error-text">{errores.plazo_anios}</span>
			{/if}
		</div>
		
		<button type="submit" class="btn-calcular">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
			</svg>
			Calcular
		</button>
		
		{#if mostrarResultado}
			<div class="resultado">
				<div class="resultado-label">Pago Mensual Estimado</div>
				<div class="resultado-valor">
					{formData.moneda === 'USD' ? '$' : '₡'}{formatearNumero(Math.round(pagoMensual))}
				</div>
				<div class="resultado-detalle">
					<div class="detalle-item">
						<span>Total a pagar:</span>
						<span class="valor">{formData.moneda === 'USD' ? '$' : '₡'}{formatearNumero(Math.round(pagoMensual * formData.plazo_anios * 12))}</span>
					</div>
					<div class="detalle-item">
						<span>Total intereses:</span>
						<span class="valor">{formData.moneda === 'USD' ? '$' : '₡'}{formatearNumero(Math.round((pagoMensual * formData.plazo_anios * 12) - formData.monto_credito))}</span>
					</div>
				</div>
				
				{#if bancoSeleccionado && bancoSeleccionado.enlace_solicitud}
					<a href={bancoSeleccionado.enlace_solicitud} target="_blank" rel="noopener noreferrer" class="btn-solicitar">
						Solicitar con {bancoSeleccionado.nombre}
					</a>
				{/if}
			</div>
		{/if}
	</form>
	
	<div class="disclaimer">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
		</svg>
		<p>Esta es una estimación. Los pagos reales pueden variar según las condiciones del préstamo y aprobación del banco.</p>
	</div>
</div>

<style>
	.card-calculadora {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 24px;
	}
	
	.titulo {
		font-size: 18px;
		font-weight: 700;
		margin: 0 0 20px 0;
		color: #1f2937;
	}
	
	.formulario {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.form-group label {
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}
	
	.select-banco {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.select-banco:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.info-banco {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 10px;
		background: #eff6ff;
		border-radius: 6px;
		font-size: 12px;
		color: #1e40af;
		margin-top: 4px;
	}
	
	.info-banco svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		margin-top: 1px;
	}
	
	.radio-group {
		display: flex;
		gap: 12px;
	}
	
	.radio-option {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.radio-option:has(input:checked) {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.radio-option input[type="radio"] {
		margin: 0;
		cursor: pointer;
	}
	
	.radio-option span {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}
	
	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	.currency-symbol {
		position: absolute;
		left: 12px;
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
		pointer-events: none;
		z-index: 1;
	}
	
	.input-wrapper input {
		padding-left: 32px !important;
	}
	
	.form-group input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		transition: all 0.2s;
	}
	
	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group input:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
	
	.form-group input.error {
		border-color: #ef4444;
	}
	
	.error-text {
		display: block;
		color: #dc2626;
		font-size: 12px;
		margin-top: 4px;
	}
	
	.btn-calcular {
		background: #10b981;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px 16px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	
	.btn-calcular:hover {
		background: #059669;
	}
	
	.btn-calcular svg {
		width: 20px;
		height: 20px;
	}
	
	.resultado {
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		border: 2px solid #3b82f6;
		border-radius: 12px;
		padding: 20px;
		margin-top: 8px;
	}
	
	.resultado-label {
		font-size: 14px;
		font-weight: 600;
		color: #1e40af;
		margin-bottom: 8px;
	}
	
	.resultado-valor {
		font-size: 32px;
		font-weight: 700;
		color: #1e3a8a;
		margin-bottom: 16px;
	}
	
	.resultado-detalle {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 16px;
		border-top: 1px solid #bfdbfe;
	}
	
	.detalle-item {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		color: #1e40af;
	}
	
	.detalle-item .valor {
		font-weight: 600;
	}
	
	.btn-solicitar {
		display: block;
		width: 100%;
		margin-top: 16px;
		padding: 10px 16px;
		background: #3b82f6;
		color: white;
		text-align: center;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
	}
	
	.btn-solicitar:hover {
		background: #2563eb;
	}
	
	.disclaimer {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-top: 16px;
		padding: 12px;
		background: #fef3c7;
		border-radius: 8px;
	}
	
	.disclaimer svg {
		width: 20px;
		height: 20px;
		color: #f59e0b;
		flex-shrink: 0;
		margin-top: 2px;
	}
	
	.disclaimer p {
		font-size: 12px;
		color: #92400e;
		margin: 0;
		line-height: 1.4;
	}
</style>