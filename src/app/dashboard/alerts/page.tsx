"use client"
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alerts & Notifications</h2>
          <p className="text-gray-600">Real-time alerts and notifications will be displayed here.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
