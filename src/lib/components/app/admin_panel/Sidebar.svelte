<script lang="ts">

  import { page } from '$app/stores';
  import { LayoutDashboard, Mail, BarChart3, Activity, Home, Cpu, Menu } from 'lucide-svelte';


  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/admin-panel' },
    { label: 'Inquiries', icon: Mail, href: '/admin-panel/inquiries' },
    { label: 'Analytics', icon: BarChart3, href: '/admin-panel/analytics' },
    { label: 'System Health', icon: Activity, href: '/admin-panel/system-health' },
    { label: 'Properties', icon: Home, href: '/admin-panel/properties' },
    { label: 'AI Control Panel', icon: Cpu, href: '/admin-panel/ai-control' }
  ];

  $: currentPath = $page.url.pathname;
</script>

<aside class="w-52 bg-gradient-to-b from-indigo-600 to-purple-600 text-white min-h-screen flex flex-col">
  <div class="p-4 flex-1">
    <div class="flex items-center gap-2 mb-8">
      <button class="p-2 hover:bg-white/10 rounded-lg transition-colors">
        <Menu class="w-6 h-6" />
      </button>
      <h1 class="text-xl font-semibold">Admin Dashboard</h1>
    </div>

    <nav class="space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 {currentPath === item.href
            ? 'bg-white/20 shadow-md'
            : 'hover:bg-white/10'}"
        >
          <svelte:component this={item.icon} class="w-5 h-5" />
          <span class="text-sm font-medium">{item.label}</span>
        </a>
      {/each}
    </nav>
  </div>

  <div class="p-4">
    <div class="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
      <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <span class="text-xl">👤</span>
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">Admin</p>
        <p class="text-xs text-white/70">admin@sito.com</p>
      </div>
    </div>
  </div>
</aside>
