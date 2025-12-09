'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import MetricCard from '@/components/MetricCard'
import PerformanceChart from '@/components/PerformanceChart'
import StatusIndicator from '@/components/StatusIndicator'
import {
    AlertTriangle, CheckCircle, Clock, TrendingDown, TrendingUp,
    RefreshCw, Filter, Plus, Eye, Edit, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DQItem {
    id: string
    centerName: string
    agentName: string
    category: string
    description: string
    severity: 'low' | 'medium' | 'high'
    discoveredDate: string
    status: string
}

interface CorrectiveAction {
    id: string
    centerName: string
    assignedTo: string
    issueDescription: string
    status: 'assigned' | 'in_progress' | 'completed' | 'verified'
    targetDate: string
    createdAt: string
}

interface QualityData {
    summary: {
        totalDQItems: number
        highSeverity: number
        mediumSeverity: number
        lowSeverity: number
        avgDQRate: number
        trendVsLastWeek: number
    }
    dqTrends: Array<{
        date: string
        dqCount: number
        dqRate: number
    }>
    topIssues: Array<{
        category: string
        count: number
        percentage: number
    }>
    centerBreakdown: Array<{
        centerName: string
        dqCount: number
        dqRate: number
        trend: 'up' | 'down' | 'neutral'
    }>
    recentDQItems: DQItem[]
    correctiveActions: CorrectiveAction[]
}

export default function QualityPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <QualityContent />
            </DashboardLayout>
        </ProtectedRoute>
    )
}

function QualityContent() {
    const [data, setData] = useState<QualityData | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)
    const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'low' | 'medium' | 'high'>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchQualityData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange])

    const fetchQualityData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/quality/dq-summary?days=${dateRange}`)

            if (!response.ok) {
                throw new Error('Failed to fetch quality data')
            }

            const jsonData = await response.json()
            setData(jsonData)
        } catch (err) {
            console.error('Error fetching quality data:', err)
            toast.error('Failed to load quality data')
        } finally {
            setLoading(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-100'
            case 'medium': return 'text-yellow-600 bg-yellow-100'
            case 'low': return 'text-blue-600 bg-blue-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    const getActionStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100'
            case 'verified': return 'text-green-700 bg-green-200'
            case 'in_progress': return 'text-blue-600 bg-blue-100'
            case 'assigned': return 'text-gray-600 bg-gray-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                    <p className="mt-4 text-gray-600">Loading quality data...</p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No quality data available</p>
            </div>
        )
    }

    const filteredDQItems = selectedSeverity === 'all'
        ? data.recentDQItems
        : data.recentDQItems.filter(item => item.severity === selectedSeverity)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quality & Compliance</h1>
                    <p className="text-gray-600 mt-1">DQ tracking and corrective actions management</p>
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
                        onClick={fetchQualityData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total DQ Items"
                    value={data.summary.totalDQItems}
                    subtitle={`Last ${dateRange} days`}
                    trend={{
                        direction: data.summary.trendVsLastWeek <= 0 ? 'up' : 'down',
                        value: `${Math.abs(data.summary.trendVsLastWeek)}%`,
                        label: 'vs last week'
                    }}
                    status={data.summary.totalDQItems === 0 ? 'success' : data.summary.totalDQItems < 10 ? 'warning' : 'danger'}
                    icon={<AlertTriangle className="w-6 h-6" />}
                />

                <MetricCard
                    title="High Severity"
                    value={data.summary.highSeverity}
                    subtitle="Critical issues"
                    status={data.summary.highSeverity === 0 ? 'success' : 'danger'}
                    icon={<AlertTriangle className="w-6 h-6" />}
                />

                <MetricCard
                    title="Medium Severity"
                    value={data.summary.mediumSeverity}
                    subtitle="Moderate issues"
                    status={data.summary.mediumSeverity === 0 ? 'success' : 'warning'}
                    icon={<Clock className="w-6 h-6" />}
                />

                <MetricCard
                    title="Average DQ Rate"
                    value={`${data.summary.avgDQRate.toFixed(1)}%`}
                    subtitle="Across all centers"
                    status={data.summary.avgDQRate <= 10 ? 'success' : data.summary.avgDQRate <= 15 ? 'warning' : 'danger'}
                    icon={<TrendingDown className="w-6 h-6" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* DQ Trend Chart */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <PerformanceChart
                        title="DQ Trend Over Time"
                        data={data.dqTrends.map(t => ({
                            date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            'DQ Count': t.dqCount,
                            'DQ Rate %': t.dqRate
                        }))}
                        type="line"
                        xKey="date"
                        yKeys={[
                            { key: 'DQ Count', label: 'DQ Count', color: '#ef4444' },
                            { key: 'DQ Rate %', label: 'DQ Rate %', color: '#f59e0b' }
                        ]}
                        height={250}
                    />
                </div>

                {/* Top Issues */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top DQ Issues</h3>
                    <div className="space-y-3">
                        {data.topIssues.slice(0, 5).map((issue, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900">{issue.category}</span>
                                        <span className="text-sm text-gray-600">{issue.count} issues</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${issue.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="ml-4 text-sm font-semibold text-gray-900">{issue.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Center Breakdown */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">DQ by Center</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Center</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">DQ Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">DQ Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trend</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.centerBreakdown.map((center, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{center.centerName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{center.dqCount}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${center.dqRate < 10 ? 'text-green-600' :
                                                center.dqRate < 15 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {center.dqRate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {center.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-600" />}
                                        {center.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-600" />}
                                        {center.trend === 'neutral' && <span className="text-sm text-gray-500">—</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusIndicator
                                            status={center.dqRate < 10 ? 'success' : center.dqRate < 15 ? 'warning' : 'danger'}
                                            size="sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent DQ Items */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Recent DQ Items</h2>
                        <div className="flex gap-3">
                            <select
                                value={selectedSeverity}
                                onChange={(e) => setSelectedSeverity(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="all">All Severity</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Center</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Agent</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Severity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDQItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.centerName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{item.agentName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.category}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 max-w-xs truncate">{item.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(item.severity)}`}>
                                            {item.severity.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">
                                            {new Date(item.discoveredDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button className="text-blue-600 hover:text-blue-800 mr-3">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Corrective Actions */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Corrective Actions</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Action
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Center</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Issue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Target Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.correctiveActions.map((action) => (
                                <tr key={action.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{action.centerName}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 max-w-xs truncate">{action.issueDescription}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{action.assignedTo}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionStatusColor(action.status)}`}>
                                            {action.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">
                                            {new Date(action.targetDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
