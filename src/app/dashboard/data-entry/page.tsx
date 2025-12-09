'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { Plus, Save, AlertCircle, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Center {
  id: string
  center_name: string
}

export default function DataEntryPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Toaster position="top-right" />
        <DataEntryForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function DataEntryForm() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    centerId: '',
    agent: '',
    insuredName: '',
    clientPhoneNumber: '',
    status: 'Pending Approval',
    callResult: 'Submitted',
    carrier: '',
    productType: 'Life Insurance',
    monthlyPremium: '',
    faceAmount: ''
  })

  useEffect(() => {
    fetchCenters()
  }, [])

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/admin/centers')
      const data = await response.json()
      setCenters(data.centers || [])
      if (data.centers && data.centers.length > 0) {
        setFormData(prev => ({ ...prev, centerId: data.centers[0].id }))
      }
    } catch (error) {
      console.error('Error fetching centers:', error)
      toast.error('Failed to load centers')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/data-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monthlyPremium: parseFloat(formData.monthlyPremium) || 0,
          faceAmount: parseFloat(formData.faceAmount) || 0
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit data')
      }

      toast.success('Sales data submitted successfully!')
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        agent: '',
        insuredName: '',
        clientPhoneNumber: '',
        carrier: '',
        monthlyPremium: '',
        faceAmount: ''
      }))
    } catch (error) {
      console.error('Error submitting data:', error)
      toast.error('Failed to submit sales data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Data Entry</h1>
        <p className="text-gray-600">Enter daily sales and submission data</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Center */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center <span className="text-red-500">*</span>
              </label>
              <select
                name="centerId"
                value={formData.centerId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select Center</option>
                {centers.map(center => (
                  <option key={center.id} value={center.id}>
                    {center.center_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Agent and Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="agent"
                value={formData.agent}
                onChange={handleChange}
                required
                placeholder="Enter agent name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insured Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="insuredName"
                value={formData.insuredName}
                onChange={handleChange}
                required
                placeholder="Enter customer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Phone Number
            </label>
            <input
              type="tel"
              name="clientPhoneNumber"
              value={formData.clientPhoneNumber}
              onChange={handleChange}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Status and Call Result */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="DQ">DQ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Result <span className="text-red-500">*</span>
              </label>
              <select
                name="callResult"
                value={formData.callResult}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="Submitted">Submitted</option>
                <option value="Underwriting">Underwriting</option>
                <option value="Callback">Callback</option>
                <option value="No Sale">No Sale</option>
              </select>
            </div>
          </div>

          {/* Carrier and Product Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carrier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="carrier"
                value={formData.carrier}
                onChange={handleChange}
                required
                placeholder="Enter carrier name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="Life Insurance">Life Insurance</option>
                <option value="Health Insurance">Health Insurance</option>
                <option value="Auto Insurance">Auto Insurance</option>
                <option value="Home Insurance">Home Insurance</option>
              </select>
            </div>
          </div>

          {/* Premium and Face Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Premium ($)
              </label>
              <input
                type="number"
                name="monthlyPremium"
                value={formData.monthlyPremium}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Face Amount ($)
              </label>
              <input
                type="number"
                name="faceAmount"
                value={formData.faceAmount}
                onChange={handleChange}
                step="1"
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Submit Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Data Entry Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Submitted</strong> = Sales that are pending approval (counts toward sales volume)</li>
              <li><strong>Underwriting</strong> = Cases sent to underwriting (counts toward UW volume)</li>
              <li><strong>DQ</strong> status = Quality issues (counts toward DQ percentage)</li>
              <li>All entries are immediately reflected in the dashboard metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
