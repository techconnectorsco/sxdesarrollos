<script lang="ts">

  import { Eye, Mail, Home, Edit, Lightbulb } from 'lucide-svelte';


  export let stats: {
    pageViews: number;
    inquiries: number;
    properties: number;
    foreclosures: number;
    pendingInquiries: number;
  };
</script>

<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
  <!-- Total Page Views -->
  <div class="bg-white border-l-4 border-l-purple-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div class="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center shadow-md">
        <Eye class="w-7 h-7 text-white" />
      </div>
    </div>
    <p class="text-3xl font-bold text-gray-900 mb-1">{stats.pageViews}</p>
    <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Page Views</p>
  </div>

  <!-- Total Inquiries -->
  <div class="bg-white border-l-4 border-l-green-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div class="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-md">
        <Mail class="w-7 h-7 text-white" />
      </div>
    </div>
    <p class="text-3xl font-bold text-gray-900 mb-1">{stats.inquiries}</p>
    <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Inquiries</p>
  </div>

  <!-- Properties Listed -->
  <div class="bg-white border-l-4 border-l-cyan-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div class="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center shadow-md">
        <Home class="w-7 h-7 text-white" />
      </div>
    </div>
    <p class="text-3xl font-bold text-gray-900 mb-1">{stats.properties}</p>
    <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Properties Listed</p>
  </div>

  <!-- Foreclosures -->
  <div class="bg-white border-l-4 border-l-yellow-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div class="w-14 h-14 rounded-full bg-yellow-500 flex items-center justify-center shadow-md">
        <Edit class="w-7 h-7 text-white" />
      </div>
    </div>
    <p class="text-3xl font-bold text-gray-900 mb-1">{stats.foreclosures}</p>
    <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Foreclosures</p>
  </div>

  <!-- Pending Inquiries -->
  <div class="bg-white border-l-4 border-l-orange-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div class="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
        <Lightbulb class="w-7 h-7 text-white" />
      </div>
    </div>
    <p class="text-3xl font-bold text-gray-900 mb-1">{stats.pendingInquiries}</p>
    <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Pending Inquiries</p>
  </div>
</div>
