<script lang="ts">

  import StatsCards from './StatsCards.svelte';
  import TrafficChart from './TrafficChart.svelte';
  import InquirySourcesChart from './InquirySourcesChart.svelte';
  import AIControlBanner from './AIControlBanner.svelte';
  import RecentActivity from './RecentActivity.svelte';
  import { BarChart3 } from 'lucide-svelte';


  const dashboardStats = {
    pageViews: 1180,
    inquiries: 3,
    properties: 122429,
    foreclosures: 492,
    pendingInquiries: 1
  };


  const now = new Date();
  const timestamp = now.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
</script>

<div class="w-full space-y-8 p-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <BarChart3 class="w-8 h-8 text-gray-700" />
      <h1 class="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
    </div>
    <p class="text-sm text-gray-500">Last updated: {timestamp}</p>
  </div>

  <!-- Stats Cards -->
  <StatsCards stats={dashboardStats} />

  <!-- AI Control Banner -->
  <AIControlBanner />

  <!-- Charts Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <TrafficChart />
    </div>
    <div>
      <InquirySourcesChart />
    </div>
  </div>

  <!-- Recent Activity Section -->
  <RecentActivity />
</div>
