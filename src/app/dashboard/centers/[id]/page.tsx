'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import MetricCard from '@/components/MetricCard'
import PerformanceChart from '@/components/PerformanceChart'
import StatusIndicator from '@/components/StatusIndicator'
import {
    ArrowLeft, TrendingUp, TrendingDown, Users, Target,
    AlertTriangle, CheckCircle, Download, RefreshCw, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CenterDetails {
    id: string
    centerName: string
    location: string
    region: string
    manager: string
    dailyTarget: number
    status: boolean
    currentPerformance: {
        salesCount: number
        targetPercentage: number
        dqRate: number
        approvalRate: number
        underwritingCount: number
        transferCount: number
        callbackCount: number
    }
    historicalData: Array<{
        date: string
        sales: number
        transfers: number
        dqCount: number
        approvalRate: number
    }>
    agentPerformance: Array<{
        agentName: string
        salesCount: number
        dqCount: number
        approvalRate: number
        avgCallDuration: number
    }>
    recentAlerts: Array<{
        id: string
        type: string
        message: string
        priority: string
        timestamp: string
    }>
    qualityMetrics: {
        totalDQ: number
        highSeverity: number
        topIssues: Array<{ category: string; count: number }>
    }
}

export default function CenterDetailPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <CenterDetailContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function CenterDetailContent() {
    const params = useParams()
    const router = useRouter()
    const centerId = params.id as string

    const [data, setData] = useState<CenterDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)

    useEffect(() => {
        if (centerId) {
            fetchCenterDetails()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centerId, dateRange])

    const fetchCenterDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/dashboard/center/${centerId}?range=${dateRange}`)

            if (!response.ok) {
                throw new Error('Failed to fetch center details')
            }

            const jsonData = await response.json()
            setData(jsonData)
        } catch (err) {
            console.error('Error fetching center details:', err)
            toast.error('Failed to load center details')
        } finally {
            setLoading(false)
        }
    }

    const exportCenterReport = () => {
        if (!data) return

        toast.success('Generating center report...')
        // Implementation for PDF export would go here
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                    <p className="mt-4 text-gray-600">Loading center details...</p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Center not found</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{data.centerName}</h1>
                        <p className="text-gray-600 mt-1">{data.location} • {data.region} • Manager: {data.manager}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(Number(e.target.value) as 7 | 14 | 30)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                    </select>
                    <button
                        onClick={fetchCenterDetails}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={exportCenterReport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Current Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Sales Count"
                    value={data.currentPerformance?.salesCount || 0}
                    subtitle={`Target: ${data.dailyTarget}`}
                    trend={data.currentPerformance ? {
                        direction: data.currentPerformance.targetPercentage >= 100 ? 'up' : 'down',
                        value: `${data.currentPerformance.targetPercentage}%`,
                        label: 'of target'
                    } : undefined}
                    status={
                        (data.currentPerformance?.targetPercentage || 0) >= 80 ? 'success' :
                            (data.currentPerformance?.targetPercentage || 0) >= 50 ? 'warning' : 'danger'
                    }
                    icon={<Target className="w-6 h-6" />}
                />

                <MetricCard
                    title="Approval Rate"
                    value={`${Math.round(data.currentPerformance?.approvalRate || 0)}%`}
                    subtitle="Pending Approval"
                    status={
                        (data.currentPerformance?.approvalRate || 0) >= 75 ? 'success' :
                            (data.currentPerformance?.approvalRate || 0) >= 50 ? 'warning' : 'danger'
                    }
                    icon={<CheckCircle className="w-6 h-6" />}
                />

                <MetricCard
                    title="DQ Rate"
                    value={`${(data.currentPerformance?.dqRate || 0).toFixed(1)}%`}
                    subtitle="Quality Issues"
                    status={
                        (data.currentPerformance?.dqRate || 0) <= 10 ? 'success' :
                            (data.currentPerformance?.dqRate || 0) <= 15 ? 'warning' : 'danger'
                    }
                    icon={<AlertTriangle className="w-6 h-6" />}
                />

                <MetricCard
                    title="Total Transfers"
                    value={data.currentPerformance?.transferCount || 0}
                    subtitle={`${data.currentPerformance?.callbackCount || 0} callbacks`}
                    status="neutral"
                    icon={<Users className="w-6 h-6" />}
                />
            </div>

            {/* Performance Trends */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <PerformanceChart
                    title={`Performance Trends (Last ${dateRange} days)`}
                    data={(data.historicalData || []).map(d => ({
                        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        Sales: d.sales,
                        Transfers: d.transfers,
                        'DQ Count': d.dqCount,
                        'Approval %': d.approvalRate
                    }))}
                    type="line"
                    xKey="date"
                    yKeys={[
                        { key: 'Sales', label: 'Sales', color: '#3b82f6' },
                        { key: 'Transfers', label: 'Transfers', color: '#10b981' },
                        { key: 'DQ Count', label: 'DQ Count', color: '#ef4444' }
                    ]}
                    height={300}
                />
            </div>

            {/* Agent Performance */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Agent Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Agent Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sales</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">DQ Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Approval Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Avg Call Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(data.agentPerformance || []).map((agent, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-semibold">{agent.salesCount}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${agent.dqCount === 0 ? 'text-green-600' :
                                            agent.dqCount < 3 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {agent.dqCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{Math.round(agent.approvalRate)}%</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{agent.avgCallDuration} min</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusIndicator
                                            status={
                                                agent.salesCount >= 5 && agent.dqCount === 0 ? 'success' :
                                                    agent.salesCount >= 3 ? 'warning' : 'danger'
                                            }
                                            size="sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quality Metrics & Recent Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Metrics */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total DQ Items</span>
                            <span className="text-lg font-bold text-gray-900">{data.qualityMetrics?.totalDQ || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">High Severity</span>
                            <span className="text-lg font-bold text-red-600">{data.qualityMetrics?.highSeverity || 0}</span>
                        </div>
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Issues</h4>
                            <div className="space-y-2">
                                {(data.qualityMetrics?.topIssues || []).map((issue, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">{issue.category}</span>
                                        <span className="font-medium text-gray-900">{issue.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                    <div className="space-y-3">
                        {(data.recentAlerts || []).length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No recent alerts</p>
                        ) : (
                            data.recentAlerts.map((alert) => (
                                <div key={alert.id} className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold text-blue-800">{alert.type.toUpperCase()}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{alert.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
