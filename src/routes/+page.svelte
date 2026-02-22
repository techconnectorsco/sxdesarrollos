<script lang="ts">
    let { data } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-white">
    <h1 class="text-4xl font-bold text-gray-800">soy home</h1>
    {#if data.session}
        <p class="mt-4 text-gray-600">Sesión activa como: {data.user?.email}</p>
    {/if}
</div>
