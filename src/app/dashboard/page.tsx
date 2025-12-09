'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Users, RefreshCw } from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/overview?date=${selectedDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const jsonData = await response.json()
      setData(jsonData)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const filteredCenters = data?.centerPerformances.filter(center =>
    center.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.region.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-100 text-green-800'
      case 'yellow': return 'bg-yellow-100 text-yellow-800'
      case 'red': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

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
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8">No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Real-time BPO center monitoring</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Sales</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.overallMetrics.totalSalesVolume}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Approval</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Underwriting</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.overallMetrics.totalUnderwritingVolume}</p>
          <p className="text-xs text-gray-500 mt-1">In UW Process</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Approval Rate</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{Math.round(data.overallMetrics.approvalRate)}%</p>
          <p className="text-xs text-gray-500 mt-1">Overall Performance</p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">DQ Rate</h3>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{Math.round(data.overallMetrics.dqPercentage)}%</p>
          <p className="text-xs text-gray-500 mt-1">Quality Issues</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">On Target</h3>
          </div>
          <p className="text-4xl font-bold">{data.summary.centersOnTarget}</p>
          <p className="text-green-100 text-sm mt-1">Centers performing well</p>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">At Risk</h3>
          </div>
          <p className="text-4xl font-bold">{data.summary.centersAtRisk}</p>
          <p className="text-red-100 text-sm mt-1">Centers need attention</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Total Centers</h3>
          </div>
          <p className="text-4xl font-bold">{data.summary.totalCenters}</p>
          <p className="text-blue-100 text-sm mt-1">Active BPO centers</p>
        </div>
      </div>

      {/* Center Performance Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Center Performance</h2>
            <input
              type="text"
              placeholder="Search centers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
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
                <tr key={center.centerId} className="hover:bg-gray-50">
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
                          className={`h-2 rounded-full ${
                            center.targetPercentage >= 100 ? 'bg-green-500' :
                            center.targetPercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(center.targetPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{center.targetPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      center.dqPercentage < 10 ? 'text-green-600' :
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
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(center.status)}`}>
                      {center.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(center.trend)}
                      <span className="text-sm text-gray-600">{center.trendPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/dashboard/centers/${center.centerId}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
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

      {/* Hourly Sales Chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Hourly Performance</h2>
        <div className="flex items-end gap-2 h-64">
          {data.hourlyData.map((hour) => (
            <div key={hour.hour} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col gap-1 items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                  style={{ 
                    height: `${Math.max((hour.sales / Math.max(...data.hourlyData.map(h => h.sales))) * 200, 4)}px`,
                    minHeight: '4px'
                  }}
                  title={`Sales: ${hour.sales}`}
                ></div>
                <div className="text-xs text-gray-600 font-medium">{hour.sales}</div>
              </div>
              <div className="text-xs text-gray-500 mt-2">{hour.hour}:00</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Sales by Hour</span>
          </div>
        </div>
      </div>
    </div>
  )
}

