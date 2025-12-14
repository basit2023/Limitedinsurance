'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import PushNotificationSetup from '@/components/PushNotificationSetup'
import {
  Settings as SettingsIcon, Bell, Shield, Sliders, Mail,
  Smartphone, Save, RefreshCw, AlertCircle, Check
} from 'lucide-react'
import toast from 'react-hot-toast'

type SettingsTab = 'alerts' | 'notifications' | 'thresholds' | 'integrations'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('alerts')
  const [saving, setSaving] = useState(false)

  // Alert Settings
  const [alertSettings, setAlertSettings] = useState({
    lowSalesThreshold: 70,
    zeroSalesCheckTime: 12,
    highDQThreshold: 15,
    lowApprovalThreshold: 75,
    belowThresholdHours: 4,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    frequencyCapMinutes: 60
  })

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    enableSlack: true,
    enableEmail: true,
    enablePush: false,
    enableWhatsApp: false,
    digestMode: false,
    criticalOnly: false
  })

  // System Thresholds
  const [systemThresholds, setSystemThresholds] = useState({
    defaultDQThreshold: 15,
    defaultApprovalRatio: 75,
    alertCheckInterval: 15,
    maxAlertsPerHour: 10
  })

  // Integration Settings
  const [integrations, setIntegrations] = useState({
    slackWebhookSales: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_SALES || '',
    slackWebhookQuality: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_QUALITY || '',
    slackWebhookCritical: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_CRITICAL || '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    fcmServerKey: ''
  })

  const saveSettings = async () => {
    try {
      setSaving(true)
      toast.loading('Saving settings...', { id: 'save-settings' })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertSettings,
          notificationPrefs,
          systemThresholds,
          integrations
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Settings saved successfully!', { id: 'save-settings' })
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Failed to save settings', { id: 'save-settings' })
    } finally {
      setSaving(false)
    }
  }

  const testIntegration = async (type: string) => {
    toast.loading(`Testing ${type} integration...`, { id: 'test-integration' })

    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: [type.toLowerCase().replace(' notification', '').replace('integration', '').trim()],
          message: `Test ${type} from Settings Page`
        })
      })

      if (!response.ok) throw new Error('Test failed')

      const result = await response.json()
      console.log('Test Result:', result)

      toast.success(`${type} test sent! Check your logs/inbox.`, { id: 'test-integration' })
    } catch (err) {
      console.error(err)
      toast.error(`${type} test failed to trigger`, { id: 'test-integration' })
    }
  }

  const tabs = [
    { id: 'alerts', name: 'Alert Rules', icon: Bell },
    { id: 'notifications', name: 'Notifications', icon: Mail },
    { id: 'thresholds', name: 'Thresholds', icon: Sliders },
    { id: 'integrations', name: 'Integrations', icon: Smartphone }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" />
            Settings & Configuration
          </h1>
          <p className="text-gray-600 mt-1">Manage system settings and preferences</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          Save All Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Alert Rules Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Alert Rule Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Sales Threshold (%)
                </label>
                <input
                  type="number"
                  value={alertSettings.lowSalesThreshold}
                  onChange={(e) => setAlertSettings({ ...alertSettings, lowSalesThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when sales are below this % of target</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zero Sales Check Time (Hour)
                </label>
                <input
                  type="number"
                  value={alertSettings.zeroSalesCheckTime}
                  onChange={(e) => setAlertSettings({ ...alertSettings, zeroSalesCheckTime: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Check for zero sales after this hour (24h format)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  High DQ Threshold (%)
                </label>
                <input
                  type="number"
                  value={alertSettings.highDQThreshold}
                  onChange={(e) => setAlertSettings({ ...alertSettings, highDQThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when DQ rate exceeds this percentage</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Approval Threshold (%)
                </label>
                <input
                  type="number"
                  value={alertSettings.lowApprovalThreshold}
                  onChange={(e) => setAlertSettings({ ...alertSettings, lowApprovalThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Alert when approval rate is below this %</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Below Threshold Duration (Hours)
                </label>
                <input
                  type="number"
                  value={alertSettings.belowThresholdHours}
                  onChange={(e) => setAlertSettings({ ...alertSettings, belowThresholdHours: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Alert after being below target for X hours</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency Cap (Minutes)
                </label>
                <input
                  type="number"
                  value={alertSettings.frequencyCapMinutes}
                  onChange={(e) => setAlertSettings({ ...alertSettings, frequencyCapMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum time between same alerts</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours Start
                </label>
                <input
                  type="time"
                  value={alertSettings.quietHoursStart}
                  onChange={(e) => setAlertSettings({ ...alertSettings, quietHoursStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours End
                </label>
                <input
                  type="time"
                  value={alertSettings.quietHoursEnd}
                  onChange={(e) => setAlertSettings({ ...alertSettings, quietHoursEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Push Notification Setup Component */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Push Notification Setup</h2>
            <p className="text-sm text-gray-600 mb-6">
              Enable browser push notifications to receive real-time alerts even when the app is closed.
            </p>
            <PushNotificationSetup />
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Slack Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts via Slack channels</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enableSlack}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, enableSlack: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enableEmail}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, enableEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts on mobile devices</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.enablePush}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, enablePush: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Digest Mode</p>
                    <p className="text-sm text-gray-600">Receive bundled alerts instead of individual ones</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.digestMode}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, digestMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Critical Alerts Only</p>
                    <p className="text-sm text-gray-600">Only receive critical priority alerts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.criticalOnly}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, criticalOnly: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thresholds Tab */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">System-Wide Thresholds</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default DQ Threshold (%)
                </label>
                <input
                  type="number"
                  value={systemThresholds.defaultDQThreshold}
                  onChange={(e) => setSystemThresholds({ ...systemThresholds, defaultDQThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">System-wide acceptable DQ percentage</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Approval Ratio (%)
                </label>
                <input
                  type="number"
                  value={systemThresholds.defaultApprovalRatio}
                  onChange={(e) => setSystemThresholds({ ...systemThresholds, defaultApprovalRatio: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum approval ratio threshold</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Check Interval (Minutes)
                </label>
                <input
                  type="number"
                  value={systemThresholds.alertCheckInterval}
                  onChange={(e) => setSystemThresholds({ ...systemThresholds, alertCheckInterval: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">How often to evaluate alert rules</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Alerts Per Hour
                </label>
                <input
                  type="number"
                  value={systemThresholds.maxAlertsPerHour}
                  onChange={(e) => setSystemThresholds({ ...systemThresholds, maxAlertsPerHour: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum alerts to send per hour per center</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Integration Settings</h2>

            <div className="space-y-6">
              {/* Slack */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Slack Integration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sales Alerts Webhook URL
                    </label>
                    <input
                      type="text"
                      value={integrations.slackWebhookSales}
                      onChange={(e) => setIntegrations({ ...integrations, slackWebhookSales: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <button
                    onClick={() => testIntegration('Slack')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Test Connection
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  Email (SMTP) Integration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={integrations.smtpHost}
                      onChange={(e) => setIntegrations({ ...integrations, smtpHost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={integrations.smtpPort}
                      onChange={(e) => setIntegrations({ ...integrations, smtpPort: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username
                    </label>
                    <input
                      type="email"
                      value={integrations.smtpUser}
                      onChange={(e) => setIntegrations({ ...integrations, smtpUser: e.target.value })}
                      placeholder="your-email@gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <button
                  onClick={() => testIntegration('Email')}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Test Connection
                </button>
              </div>

              {/* Push Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  Push Notifications (Firebase)
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FCM Server Key
                  </label>
                  <input
                    type="password"
                    value={integrations.fcmServerKey}
                    onChange={(e) => setIntegrations({ ...integrations, fcmServerKey: e.target.value })}
                    placeholder="Firebase Cloud Messaging server key"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <button
                  onClick={() => testIntegration('Push Notifications')}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
