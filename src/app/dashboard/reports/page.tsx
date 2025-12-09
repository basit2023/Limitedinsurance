'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import {
  FileText, Download, Calendar, Filter, TrendingUp,
  BarChart3, PieChart, FileSpreadsheet, Mail, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom'
type ReportTemplate = 'sales' | 'quality' | 'rankings' | 'agent' | 'comprehensive'

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ReportsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function ReportsContent() {
  const [reportType, setReportType] = useState<ReportType>('daily')
  const [template, setTemplate] = useState<ReportTemplate>('comprehensive')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const generateReport = async (format: 'pdf' | 'excel') => {
    try {
      setGenerating(true)
      toast.loading(`Generating ${format.toUpperCase()} report...`, { id: 'generate-report' })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          template,
          startDate,
          endDate,
          centers: selectedCenters,
          format
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template}-report-${startDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Report generated successfully!`, { id: 'generate-report' })
    } catch (err) {
      console.error('Error generating report:', err)
      toast.error('Failed to generate report', { id: 'generate-report' })
    } finally {
      setGenerating(false)
    }
  }

  const scheduleReport = async () => {
    try {
      toast.loading('Scheduling report...', { id: 'schedule-report' })

      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          template,
          recipients: ['manager@example.com'], // This would come from a form
          frequency: reportType,
          format: 'pdf'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to schedule report')
      }

      toast.success('Report scheduled successfully!', { id: 'schedule-report' })
    } catch (err) {
      console.error('Error scheduling report:', err)
      toast.error('Failed to schedule report', { id: 'schedule-report' })
    }
  }

  const reportTemplates = [
    {
      id: 'sales',
      name: 'Sales Performance',
      description: 'Detailed sales metrics, targets, and achievements',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      id: 'quality',
      name: 'Quality & Compliance',
      description: 'DQ rates, corrective actions, and compliance status',
      icon: BarChart3,
      color: 'green'
    },
    {
      id: 'rankings',
      name: 'Center Rankings',
      description: 'Performance-based BPO rankings and comparisons',
      icon: PieChart,
      color: 'purple'
    },
    {
      id: 'agent',
      name: 'Agent Performance',
      description: 'Individual agent metrics and productivity',
      icon: FileText,
      color: 'orange'
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Report',
      description: 'All metrics combined in a single report',
      icon: FileSpreadsheet,
      color: 'indigo'
    }
  ]

  const scheduledReports = [
    {
      id: '1',
      name: 'Daily Sales Summary',
      frequency: 'Daily at 8:00 AM',
      recipients: 3,
      lastSent: '2024-12-09 08:00',
      status: 'active'
    },
    {
      id: '2',
      name: 'Weekly Performance Report',
      frequency: 'Friday at 5:00 PM',
      recipients: 5,
      lastSent: '2024-12-06 17:00',
      status: 'active'
    },
    {
      id: '3',
      name: 'Monthly Comprehensive',
      frequency: 'Last day of month',
      recipients: 8,
      lastSent: '2024-11-30 17:00',
      status: 'active'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">Generate and schedule performance reports</p>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((tmpl) => {
            const Icon = tmpl.icon
            const isSelected = template === tmpl.id
            return (
              <button
                key={tmpl.id}
                onClick={() => setTemplate(tmpl.id as ReportTemplate)}
                className={`
                  p-6 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? `border-${tmpl.color}-500 bg-${tmpl.color}-50`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-${tmpl.color}-100`}>
                    <Icon className={`w-6 h-6 text-${tmpl.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{tmpl.name}</h3>
                    <p className="text-sm text-gray-600">{tmpl.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Date Range */}
          {reportType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </>
          )}

          {reportType !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => generateReport('pdf')}
            disabled={generating}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Generate PDF
          </button>

          <button
            onClick={() => generateReport('excel')}
            disabled={generating}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Generate Excel
          </button>

          <button
            onClick={scheduleReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Clock className="w-5 h-5" />
            Schedule Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Scheduled Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Report Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Last Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{report.frequency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{report.recipients} recipients</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{report.lastSent}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Reports Generated</h3>
          </div>
          <p className="text-4xl font-bold">247</p>
          <p className="text-blue-100 text-sm mt-1">This month</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Scheduled Reports</h3>
          </div>
          <p className="text-4xl font-bold">{scheduledReports.length}</p>
          <p className="text-green-100 text-sm mt-1">Active schedules</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Email Deliveries</h3>
          </div>
          <p className="text-4xl font-bold">1,432</p>
          <p className="text-purple-100 text-sm mt-1">This month</p>
        </div>
      </div>
    </div>
  )
}
