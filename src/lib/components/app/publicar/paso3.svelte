<script lang="ts">
    // ✅ CAMBIO: Binding directo al padre
    let { datos = $bindable() } = $props();
</script>

<div class="paso-contenido">
    <h2>Detalles de la Propiedad</h2>
    <p class="subtitulo">Información técnica y estructural de la propiedad</p>
    
    <div class="subseccion">
        <h3>Áreas y Medidas</h3>
        
        <div class="form-grid">
            <div class="form-group">
                <label for="area_total_terreno_m2">Área Total del Terreno (m²)*</label>
                <input
                    type="number"
                    id="area_total_terreno_m2"
                    bind:value={datos.area_total_terreno_m2}
                    min="0"
                    step="0.01"
                    placeholder="Ingrese el área en m²"
                />
            </div>
            
            <div class="form-group">
                <label for="area_construccion_m2">Área de Construcción (m²)</label>
                <input
                    type="number"
                    id="area_construccion_m2"
                    bind:value={datos.area_construccion_m2}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                />
            </div>
            
            <div class="form-group">
                <label for="area_util_m2">Área Útil (m²)</label>
                <input
                    type="number"
                    id="area_util_m2"
                    bind:value={datos.area_util_m2}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                />
            </div>
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Espacios y Habitaciones</h3>
        
        <div class="form-grid-3">
            <div class="form-group">
                <label for="dormitorios">Dormitorios*</label>
                <div class="contador">
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.dormitorios = Math.max(0, (datos.dormitorios || 0) - 1)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                    <input
                        type="number"
                        id="dormitorios"
                        bind:value={datos.dormitorios}
                        min="0"
                        readonly
                    />
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.dormitorios = (datos.dormitorios || 0) + 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="banos">Baños Completos*</label>
                <div class="contador">
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.banos = Math.max(0, (datos.banos || 0) - 1)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                    <input
                        type="number"
                        id="banos"
                        bind:value={datos.banos}
                        min="0"
                        readonly
                    />
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.banos = (datos.banos || 0) + 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="medios_banos">Medios Baños</label>
                <div class="contador">
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.medios_banos = Math.max(0, (datos.medios_banos || 0) - 1)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                    <input
                        type="number"
                        id="medios_banos"
                        bind:value={datos.medios_banos}
                        min="0"
                        readonly
                    />
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.medios_banos = (datos.medios_banos || 0) + 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="salas">Salas</label>
                <input
                    type="number"
                    id="salas"
                    bind:value={datos.salas}
                    min="0"
                    placeholder="0"
                />
            </div>
            
            <div class="form-group">
                <label for="comedores">Comedores</label>
                <input
                    type="number"
                    id="comedores"
                    bind:value={datos.comedores}
                    min="0"
                    placeholder="0"
                />
            </div>
            
            <div class="form-group">
                <label for="cocinas">Cocinas</label>
                <input
                    type="number"
                    id="cocinas"
                    bind:value={datos.cocinas}
                    min="0"
                    placeholder="0"
                />
            </div>
            
            <div class="form-group">
                <label for="garajes">Garajes</label>
                <div class="contador">
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.garajes = Math.max(0, (datos.garajes || 0) - 1)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                        </svg>
                    </button>
                    <input
                        type="number"
                        id="garajes"
                        bind:value={datos.garajes}
                        min="0"
                        readonly
                    />
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button 
                        type="button" 
                        class="btn-contador"
                        onclick={() => datos.garajes = (datos.garajes || 0) + 1}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="bodegas">Bodegas</label>
                <input
                    type="number"
                    id="bodegas"
                    bind:value={datos.bodegas}
                    min="0"
                    placeholder="0"
                />
            </div>
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Información de Construcción</h3>
        
        <div class="form-grid">
            <div class="form-group">
                <label for="pisos_total">Número Total de Pisos</label>
                <input
                    type="number"
                    id="pisos_total"
                    bind:value={datos.pisos_total}
                    min="1"
                    placeholder="1"
                />
            </div>
            
            <div class="form-group">
                <label for="piso_ubicacion">Piso donde se Ubica</label>
                <input
                    type="number"
                    id="piso_ubicacion"
                    bind:value={datos.piso_ubicacion}
                    min="0"
                    placeholder="0"
                />
                <small>0 = Planta baja</small>
            </div>
            
            <div class="form-group">
                <label for="ano_construccion">Año de Construcción</label>
                <input
                    type="number"
                    id="ano_construccion"
                    bind:value={datos.ano_construccion}
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder={new Date().getFullYear().toString()}
                />
            </div>
            
            <div class="form-group">
                <label for="ano_remodelacion">Año de Remodelación</label>
                <input
                    type="number"
                    id="ano_remodelacion"
                    bind:value={datos.ano_remodelacion}
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="Opcional"
                />
            </div>
            
            <div class="form-group full-width">
                <label for="estado_construccion">Estado de Construcción</label>
                <select id="estado_construccion" bind:value={datos.estado_construccion}>
                    <option value="">Seleccione...</option>
                    <option value="obra_gris">Obra Gris</option>
                    <option value="obra_negra">Obra Negra</option>
                    <option value="terminado">Terminado</option>
                    <option value="excelente">Excelente Estado</option>
                    <option value="bueno">Buen Estado</option>
                    <option value="regular">Estado Regular</option>
                    <option value="para_remodelar">Para Remodelar</option>
                </select>
            </div>
        </div>
    </div>
</div>

<style>
    .paso-contenido {
    width: 100%;
    overflow-x: hidden; /* ✅ Prevenir overflow horizontal */
}
    
    h2 {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 8px 0;
    }
    
    .subtitulo {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 32px 0;
    }
    
    .subseccion {
        margin-bottom: 40px;
        padding-bottom: 40px;
        border-bottom: 2px solid #f3f4f6;
    }
    
    .subseccion:last-of-type {
        border-bottom: none;
    }
    
    .subseccion h3 {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 20px 0;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }
    
  .form-grid-3 {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* ✅ 2 columnas por defecto */
    gap: 20px;
    width: 100%;
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
    }
    
    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .form-group small {
        font-size: 12px;
        color: #9ca3af;
    }
    
    /* Contador */
    .contador {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .contador input {
        flex: 1;
        text-align: center;
        font-weight: 600;
        font-size: 16px;
    }
    
    .btn-contador {
        width: 36px;
        height: 36px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }
    
    .btn-contador:hover {
        background: #f3f4f6;
        border-color: #3b82f6;
    }
    
    .btn-contador svg {
        width: 16px;
        height: 16px;
        color: #374151;
    }
    
    @media (max-width: 968px) {
    .form-grid-3 {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .form-grid,
    .form-grid-3 {
        grid-template-columns: 1fr;
    }
    
    .contador input {
        font-size: 14px;
    }
    
    .btn-contador {
        width: 32px;
        height: 32px;
    }
}
</style>