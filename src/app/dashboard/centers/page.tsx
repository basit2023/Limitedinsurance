"use client"
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

export default function CentersPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Centers Management</h2>
          <p className="text-gray-600">BPO centers management will be implemented here.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
