<script lang="ts">
    import { page } from '$app/state';
    import { uploadMultipleFiles, deleteFileFromStorage } from '$lib/utils/uploadToStorage';
    import { toast } from 'svelte-sonner';
    import { flip } from 'svelte/animate';

    // ============================
    // MODELO INTERNO (UI)
    // ============================
    interface MultimediaUI {
        id: string;
        url: string;
        tipo: 'imagen' | 'video';
        subiendo?: boolean;
        error?: boolean;
    }

    // ============================
    // MODELO DE DOMINIO (ZOD)
    // ============================
    interface MultimediaDomain {
        url: string;
        tipo: 'imagen' | 'video';
        orden: number;
    }

    // ============================
    // PROPS
    // ============================
    let {
        archivosIniciales = [],
        archivoPrincipalIndex = 0,
        onArchivosChange
    }: {
        archivosIniciales?: MultimediaDomain[];
        archivoPrincipalIndex?: number;
        onArchivosChange: (archivos: MultimediaDomain[], principal: number) => void;
    } = $props();

    const supabase = page.data.supabase;

    // ============================
    // ESTADO LOCAL
    // ============================
    let archivos = $state<MultimediaUI[]>(
        archivosIniciales.map((a) => ({
            id: crypto.randomUUID(),
            url: a.url,
            tipo: a.tipo
        }))
    );

    let previews = $state<string[]>([]);
    let tiposArchivo = $state<('imagen' | 'video')[]>([]);
    let arrastrando = $state(false);
    let draggedItemIndex: number | null = null;
    let inputFile: HTMLInputElement;

    const MAX_ARCHIVOS = 30;
    const FORMATOS_IMAGEN = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const FORMATOS_VIDEO = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];

    // ============================
    // PREVIEWS
    // ============================
    $effect(() => {
        archivos.forEach((archivo, index) => {
            if (!previews[index]) {
                previews[index] = archivo.url;
                tiposArchivo[index] = archivo.tipo;
            }
        });
    });

    // ============================
    // INPUT / DROP
    // ============================
    function handleDropFiles(e: DragEvent) {
        e.preventDefault();
        arrastrando = false;
        procesarYSubir(Array.from(e.dataTransfer?.files || []));
    }

    function handleFileInput(e: Event) {
        const target = e.target as HTMLInputElement;
        procesarYSubir(Array.from(target.files || []));
    }

    // ============================
    // SUBIDA
    // ============================
    async function procesarYSubir(files: File[]) {
        const archivosValidos = files.filter(
            (f) => FORMATOS_IMAGEN.includes(f.type) || FORMATOS_VIDEO.includes(f.type)
        );

        if (archivos.length + archivosValidos.length > MAX_ARCHIVOS) {
            toast.error(`Máximo ${MAX_ARCHIVOS} archivos permitidos`);
            return;
        }

        const inicioIndex = archivos.length;

        const temporales: MultimediaUI[] = archivosValidos.map((f) => ({
            id: crypto.randomUUID(),
            url: URL.createObjectURL(f),
            tipo: f.type.startsWith('video') ? 'video' : 'imagen',
            subiendo: true
        }));

        archivos = [...archivos, ...temporales];
        temporales.forEach((t) => {
            previews.push(t.url);
            tiposArchivo.push(t.tipo);
        });

        const resultados = await uploadMultipleFiles(
            archivosValidos,
            'temp_uploads',
            'propiedades-multimedia',
            supabase
        );

        let resIndex = 0;

        archivos = archivos.map((a, i) => {
            if (i >= inicioIndex && a.subiendo) {
                const res = resultados[resIndex++];
                if (!res || res.error) return { ...a, subiendo: false, error: true };
                return { ...a, url: res.url!, subiendo: false };
            }
            return a;
        });

        notificarPadre();
    }

    // ============================
    // ORDEN
    // ============================
    function dragStart(_: DragEvent, index: number) {
        draggedItemIndex = index;
    }

    function dragOver(e: DragEvent, index: number) {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const item = archivos[draggedItemIndex];
        archivos.splice(draggedItemIndex, 1);
        archivos.splice(index, 0, item);

        const p = previews.splice(draggedItemIndex, 1)[0];
        previews.splice(index, 0, p);

        const t = tiposArchivo.splice(draggedItemIndex, 1)[0];
        tiposArchivo.splice(index, 0, t);

        draggedItemIndex = index;
    }

    function dragEnd() {
        draggedItemIndex = null;
        notificarPadre();
    }

    // ============================
    // ELIMINAR
    // ============================
    async function eliminarArchivo(index: number) {
        const archivo = archivos[index];

        archivos = archivos.filter((_, i) => i !== index);
        previews = previews.filter((_, i) => i !== index);
        tiposArchivo = tiposArchivo.filter((_, i) => i !== index);

        notificarPadre();

        if (archivo.url && !archivo.url.startsWith('blob:')) {
            await deleteFileFromStorage(archivo.url, 'propiedades-multimedia', supabase);
        }
    }

    // ============================
    // 🔑 CLAVE: DOMINIO LIMPIO
    // ============================
    function notificarPadre() {
        const dominio: MultimediaDomain[] = archivos
            .filter((a) => !a.subiendo && !a.error)
            .map((a, index) => ({
                url: a.url,
                tipo: a.tipo,
                orden: index
            }));

        onArchivosChange(dominio, 0);
    }
</script>

<div class="upload-container">
    <div 
        class="drop-zone"
        class:arrastrando
        ondragover={(e) => { e.preventDefault(); arrastrando = true; }}
        ondragleave={() => arrastrando = false}
        ondrop={handleDropFiles}
        onclick={() => inputFile.click()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && inputFile.click()}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p class="drop-text">Arrastra fotos o videos aquí o haz clic para seleccionar</p>
        <p class="drop-hint">Máximo {MAX_ARCHIVOS} archivos • JPG, PNG, MP4</p>
        
        <input
            bind:this={inputFile}
            type="file"
            accept="image/*,video/*"
            multiple
            oninput={handleFileInput}
            style="display: none;"
        />
    </div>
    
    {#if archivos.length > 0}
        <p class="instruccion-orden">
            ✨ Arrastra las fotos para cambiar el orden. La <strong>#1</strong> será la portada.
        </p>

        <div class="archivos-grid">
            {#each archivos as archivo, index (archivo.id)}
                <div 
                    class="archivo-card"
                    animate:flip={{duration: 300}}
                    draggable={!archivo.subiendo}
                    ondragstart={(e) => dragStart(e, index)}
                    ondragover={(e) => dragOver(e, index)}
                    ondragend={dragEnd}
                    class:dragging={draggedItemIndex === index}
                >
                    {#if previews[index]}
                        {#if tiposArchivo[index] === 'imagen'}
                            <img src={previews[index]} alt="Preview" draggable="false" />
                        {:else if tiposArchivo[index] === 'video'}
                            <video src={previews[index]} muted loop playsinline></video>
                            <div class="video-badge">VIDEO</div>
                        {/if}
                    {:else}
                        <div class="loading">...</div>
                    {/if}
                    
                    {#if archivo.subiendo}
                        <div class="overlay-loading">
                            <div class="spinner"></div>
                        </div>
                    {/if}

                    {#if archivo.error}
                        <div class="overlay-error">Error</div>
                    {/if}
                    
                    {#if index === 0}
                        <div class="badge-portada">★ PORTADA</div>
                    {/if}
                    
                    {#if !archivo.subiendo}
                        <button 
                            type="button" 
                            class="btn-eliminar-top" 
                            onclick={() => eliminarArchivo(index)} 
                            title="Eliminar"
                        >
                            ✕
                        </button>
                    {/if}
                    
                    <div class="archivo-numero">{index + 1}</div>
                </div>
            {/each}
        </div>
        
        <p class="archivos-count">
            {archivos.length} de {MAX_ARCHIVOS} archivos
        </p>
    {/if}
</div>

<style>
    /* ... TUS ESTILOS IGUALES ... */
    .upload-container { width: 100%; }
    .drop-zone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 30px; text-align: center; cursor: pointer; background: #f9fafb; transition: 0.2s; }
    .drop-zone:hover { border-color: #3b82f6; background: #eff6ff; }
    .drop-zone svg { width: 40px; height: 40px; color: #9ca3af; margin: 0 auto 10px; }
    .drop-text { font-weight: 600; color: #374151; margin: 0; }
    .drop-hint { font-size: 13px; color: #6b7280; margin: 0; }
    
    .instruccion-orden { font-size: 14px; color: #4b5563; margin: 20px 0 10px; text-align: center; background: #fffbeb; padding: 8px; border-radius: 6px; border: 1px solid #fcd34d; }

    .archivos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-top: 10px; }
    
    .archivo-card { 
        position: relative; 
        aspect-ratio: 4/3; 
        border-radius: 10px; 
        overflow: hidden; 
        background: #f3f4f6; 
        border: 2px solid #e5e7eb; 
        cursor: grab;
        touch-action: none;
    }
    .archivo-card:active { cursor: grabbing; }
    .archivo-card.dragging { opacity: 0.5; border-color: #3b82f6; }

    .archivo-card img, .archivo-card video { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    
    .badge-portada { 
        position: absolute; bottom: 8px; left: 8px; 
        background: #10b981; color: white; 
        font-size: 10px; font-weight: 800; 
        padding: 4px 8px; border-radius: 4px; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .video-badge {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.6); color: white; padding: 4px 10px;
        border-radius: 10px; font-size: 11px; font-weight: bold;
    }

    /* Botón Eliminar Mejorado (Siempre visible) */
    .btn-eliminar-top {
        position: absolute; top: 6px; right: 6px;
        width: 24px; height: 24px;
        background: rgba(255, 0, 0, 0.8); color: white;
        border: none; border-radius: 50%;
        font-size: 12px; font-weight: bold;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: 0.2s; z-index: 10;
    }
    .btn-eliminar-top:hover { background: red; transform: scale(1.1); }

    .archivo-numero {
        position: absolute; top: 6px; left: 6px;
        width: 20px; height: 20px;
        background: rgba(0,0,0,0.6); color: white;
        border-radius: 50%; font-size: 10px; font-weight: bold;
        display: flex; align-items: center; justify-content: center;
    }

    .overlay-loading { position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; }
    .spinner { width: 24px; height: 24px; border: 3px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .overlay-error { position: absolute; inset: 0; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
    .archivos-count { text-align: center; color: #6b7280; font-size: 13px; margin-top: 12px; }
</style>