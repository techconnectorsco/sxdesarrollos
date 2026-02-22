<script lang="ts">


  const activities = [
    {
      time: '10:24 AM',
      activity: 'Property Listing',
      details: 'New property added: Casa en Escazú',
      status: 'Completed'
    },
    {
      time: '09:45 AM',
      activity: 'User Inquiry',
      details: 'Contact form submitted for property #12345',
      status: 'Pending'
    },
    {
      time: '09:12 AM',
      activity: 'System Update',
      details: 'Database backup completed successfully',
      status: 'Completed'
    },
    {
      time: '08:30 AM',
      activity: 'Property Update',
      details: 'Price updated for Apartamento en San José',
      status: 'Completed'
    },
    {
      time: '08:15 AM',
      activity: 'User Registration',
      details: 'New agent registered: Juan Pérez',
      status: 'Active'
    }
  ];

  /**
   * Returns the appropriate CSS class for status badges based on status type.
   * @param {string} status - The status string.
   * @returns {string} Tailwind CSS classes for the status badge.
   */
  function getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
</script>

<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h2 class="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>

  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Time
          </th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Activity
          </th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Details
          </th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {#each activities as activity}
          <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td class="py-4 px-4 text-sm text-gray-600">
              {activity.time}
            </td>
            <td class="py-4 px-4 text-sm font-medium text-gray-900">
              {activity.activity}
            </td>
            <td class="py-4 px-4 text-sm text-gray-600">
              {activity.details}
            </td>
            <td class="py-4 px-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold {getStatusClass(activity.status)}">
                {activity.status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
