<script lang="ts">
    import { page } from '$app/state';
    import { uploadMultipleFiles, deleteFileFromStorage } from '$lib/utils/uploadToStorage';
    import { toast } from 'svelte-sonner';

    interface DocumentoUI {
        id: string;
        url: string;
        nombre: string;
        tipo: string;
        tamano: number;
        subiendo?: boolean;
        error?: boolean;
    }

    // Props
    let { 
        documentosIniciales = [], 
        onDocumentosChange 
    }: { 
        documentosIniciales?: any[];
        onDocumentosChange: (documentos: any[]) => void;
    } = $props();

    // Cliente autenticado
    let supabase = page.data.supabase;

    // Estado local
    let documentos = $state<DocumentoUI[]>(
        documentosIniciales.map(d => ({
            ...d,
            id: d.id || crypto.randomUUID()
        }))
    );

    let arrastrando = $state(false);
    let inputFile: HTMLInputElement;

    const MAX_DOCUMENTOS = 10;
    const FORMATOS_PERMITIDOS = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    // ----------------------------
    // DROP & INPUT
    // ----------------------------
    function handleDrop(e: DragEvent) {
        e.preventDefault();
        arrastrando = false;
        procesarYSubir(Array.from(e.dataTransfer?.files || []));
    }

    function handleFileInput(e: Event) {
        const target = e.target as HTMLInputElement;
        procesarYSubir(Array.from(target.files || []));
    }

    // ----------------------------
    // SUBIDA
    // ----------------------------
    async function procesarYSubir(files: File[]) {
        const validos = files.filter(f => FORMATOS_PERMITIDOS.includes(f.type));

        if (documentos.length + validos.length > MAX_DOCUMENTOS) {
            toast.error(`Máximo ${MAX_DOCUMENTOS} documentos permitidos`);
            return;
        }

        const inicioIndex = documentos.length;

        // UI optimista
        const temporales: DocumentoUI[] = validos.map(f => ({
            id: crypto.randomUUID(),
            nombre: f.name,
            tipo: f.type,          // 👈 YA USAMOS "tipo"
            tamano: f.size,
            url: '',
            subiendo: true
        }));

        documentos = [...documentos, ...temporales];

        try {
            const resultados = await uploadMultipleFiles(
                validos,
                'temp_docs',
                'propiedades-documentos',
                supabase
            );

            let resIndex = 0;

            documentos = documentos.map((doc, index) => {
                if (index >= inicioIndex && doc.subiendo && resIndex < resultados.length) {
                    const res = resultados[resIndex++];

                    if (res.error) {
                        toast.error(`Error al subir ${doc.nombre}`);
                        return { ...doc, subiendo: false, error: true };
                    }

                    return {
                        ...doc,
                        url: res.url,
                        subiendo: false
                    };
                }
                return doc;
            });

            notificarPadre();

        } catch (err) {
            console.error(err);
            toast.error('Error general subiendo documentos');
        }
    }

    // ----------------------------
    // ELIMINAR
    // ----------------------------
    async function eliminarDocumento(index: number) {
        const doc = documentos[index];

        documentos = documentos.filter((_, i) => i !== index);
        notificarPadre();

        if (doc.url && !doc.subiendo && !doc.error) {
            await deleteFileFromStorage(doc.url, 'propiedades-documentos', supabase);
        }
    }

    // ----------------------------
    // 🔥 CLAVE: LIMPIAR PARA ZOD
    // ----------------------------
    function notificarPadre() {
        const docsLimpios = documentos
            .filter(d => !d.subiendo && !d.error)
            .map(d => ({
                url: d.url,
                nombre: d.nombre,
                tipo: d.tipo,
                tamano: d.tamano
            }));

        onDocumentosChange(docsLimpios);
    }

    // ----------------------------
    // UTILIDADES
    // ----------------------------
    function formatearTamano(bytes: number): string {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function obtenerIcono(tipo: string): string {
        if (!tipo) return '📎';
        if (tipo === 'application/pdf') return '📄';
        if (tipo.includes('word')) return '📝';
        if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📊';
        return '📎';
    }
</script>


<div class="upload-container">
    <div 
        class="drop-zone"
        class:arrastrando
        ondragover={(e) => { e.preventDefault(); arrastrando = true; }}
        ondragleave={() => arrastrando = false}
        ondrop={handleDrop}
        onclick={() => inputFile.click()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && inputFile.click()}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p class="drop-text">Arrastra documentos aquí o haz clic para seleccionar</p>
        <p class="drop-hint">Máximo {MAX_DOCUMENTOS} documentos • PDF, DOCX, XLSX, TXT</p>
        
        <input
            bind:this={inputFile}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            multiple
            oninput={handleFileInput}
            style="display: none;"
        />
    </div>
    
    {#if documentos.length > 0}
        <div class="documentos-lista">
            {#each documentos as documento, index}
                <div class="documento-card" class:error-card={documento.error}>
                    <div class="documento-info">
                        <span class="documento-icono">{obtenerIcono(documento.type)}</span>
                        <div class="documento-detalles">
                            <p class="documento-nombre" title={documento.nombre}>{documento.nombre || 'Documento'}</p>
                            <p class="documento-meta">
                                {#if documento.type}
                                    <span class="documento-tipo">{EXTENSIONES[documento.type] || 'FILE'}</span>
                                    <span>•</span>
                                {/if}
                                <span>{formatearTamano(documento.tamano || 0)}</span>
                                
                                {#if documento.subiendo}
                                    <span class="estado-subiendo">Subiendo...</span>
                                {/if}
                                {#if documento.error}
                                    <span class="estado-error">Error al subir</span>
                                {/if}
                            </p>
                        </div>
                    </div>
                    
                    {#if !documento.subiendo}
                        <button
                            type="button"
                            class="btn-eliminar"
                            onclick={() => eliminarDocumento(index)}
                            title="Eliminar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    {/if}
                </div>
            {/each}
        </div>
        
        <p class="documentos-count">{documentos.length} de {MAX_DOCUMENTOS} documentos subidos</p>
    {/if}
</div>

<style>
    .upload-container { width: 100%; }
    .drop-zone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; background: #f9fafb; }
    .drop-zone:hover, .drop-zone.arrastrando { border-color: #8b5cf6; background: #f5f3ff; }
    .drop-zone svg { width: 48px; height: 48px; color: #9ca3af; margin: 0 auto 16px; }
    .drop-text { font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 8px 0; }
    .drop-hint { font-size: 14px; color: #6b7280; margin: 0; }
    
    .documentos-lista { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
    
    .documento-card { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; transition: all 0.2s; }
    .documento-card:hover { border-color: #8b5cf6; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1); }
    .documento-card.error-card { border-color: #fca5a5; background: #fef2f2; }

    .documento-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .documento-icono { font-size: 32px; flex-shrink: 0; }
    .documento-detalles { flex: 1; min-width: 0; }
    
    .documento-nombre { font-size: 14px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .documento-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; margin: 0; }
    .documento-tipo { padding: 2px 8px; background: #f3f4f6; border-radius: 4px; font-weight: 600; color: #8b5cf6; }
    
    .estado-subiendo { color: #3b82f6; font-weight: 700; margin-left: 8px; animation: pulse 1.5s infinite; }
    .estado-error { color: #dc2626; font-weight: 700; margin-left: 8px; }
    
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

    .btn-eliminar { width: 32px; height: 32px; border-radius: 6px; border: none; background: #fee2e2; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .btn-eliminar:hover { background: #fecaca; transform: scale(1.1); }
    .btn-eliminar svg { width: 16px; height: 16px; }
    
    .documentos-count { text-align: center; color: #6b7280; font-size: 14px; margin-top: 16px; }
</style>