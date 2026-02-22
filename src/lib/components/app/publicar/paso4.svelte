<script lang="ts">
    // ✅ CAMBIO: Binding directo al padre
    let { datos = $bindable() } = $props();
    
    // Arrays de configuración de amenidades
    const serviciosBasicos = [
        { key: 'agua', label: 'Agua', icon: '💧' },
        { key: 'electricidad', label: 'Electricidad', icon: '⚡' },
        { key: 'internet', label: 'Internet', icon: '📡' },
        { key: 'gas', label: 'Gas', icon: '🔥' },
        { key: 'alcantarillado', label: 'Alcantarillado', icon: '🚰' },
        { key: 'telefono', label: 'Teléfono', icon: '☎️' },
        { key: 'cable', label: 'Cable TV', icon: '📺' }
    ];
    
    const seguridad = [
        { key: 'seguridad_privada', label: 'Seguridad Privada', icon: '👮' },
        { key: 'portero_electronico', label: 'Portero Electrónico', icon: '🔔' },
        { key: 'camaras_seguridad', label: 'Cámaras de Seguridad', icon: '📹' },
        { key: 'alarma', label: 'Alarma', icon: '🚨' }
    ];
    
    const comodidades = [
        { key: 'piscina', label: 'Piscina', icon: '🏊' },
        { key: 'jardin', label: 'Jardín', icon: '🌳' },
        { key: 'terraza', label: 'Terraza', icon: '🏡' },
        { key: 'balcon', label: 'Balcón', icon: '🪟' },
        { key: 'sala_estar', label: 'Sala de Estar', icon: '🛋️' },
        { key: 'cuarto_servicio', label: 'Cuarto de Servicio', icon: '🚪' },
        { key: 'walk_in_closet', label: 'Walk-in Closet', icon: '👔' }
    ];
    
    const espaciosAdicionales = [
        { key: 'estudio', label: 'Estudio', icon: '📚' },
        { key: 'oficina', label: 'Oficina', icon: '💼' },
        { key: 'gimnasio', label: 'Gimnasio', icon: '🏋️' },
        { key: 'area_lavanderia', label: 'Área de Lavandería', icon: '🧺' },
        { key: 'barbacoa', label: 'Barbacoa/Rancho', icon: '🍖' }
    ];
    
    const caracteristicas = [
        { key: 'aire_acondicionado', label: 'Aire Acondicionado', icon: '❄️' },
        { key: 'calefaccion', label: 'Calefacción', icon: '🔥' },
        { key: 'agua_caliente', label: 'Agua Caliente', icon: '🚿' }
    ];
    
    const inclusiones = [
        { key: 'electrodomesticos_incluidos', label: 'Electrodomésticos Incluidos', icon: '🔌' },
        { key: 'muebles_incluidos', label: 'Muebles Incluidos', icon: '🪑' },
        { key: 'amueblado', label: 'Completamente Amueblado', icon: '🏠' }
    ];
    
    const accesibilidad = [
        { key: 'pet_friendly', label: 'Pet Friendly (Mascotas)', icon: '🐕' },
        { key: 'discapacitados', label: 'Accesible para Discapacitados', icon: '♿' }
    ];
    
    const ubicacionVentajas = [
        { key: 'vista_panoramica', label: 'Vista Panorámica', icon: '🌄' },
        { key: 'esquinera', label: 'Propiedad Esquinera', icon: '🔲' },
        { key: 'cerca_transporte_publico', label: 'Cerca de Transporte Público', icon: '🚌' },
        { key: 'cerca_centros_comerciales', label: 'Cerca de Centros Comerciales', icon: '🛒' },
        { key: 'cerca_escuelas', label: 'Cerca de Escuelas', icon: '🏫' },
        { key: 'cerca_hospitales', label: 'Cerca de Hospitales', icon: '🏥' },
        { key: 'cerca_parques', label: 'Cerca de Parques', icon: '🌳' }
    ];
</script>

<div class="paso-contenido">
    <h2>Servicios y Amenidades</h2>
    <p class="subtitulo">Seleccione las características que tiene la propiedad</p>
    
    <div class="subseccion">
        <h3>Servicios Básicos</h3>
        <div class="amenidades-grid">
            {#each serviciosBasicos as servicio}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[servicio.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{servicio.icon}</span>
                        <span class="amenidad-label">{servicio.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Seguridad</h3>
        <div class="amenidades-grid">
            {#each seguridad as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Comodidades</h3>
        <div class="amenidades-grid">
            {#each comodidades as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Espacios Adicionales</h3>
        <div class="amenidades-grid">
            {#each espaciosAdicionales as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Características Climáticas</h3>
        <div class="amenidades-grid">
            {#each caracteristicas as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Inclusiones</h3>
        <div class="amenidades-grid">
            {#each inclusiones as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Accesibilidad</h3>
        <div class="amenidades-grid">
            {#each accesibilidad as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
    
    <div class="subseccion">
        <h3>Ubicación y Ventajas del Sector</h3>
        <div class="amenidades-grid">
            {#each ubicacionVentajas as item}
                <label class="amenidad-card">
                    <input 
                        type="checkbox" 
                        bind:checked={datos[item.key]}
                    />
                    <div class="amenidad-content">
                        <span class="amenidad-icon">{item.icon}</span>
                        <span class="amenidad-label">{item.label}</span>
                    </div>
                </label>
            {/each}
        </div>
    </div>
</div>

<style>
    .paso-contenido {
        width: 100%;
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
    
    .amenidades-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
    }
    
    .amenidad-card {
        position: relative;
        cursor: pointer;
    }
    
    .amenidad-card input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .amenidad-content {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        transition: all 0.2s;
        background: white;
    }
    
    .amenidad-card:has(input:checked) .amenidad-content {
        border-color: #3b82f6;
        background: #eff6ff;
    }
    
    .amenidad-icon {
        font-size: 20px;
        flex-shrink: 0;
    }
    
    .amenidad-label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
    }
    
    @media (max-width: 768px) {
        .amenidades-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }
    }
    
    @media (max-width: 480px) {
        .amenidades-grid {
            grid-template-columns: 1fr;
        }
    }
</style>