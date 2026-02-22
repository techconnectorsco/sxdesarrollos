<script lang="ts">
	interface DatosProyecto {
		nombre: string;
		constructora: string;
		estado: string;
		fecha_entrega: string;
		unidades_totales: number;
		unidades_disponibles: number;
		tipos_unidades: string;
		rango_precios: string;
		financiamiento: boolean;
		avance_porcentaje: number;
	}
	
	let {
		datosProyecto,
		onCambio,
		errores = {}
	}: {
		datosProyecto: DatosProyecto;
		onCambio: (datos: DatosProyecto) => void;
		errores?: Record<string, string>;
	} = $props();
	
	let datos = $state({ ...datosProyecto });
	
	// Actualizar datos cuando cambian
	$effect(() => {
		onCambio(datos);
	});
</script>

<div class="info-proyecto">
	<div class="form-grid">
		<!-- Nombre del Proyecto -->
		<div class="form-group full-width">
			<label for="proyecto_nombre">Nombre del Proyecto*</label>
			<input
				type="text"
				id="proyecto_nombre"
				bind:value={datos.nombre}
				class:error={errores.proyecto_nombre}
				placeholder="Ej: Residencial Vista Hermosa"
				maxlength="100"
			/>
			{#if errores.proyecto_nombre}
				<span class="error-text">{errores.proyecto_nombre}</span>
			{/if}
		</div>
		
		<!-- Constructora/Desarrollador -->
		<div class="form-group">
			<label for="proyecto_constructora">Constructora / Desarrollador*</label>
			<input
				type="text"
				id="proyecto_constructora"
				bind:value={datos.constructora}
				class:error={errores.proyecto_constructora}
				placeholder="Ej: Constructora ABC S.A."
				maxlength="100"
			/>
			{#if errores.proyecto_constructora}
				<span class="error-text">{errores.proyecto_constructora}</span>
			{/if}
		</div>
		
		<!-- Estado del Proyecto -->
		<div class="form-group">
			<label for="proyecto_estado">Estado del Proyecto*</label>
			<select
				id="proyecto_estado"
				bind:value={datos.estado}
				class:error={errores.proyecto_estado}
			>
				<option value="">Seleccione...</option>
				<option value="en_planos">📐 En Planos</option>
				<option value="en_construccion">🏗️ En Construcción</option>
				<option value="entrega_inmediata">🎉 Entrega Inmediata</option>
			</select>
			{#if errores.proyecto_estado}
				<span class="error-text">{errores.proyecto_estado}</span>
			{/if}
		</div>
		
		<!-- Fecha Estimada de Entrega -->
		<div class="form-group">
			<label for="proyecto_fecha_entrega">Fecha Estimada de Entrega</label>
			<input
				type="month"
				id="proyecto_fecha_entrega"
				bind:value={datos.fecha_entrega}
				class:error={errores.proyecto_fecha_entrega}
			/>
			<small class="hint">Mes y año de entrega</small>
			{#if errores.proyecto_fecha_entrega}
				<span class="error-text">{errores.proyecto_fecha_entrega}</span>
			{/if}
		</div>
		
		<!-- Porcentaje de Avance -->
		<div class="form-group">
			<label for="proyecto_avance">Porcentaje de Avance de Obra</label>
			<div class="input-with-suffix">
				<input
					type="number"
					id="proyecto_avance"
					bind:value={datos.avance_porcentaje}
					min="0"
					max="100"
					step="5"
					placeholder="0"
				/>
				<span class="suffix">%</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {datos.avance_porcentaje}%"></div>
			</div>
			{#if errores.proyecto_avance_porcentaje}
				<span class="error-text">{errores.proyecto_avance_porcentaje}</span>
			{/if}
		</div>
		
		<!-- Unidades Totales -->
		<div class="form-group">
			<label for="proyecto_unidades_totales">Unidades Totales*</label>
			<input
				type="number"
				id="proyecto_unidades_totales"
				bind:value={datos.unidades_totales}
				class:error={errores.proyecto_unidades_totales}
				min="1"
				placeholder="0"
			/>
			{#if errores.proyecto_unidades_totales}
				<span class="error-text">{errores.proyecto_unidades_totales}</span>
			{/if}
		</div>
		
		<!-- Unidades Disponibles -->
		<div class="form-group">
			<label for="proyecto_unidades_disponibles">Unidades Disponibles*</label>
			<input
				type="number"
				id="proyecto_unidades_disponibles"
				bind:value={datos.unidades_disponibles}
				class:error={errores.proyecto_unidades_disponibles}
				min="0"
				placeholder="0"
			/>
			{#if datos.unidades_totales && datos.unidades_disponibles}
				<small class="disponibilidad">
					{Math.round((datos.unidades_disponibles / datos.unidades_totales) * 100)}% disponible
				</small>
			{/if}
			{#if errores.proyecto_unidades_disponibles}
				<span class="error-text">{errores.proyecto_unidades_disponibles}</span>
			{/if}
		</div>
		
		<!-- Tipos de Unidades -->
		<div class="form-group full-width">
			<label for="proyecto_tipos_unidades">Tipos de Unidades*</label>
			<input
				type="text"
				id="proyecto_tipos_unidades"
				bind:value={datos.tipos_unidades}
				class:error={errores.proyecto_tipos_unidades}
				placeholder="Ej: Studios, 1 hab, 2 hab, 3 hab"
				maxlength="200"
			/>
			<small class="hint">Separe con comas los tipos disponibles</small>
			{#if errores.proyecto_tipos_unidades}
				<span class="error-text">{errores.proyecto_tipos_unidades}</span>
			{/if}
		</div>
		
		<!-- Rango de Precios -->
		<div class="form-group">
			<label for="proyecto_rango_precios">Rango de Precios*</label>
			<input
				type="text"
				id="proyecto_rango_precios"
				bind:value={datos.rango_precios}
				class:error={errores.proyecto_rango_precios}
				placeholder="Ej: $120,000 - $350,000"
				maxlength="100"
			/>
			<small class="hint">Rango desde - hasta</small>
			{#if errores.proyecto_rango_precios}
				<span class="error-text">{errores.proyecto_rango_precios}</span>
			{/if}
		</div>
		
		<!-- Financiamiento -->
		<div class="form-group">
			<label class="checkbox-label">
				<input
					type="checkbox"
					bind:checked={datos.financiamiento}
				/>
				<span class="checkbox-text">
					<span class="checkbox-icon">💳</span>
					<span>
						<strong>Financiamiento Disponible</strong>
						<small>Ofrece planes de pago o financiamiento</small>
					</span>
				</span>
			</label>
		</div>
	</div>
</div>

<style>
	.info-proyecto {
		width: 100%;
	}
	
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}
	
	.form-group.full-width {
		grid-column: 1 / -1;
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
	
	.form-group input,
	.form-group select {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		transition: all 0.2s;
		background: white;
	}
	
	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group input.error,
	.form-group select.error {
		border-color: #ef4444;
	}
	
	.form-group small {
		font-size: 12px;
		color: #6b7280;
	}
	
	.hint {
		font-style: italic;
	}
	
	.disponibilidad {
		color: #059669;
		font-weight: 600;
	}
	
	.error-text {
		color: #dc2626;
		font-size: 12px;
		font-weight: 500;
	}
	
	/* Input con sufijo (%) */
	.input-with-suffix {
		position: relative;
		display: flex;
		align-items: center;
	}
	
	.input-with-suffix input {
		flex: 1;
		padding-right: 40px;
	}
	
	.suffix {
		position: absolute;
		right: 12px;
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
		pointer-events: none;
	}
	
	/* Barra de progreso */
	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		overflow: hidden;
		margin-top: 4px;
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
		transition: width 0.3s ease;
		border-radius: 4px;
	}
	
	/* Checkbox personalizado */
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		background: white;
	}
	
	.checkbox-label:hover {
		border-color: #3b82f6;
		background: #eff6ff;
	}
	
	.checkbox-label input[type="checkbox"] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: #3b82f6;
	}
	
	.checkbox-text {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		flex: 1;
	}
	
	.checkbox-icon {
		font-size: 24px;
	}
	
	.checkbox-text span:last-child {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.checkbox-text strong {
		font-size: 14px;
		color: #374151;
	}
	
	.checkbox-text small {
		font-size: 12px;
		color: #6b7280;
	}
	
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>