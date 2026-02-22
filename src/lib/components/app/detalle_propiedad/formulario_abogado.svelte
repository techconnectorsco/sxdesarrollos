<script lang="ts">
    // Props de Svelte 5
    let { idPropiedad }: { idPropiedad: number } = $props();

    // Código antiguo comentado por si queremos volver al formulario
    /*
    import { abogadoSchema, type AbogadoFormData } from '$lib/schemas';
    let formData = $state<AbogadoFormData>({
        nombre: '',
        email: '',
        mensaje: 'Necesito asesoría legal para esta propiedad.',
        id_propiedad: idPropiedad
    });
    let errores = $state<Record<string, string>>({});
    let enviando = $state(false);
    let mensajeEnviado = $state(false);
    let errorGeneral = $state('');
    let mostrarFormulario = $state(false);

    async function enviarFormulario(e: Event) {
        e.preventDefault();
        errores = {};
        errorGeneral = '';
        const resultado = abogadoSchema.safeParse(formData);
        if (!resultado.success) {
            const zodErrors = resultado.error.flatten().fieldErrors;
            errores = Object.fromEntries(
                Object.entries(zodErrors).map(([key, value]) => [key, value?.[0] || ''])
            );
            return;
        }
        enviando = true;
        try {
            console.log('✅ Datos validados:', resultado.data);
            await new Promise(resolve => setTimeout(resolve, 1000));
            mensajeEnviado = true;
            setTimeout(() => {
                formData = {
                    nombre: '',
                    email: '',
                    mensaje: 'Necesito asesoría legal para esta propiedad.',
                    id_propiedad: idPropiedad
                };
                mensajeEnviado = false;
                mostrarFormulario = false;
            }, 3000);
        } catch (err) {
            errorGeneral = 'Error al enviar. Intente nuevamente.';
            console.error('Error:', err);
        } finally {
            enviando = false;
        }
    }
    */
</script>

<div class="card-abogado">
    <h3 class="titulo">Contactar Abogado</h3>

    <div class="info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
        <p>¿Necesita asesoría legal para esta propiedad? Próximamente podrá contactar a nuestros abogados especializados.</p>
    </div>

    <!-- NUEVO BOTÓN ACTIVO -->
    <a href="/asesoria-legal" class="btn-abrir">
        Solicitar Asesoría Legal
    </a>

    <!--
    Código antiguo con formulario comentado
    {#if !mostrarFormulario}
        <div class="info">
            ...
        </div>
        <button class="btn-abrir" onclick={() => mostrarFormulario = true}>
            Solicitar Asesoría Legal
        </button>
    {:else}
        <form onsubmit={enviarFormulario} class="formulario">
            ...
        </form>
    {/if}
    -->
</div>

<style>
    .card-abogado {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 24px;
    }

    .titulo {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 16px 0;
        color: #1f2937;
    }

    .info {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: #f0f9ff;
        border-radius: 8px;
        margin-bottom: 16px;
    }

    .info svg {
        width: 24px;
        height: 24px;
        color: #3b82f6;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .info p {
        font-size: 14px;
        color: #1e40af;
        margin: 0;
        line-height: 1.5;
    }

    .btn-abrir {
        width: 100%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 16px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-abrir:hover {
        background: #2563eb;
    }
</style>
