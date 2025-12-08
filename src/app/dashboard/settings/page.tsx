"use client"
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
          <p className="text-gray-600">Application settings and configuration options.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
