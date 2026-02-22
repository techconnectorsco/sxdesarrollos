<script lang="ts">
    import UploadMultimedia from './upload_multimedia.svelte';
    import UploadDocumentos from './upload_documentos.svelte';
    import InfoProyecto from './info_proyecto.svelte';
    
    // ✅ CAMBIO: Recibimos el objeto completo del padre con binding
    let { datos = $bindable() } = $props();

   // console.log('📦 paso1.svelte - datos recibido:', datos);
   // console.log('📷 paso1.svelte - multimedia:', datos?.multimedia);
    // console.log('📄 paso1.svelte - documentos:', datos?.documentos);
    
    let errores = $state<Record<string, string>>({});
    
    // Mostrar sección de proyectos si el tipo es "proyecto"
    // Usamos $derived para que reaccione a cambios en datos
    let esProyecto = $derived(datos.tipo_transaccion === 'proyecto');
    
    function formatearNumero(num: number): string {
        return num?.toLocaleString('en-US') || '0';
    }
</script>

<div class="paso-contenido">
    <h2>Información Básica</h2>
    <p class="subtitulo">Datos esenciales, multimedia, documentos y contacto de la propiedad</p>
    
    <div class="subseccion">
        <h3>Tipo de Operación y Precio</h3>
        
        <div class="form-grid">
            <div class="form-group full-width">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label>Tipo de Operación*</label>
                <div class="radio-group-horizontal three-columns">
                    <label class="radio-card">
                        <input
                            type="radio"
                            name="tipo_transaccion"
                            value="venta"
                            bind:group={datos.tipo_transaccion}
                        />
                        <div class="radio-content">
                            <span class="radio-icon">🏷️</span>
                            <span class="radio-label">Venta</span>
                            <span class="radio-description">Propiedades en venta</span>
                        </div>
                    </label>
                    <label class="radio-card">
                        <input
                            type="radio"
                            name="tipo_transaccion"
                            value="alquiler"
                            bind:group={datos.tipo_transaccion}
                        />
                        <div class="radio-content">
                            <span class="radio-icon">🔑</span>
                            <span class="radio-label">Alquiler</span>
                            <span class="radio-description">Propiedades en alquiler</span>
                        </div>
                    </label>
                    <label class="radio-card">
                        <input
                            type="radio"
                            name="tipo_transaccion"
                            value="proyecto"
                            bind:group={datos.tipo_transaccion}
                        />
                        <div class="radio-content">
                            <span class="radio-icon">🏗️</span>
                            <span class="radio-label">Proyecto</span>
                            <span class="radio-description">Proyectos constructivos</span>
                        </div>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label for="tipo_propiedad">Tipo de Propiedad*</label>
                <select
                    id="tipo_propiedad"
                    bind:value={datos.tipo_propiedad}
                >
                    <option value="casa">🏠 Casa</option>
                    <option value="apartamento">🏢 Apartamento</option>
                    <option value="condominio">🏘️ Condominio</option>
                    <option value="lote">📐 Lote</option>
                    <option value="comercial">🏪 Local Comercial</option>
                    <option value="finca">🌾 Finca</option>
                    <option value="bodega">📦 Bodega</option>
                    <option value="oficina">💼 Oficina</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="uso">Uso</label>
                <select id="uso" bind:value={datos.uso}>
                    <option value="">Seleccione...</option>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="mixto">Mixto</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="precio">{esProyecto ? 'Precio Desde*' : 'Precio*'}</label>
                <div class="input-group">
                    <select class="currency-select" bind:value={datos.moneda}>
                        <option value="USD">USD $</option>
                        <option value="CRC">CRC ₡</option>
                    </select>
                    <input
                        type="text"
                        id="precio"
                        value={datos.precio ? formatearNumero(datos.precio) : ''}
                        oninput={(e) => {
                            const valor = e.currentTarget.value.replace(/[^0-9]/g, '');
                            datos.precio = parseInt(valor) || 0;
                        }}
                        placeholder="0"
                    />
                </div>
                {#if esProyecto}
                    <small class="hint">Precio inicial del proyecto</small>
                {/if}
            </div>
        </div>
    </div>
    
    {#if esProyecto}
        <div class="subseccion proyecto-highlight">
            <div class="proyecto-header">
                <div>
                    <h3>Información del Proyecto</h3>
                    <p class="seccion-descripcion">Datos específicos del proyecto constructivo</p>
                </div>
                <div class="proyecto-badge">
                    <span>🏗️ Proyecto</span>
                </div>
            </div>
            
            <InfoProyecto
                datosProyecto={{
                    nombre: datos.proyecto_nombre,
                    constructora: datos.proyecto_constructora,
                    estado: datos.proyecto_estado,
                    fecha_entrega: datos.proyecto_fecha_entrega,
                    unidades_totales: datos.proyecto_unidades_totales,
                    unidades_disponibles: datos.proyecto_unidades_disponibles,
                    tipos_unidades: datos.proyecto_tipos_unidades,
                    rango_precios: datos.proyecto_rango_precios,
                    financiamiento: datos.proyecto_financiamiento,
                    avance_porcentaje: datos.proyecto_avance_porcentaje
                }}
                onCambio={(d) => {
                    datos.proyecto_nombre = d.nombre;
                    datos.proyecto_constructora = d.constructora;
                    datos.proyecto_estado = d.estado;
                    datos.proyecto_fecha_entrega = d.fecha_entrega;
                    datos.proyecto_unidades_totales = d.unidades_totales;
                    datos.proyecto_unidades_disponibles = d.unidades_disponibles;
                    datos.proyecto_tipos_unidades = d.tipos_unidades;
                    datos.proyecto_rango_precios = d.rango_precios;
                    datos.proyecto_financiamiento = d.financiamiento;
                    datos.proyecto_avance_porcentaje = d.avance_porcentaje;
                }}
                {errores}
            />
        </div>
    {/if}
    
    <div class="subseccion">
        <h3>Descripción de la Propiedad</h3>
        
        <div class="form-grid">
            <div class="form-group full-width">
                <label for="titulo">Título del Anuncio*</label>
                <input
                    type="text"
                    id="titulo"
                    bind:value={datos.titulo}
                    placeholder={esProyecto ? "Ej: Proyecto Residencial Vista Hermosa - Apartamentos desde $120,000" : "Ej: Hermosa casa en condominio con piscina"}
                    maxlength="100"
                />
                <small>{datos.titulo?.length || 0}/100 caracteres</small>
            </div>
            
            <div class="form-group full-width">
                <label for="descripcion">Descripción Detallada*</label>
                <textarea
                    id="descripcion"
                    bind:value={datos.descripcion}
                    placeholder={esProyecto 
                        ? "Describe el proyecto: concepto arquitectónico, amenidades del complejo, ubicación estratégica, acabados, plan de pagos..."
                        : "Describe tu propiedad: ubicación exacta, características especiales, beneficios del sector, condiciones..."
                    }
                    rows="8"
                    maxlength="2000"
                ></textarea>
                <small>{datos.descripcion?.length || 0}/2000 caracteres</small>
            </div>
        </div>
    </div>
    
    <div class="subseccion">
        <h3>{esProyecto ? 'Fotos y Videos del Proyecto' : 'Fotos y Videos de la Propiedad'}</h3>
        <p class="seccion-descripcion">
            {esProyecto 
                ? 'Sube imágenes del proyecto: renders, planos, avance de obra, amenidades'
                : 'Sube hasta 30 archivos entre fotos y videos para mostrar tu propiedad'
            }
        </p>
       <UploadMultimedia
    archivosIniciales={datos.multimedia?.map(m => ({
        url: m.url,
        tipo: m.tipo_archivo === 'video' ? 'video' : 'imagen',
        orden: m.orden
    })) || []}
    archivoPrincipalIndex={datos.multimedia_principal_index}
    onArchivosChange={(archivos, principal) => {
        datos.multimedia = archivos;
        datos.multimedia_principal_index = principal;
    }}
/>
    </div>
    
    <div class="subseccion">
        <h3>Documentos Legales</h3>
        <p class="seccion-descripcion">
            {esProyecto
                ? 'Sube permisos de construcción, planos aprobados, escrituras, certificaciones'
                : 'Sube documentos como escrituras, planos, permisos o certificaciones (opcional pero recomendado)'
            }
        </p>
        <UploadDocumentos
            documentosIniciales={datos.documentos}
            onDocumentosChange={(docs) => {
                datos.documentos = docs;
            }}
        />
    </div>
    
    <div class="subseccion">
        <h3>Información Legal y Contacto</h3>
        
        <div class="form-grid">
            <div class="form-group">
                <label for="finca_id">Número de Finca {esProyecto ? '(opcional)' : '(obligatorio)'}</label>
                <input
                    type="text"
                    id="finca_id"
                    bind:value={datos.finca_id}
                    placeholder="Ej: 123456"
                />
                {#if esProyecto}
                    <small class="hint">Opcional para proyectos en desarrollo</small>
                {/if}
            </div>
            
            <div class="form-group">
                <label for="contacto_nombre">{esProyecto ? 'Contacto / Empresa*' : 'Nombre de Contacto'}</label>
                <input
                    type="text"
                    id="contacto_nombre"
                    bind:value={datos.contacto_nombre}
                    placeholder={esProyecto ? "Constructora ABC S.A." : "Su nombre"}
                />
            </div>
            
            <div class="form-group">
                <label for="contacto_telefono">Teléfono de Contacto*</label>
                <input
                    type="tel"
                    id="contacto_telefono"
                    bind:value={datos.contacto_telefono}
                    placeholder="+506 8888-8888"
                />
            </div>
            
            <div class="form-group">
                <label for="contacto_email">Email de Contacto*</label>
                <input
                    type="email"
                    id="contacto_email"
                    bind:value={datos.contacto_email}
                    placeholder="correo@ejemplo.com"
                />
            </div>
            
            <div class="form-group full-width">
                <label for="notas_adicionales">Notas Adicionales</label>
                <textarea
                    id="notas_adicionales"
                    bind:value={datos.notas_adicionales}
                    placeholder={esProyecto 
                        ? "Información adicional: promociones, descuentos por pronto pago, facilidades..."
                        : "Información adicional que considere relevante..."
                    }
                    rows="4"
                    maxlength="1000"
                ></textarea>
                <small>{datos.notas_adicionales?.length || 0}/1000 caracteres</small>
            </div>
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
        margin: 0 0 8px 0;
    }
    
    .seccion-descripcion {
        font-size: 13px;
        color: #6b7280;
        margin: 0 0 16px 0;
    }
    
    /* ✅ Estilos para sección de proyecto */
    .proyecto-highlight {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border: 2px solid #3b82f6;
        border-radius: 12px;
        padding: 24px;
    }
    
    .proyecto-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }
    
    .proyecto-badge {
        background: #3b82f6;
        color: white;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
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
    .form-group select,
    .form-group textarea {
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .form-group small {
        font-size: 12px;
        color: #9ca3af;
    }
    
    .hint {
        font-size: 12px;
        color: #6b7280;
        font-style: italic;
    }
    
    /* Radio Cards Horizontales */
    .radio-group-horizontal {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
    
    .radio-group-horizontal.three-columns {
        grid-template-columns: repeat(3, 1fr);
    }
    
    .radio-card {
        position: relative;
        cursor: pointer;
    }
    
    .radio-card input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .radio-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 20px 12px;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        transition: all 0.2s;
        background: white;
    }
    
    .radio-card:has(input:checked) .radio-content {
        border-color: #3b82f6;
        background: #eff6ff;
    }
    
    .radio-icon {
        font-size: 32px;
    }
    
    .radio-label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
    }
    
    .radio-description {
        font-size: 11px;
        color: #6b7280;
        text-align: center;
    }
    
    /* Input Group */
    .input-group {
        display: flex;
        gap: 8px;
    }
    
    .currency-select {
        width: 100px;
        flex-shrink: 0;
    }
    
    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .radio-group-horizontal,
        .radio-group-horizontal.three-columns {
            grid-template-columns: 1fr;
        }
        
        .proyecto-header {
            flex-direction: column;
            gap: 12px;
        }
    }
</style>