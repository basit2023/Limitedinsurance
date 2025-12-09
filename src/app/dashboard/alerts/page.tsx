'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import AlertBadge, { AlertTypeBadge } from '@/components/AlertBadge'
import StatusIndicator from '@/components/StatusIndicator'
import {
  Bell, BellOff, Check, CheckCheck, Filter, RefreshCw,
  Search, Trash2, Eye, Calendar, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Alert {
  id: string
  ruleId: string
  centerId: string
  centerName: string
  alertType: string
  message: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  channelsSent: string[]
  recipients: string[]
  sentAt: string
  acknowledgedBy: string | null
  acknowledgedAt: string | null
  responseAction: string | null
}

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AlertsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function AlertsContent() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<7 | 14 | 30>(7)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unacknowledged' | 'acknowledged'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/alerts?days=${dateRange}&status=${statusFilter}`)

      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (err) {
      console.error('Error fetching alerts:', err)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledged' })
      })

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert')
      }

      toast.success('Alert acknowledged')
      fetchAlerts()
    } catch (err) {
      console.error('Error acknowledging alert:', err)
      toast.error('Failed to acknowledge alert')
    }
  }

  const bulkAcknowledge = async () => {
    try {
      const promises = Array.from(selectedAlerts).map(id =>
        fetch(`/api/alerts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_acknowledged' })
        })
      )

      await Promise.all(promises)

      toast.success(`${selectedAlerts.size} alerts acknowledged`)
      setSelectedAlerts(new Set())
      fetchAlerts()
    } catch (err) {
      console.error('Error bulk acknowledging:', err)
      toast.error('Failed to acknowledge alerts')
    }
  }

  const toggleSelectAlert = (alertId: string) => {
    const newSelected = new Set(selectedAlerts)
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId)
    } else {
      newSelected.add(alertId)
    }
    setSelectedAlerts(newSelected)
  }

  const selectAll = () => {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set())
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)))
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.centerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'acknowledged' && alert.acknowledgedAt) ||
      (statusFilter === 'unacknowledged' && !alert.acknowledgedAt)

    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledgedAt).length,
    critical: alerts.filter(a => a.priority === 'critical').length,
    high: alerts.filter(a => a.priority === 'high').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Alerts & Notifications
          </h1>
          <p className="text-gray-600 mt-1">Monitor and manage system alerts</p>
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
            onClick={fetchAlerts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unacknowledged</p>
              <p className="text-3xl font-bold text-orange-600">{stats.unacknowledged}</p>
            </div>
            <BellOff className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <AlertBadge priority="critical" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.high}</p>
            </div>
            <AlertBadge priority="high" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {selectedAlerts.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={bulkAcknowledge}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Acknowledge ({selectedAlerts.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.size === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={selectAll}
                    className="rounded text-blue-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Center</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className={`hover:bg-gray-50 ${alert.acknowledgedAt ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => toggleSelectAlert(alert.id)}
                      className="rounded text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AlertBadge priority={alert.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AlertTypeBadge type={alert.alertType} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{alert.centerName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-md truncate">{alert.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {alert.channelsSent.map((channel, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {channel}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(alert.sentAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.acknowledgedAt ? (
                      <StatusIndicator status="success" label="Acknowledged" size="sm" showDot={false} />
                    ) : (
                      <StatusIndicator status="warning" label="Pending" size="sm" showDot={false} />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {!alert.acknowledgedAt && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Acknowledge"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No alerts found matching your filters</p>
          </div>
        )}
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts by Type</h3>
          <div className="space-y-3">
            {Object.entries(
              alerts.reduce((acc, alert) => {
                acc[alert.alertType] = (acc[alert.alertType] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <AlertTypeBadge type={type} />
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <AlertBadge priority={alert.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{alert.centerName}</p>
                  <p className="text-xs text-gray-500">{new Date(alert.sentAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
