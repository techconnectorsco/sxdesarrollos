<script lang="ts">
  import { onMount } from 'svelte';


  const data = [
    { label: 'Agent Contact', value: 45, color: '#6366f1' },
    { label: 'Legal Contact', value: 20, color: '#10b981' },
    { label: 'Direct Email', value: 35, color: '#f59e0b' }
  ];

  let canvasRef: HTMLCanvasElement;

  onMount(() => {
    drawDonutChart();
  });


  function drawDonutChart() {
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const centerX = canvasRef.width / 2;
    const centerY = canvasRef.height / 2;
    const outerRadius = 120;
    const innerRadius = 70;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;

    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
  <h2 class="text-xl font-semibold text-gray-900 mb-6">Inquiry Sources</h2>

  <div class="flex flex-col items-center gap-6">
    <canvas bind:this={canvasRef} width="300" height="300"></canvas>

    <div class="space-y-3 w-full">
      {#each data as item}
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full" style="background-color: {item.color}"></div>
            <span class="text-sm font-medium text-gray-700">{item.label}</span>
          </div>
          <span class="text-sm font-bold text-gray-900">{item.value}%</span>
        </div>
      {/each}
    </div>
  </div>
</div>
