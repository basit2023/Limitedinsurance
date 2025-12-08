"use client"
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
          <p className="text-gray-600">Performance reports and analytics will be shown here.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
