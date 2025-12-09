'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import MetricCard from '@/components/MetricCard'
import StatusIndicator, { getStatusFromTarget } from '@/components/StatusIndicator'
import PerformanceChart from '@/components/PerformanceChart'
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock,
  Users, RefreshCw, Download, Filter, BarChart3, Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CenterPerformance {
  centerId: string
  centerName: string
  region: string
  salesCount: number
  target: number
  targetPercentage: number
  dqPercentage: number
  dqCount: number
  approvalRate: number
  underwritingCount: number
  transferCount: number
  callbackCount: number
  status: 'green' | 'yellow' | 'red'
  trend: 'up' | 'down' | 'neutral'
  trendPercentage: number
}

interface DashboardData {
  date: string
  overallMetrics: {
    totalSalesVolume: number
    totalUnderwritingVolume: number
    totalTransfers: number
    approvalRate: number
    dqPercentage: number
    callbackRate: number
  }
  centerPerformances: CenterPerformance[]
  hourlyData: Array<{
    hour: number
    sales: number
    transfers: number
  }>
  summary: {
    totalCenters: number
    centersOnTarget: number
    centersAtRisk: number
    avgDQ: number
  }
  trends: {
    salesVsYesterday: number
    approvalVsYesterday: number
    dqVsYesterday: number
  }
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, selectedDate])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      const response = await fetch(`/api/dashboard/overview?date=${selectedDate}`)

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const jsonData = await response.json()
      setData(jsonData)

      if (silent) {
        toast.success('Dashboard refreshed', { duration: 2000 })
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMsg)
      if (!silent) {
        toast.error(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return

    const headers = ['Center', 'Region', 'Sales', 'Target', 'Achievement %', 'DQ %', 'Approval %', 'Status']
    const rows = data.centerPerformances.map(c => [
      c.centerName,
      c.region,
      c.salesCount,
      c.target,
      c.targetPercentage,
      Math.round(c.dqPercentage),
      Math.round(c.approvalRate),
      c.status.toUpperCase()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${selectedDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Report exported successfully')
  }

  // Default empty data structure
  const defaultData: DashboardData = {
    date: selectedDate,
    overallMetrics: {
      totalSalesVolume: 0,
      totalUnderwritingVolume: 0,
      totalTransfers: 0,
      approvalRate: 0,
      dqPercentage: 0,
      callbackRate: 0
    },
    centerPerformances: [],
    hourlyData: Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0, transfers: 0 })),
    summary: {
      totalCenters: 0,
      centersOnTarget: 0,
      centersAtRisk: 0,
      avgDQ: 0
    },
    trends: {
      salesVsYesterday: 0,
      approvalVsYesterday: 0,
      dqVsYesterday: 0
    }
  }

  const displayData = data || defaultData

  const filteredCenters = displayData.centerPerformances.filter(center => {
    const matchesSearch = center.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.region.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* No Data Info Banner */}
      {displayData.centerPerformances.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">No data available yet</h3>
              <p className="text-sm text-blue-700 mt-1">
                To get started: (1) Add centers via SQL or Admin API, (2) Enter sales data at <a href="/dashboard/data-entry" className="underline font-medium">Data Entry</a>, (3) Refresh this page
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time BPO center monitoring • Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={displayData.centerPerformances.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* KPI Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sales Volume"
          value={displayData.overallMetrics.totalSalesVolume}
          subtitle="Pending Approval"
          trend={displayData.trends ? {
            direction: displayData.trends.salesVsYesterday >= 0 ? 'up' : 'down',
            value: `${Math.abs(displayData.trends.salesVsYesterday)}%`,
            label: 'vs yesterday'
          } : undefined}
          status={displayData.overallMetrics.totalSalesVolume > 0 ? 'success' : 'neutral'}
          icon={<CheckCircle className="w-6 h-6" />}
        />

        <MetricCard
          title="Underwriting Volume"
          value={displayData.overallMetrics.totalUnderwritingVolume}
          subtitle="In UW Process"
          status="neutral"
          icon={<Clock className="w-6 h-6" />}
        />

        <MetricCard
          title="Approval Rate"
          value={`${Math.round(displayData.overallMetrics.approvalRate)}%`}
          subtitle="Overall Performance"
          trend={displayData.trends ? {
            direction: displayData.trends.approvalVsYesterday >= 0 ? 'up' : 'down',
            value: `${Math.abs(displayData.trends.approvalVsYesterday)}%`,
            label: 'vs yesterday'
          } : undefined}
          status={displayData.overallMetrics.approvalRate >= 75 ? 'success' : displayData.overallMetrics.approvalRate >= 50 ? 'warning' : 'danger'}
          icon={<TrendingUp className="w-6 h-6" />}
        />

        <MetricCard
          title="DQ Rate"
          value={`${Math.round(displayData.overallMetrics.dqPercentage)}%`}
          subtitle="Quality Issues"
          trend={displayData.trends ? {
            direction: displayData.trends.dqVsYesterday <= 0 ? 'up' : 'down',
            value: `${Math.abs(displayData.trends.dqVsYesterday)}%`,
            label: 'vs yesterday'
          } : undefined}
          status={displayData.overallMetrics.dqPercentage <= 10 ? 'success' : displayData.overallMetrics.dqPercentage <= 15 ? 'warning' : 'danger'}
          icon={<AlertCircle className="w-6 h-6" />}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">On Target</h3>
          </div>
          <p className="text-4xl font-bold">{displayData.summary.centersOnTarget}</p>
          <p className="text-green-100 text-sm mt-1">Centers performing well</p>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">At Risk</h3>
          </div>
          <p className="text-4xl font-bold">{displayData.summary.centersAtRisk}</p>
          <p className="text-red-100 text-sm mt-1">Centers need attention</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Total Centers</h3>
          </div>
          <p className="text-4xl font-bold">{displayData.summary.totalCenters}</p>
          <p className="text-blue-100 text-sm mt-1">Active BPO centers</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Avg DQ Rate</h3>
          </div>
          <p className="text-4xl font-bold">{Math.round(displayData.summary.avgDQ)}%</p>
          <p className="text-purple-100 text-sm mt-1">Across all centers</p>
        </div>
      </div>

      {/* Hourly Performance Chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <PerformanceChart
          title="Hourly Performance Tracking"
          data={displayData.hourlyData.map(h => ({
            time: `${h.hour}:00`,
            Sales: h.sales,
            Transfers: h.transfers
          }))}
          type="bar"
          xKey="time"
          yKeys={[
            { key: 'Sales', label: 'Sales', color: '#3b82f6' },
            { key: 'Transfers', label: 'Transfers', color: '#10b981' }
          ]}
          height={300}
        />
      </div>

      {/* Center Performance Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Center Performance
            </h2>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="green">On Target</option>
                <option value="yellow">At Risk</option>
                <option value="red">Critical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sales / Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">DQ Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Approval</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCenters.map((center) => (
                <tr key={center.centerId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{center.centerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{center.region}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-semibold">{center.salesCount}</span> / {center.target}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${center.targetPercentage >= 100 ? 'bg-green-500' :
                            center.targetPercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${Math.min(center.targetPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{center.targetPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${center.dqPercentage < 10 ? 'text-green-600' :
                      center.dqPercentage < 15 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {Math.round(center.dqPercentage)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">({center.dqCount})</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{Math.round(center.approvalRate)}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusIndicator
                      status={getStatusFromTarget(center.salesCount, center.target)}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {center.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {center.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                      {center.trend === 'neutral' && <Clock className="w-4 h-4 text-gray-600" />}
                      <span className="text-sm text-gray-600">{center.trendPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/dashboard/centers/${center.centerId}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No centers found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
