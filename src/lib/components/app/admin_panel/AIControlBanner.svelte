<script lang="ts">

  import { Cpu, ExternalLink } from 'lucide-svelte';
  import Button from '$lib/components/ui/button/button.svelte';


  export let href: string = '/admin-panel/ai-control';
</script>

<div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300">
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
        <Cpu class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-lg font-bold">AI Control Panel</h3>
        <p class="text-sm text-white/90">Monitor and manage TEO AI system</p>
      </div>
    </div>

    <Button
      variant="secondary"
      class="bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-md"
      onclick={() => window.location.href = href}
    >
      <ExternalLink class="w-4 h-4 mr-2" />
      Open AI Control Panel
    </Button>
  </div>
</div>
