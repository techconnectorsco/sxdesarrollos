<script lang="ts">

  import { onMount } from 'svelte';


  const data = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    pageViews: [130, 120, 118, 240, 150, 140, 190, 140],
    inquiries: [2, 1, 2, 3, 2, 5, 3]
  };

  let canvasRef: HTMLCanvasElement;

  onMount(() => {
    drawChart();
  });


  function drawChart() {
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.width;
    const height = canvasRef.height;
    const padding = 40;


    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + ((height - 2 * padding) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(250 - i * 50), padding - 10, y + 4);
    }

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const xStep = (width - 2 * padding) / (data.pageViews.length - 1);

    data.pageViews.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value / 250) * (height - 2 * padding);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.fill();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.inquiries.forEach((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value / 250) * (height - 2 * padding);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-semibold text-gray-900">Traffic Overview (Last 7 Days)</h2>
    <div class="flex gap-6">
      <div class="flex items-center gap-2">
        <div class="w-4 h-1 bg-indigo-500 rounded"></div>
        <span class="text-sm text-gray-600 font-medium">Page Views</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-1 bg-green-500 rounded"></div>
        <span class="text-sm text-gray-600 font-medium">Inquiries</span>
      </div>
    </div>
  </div>
  <canvas bind:this={canvasRef} width="800" height="300" class="w-full"></canvas>
</div>
