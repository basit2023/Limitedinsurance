'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, X } from 'lucide-react'
import {
    isPushSupported,
    getNotificationPermission,
    requestNotificationPermission,
    registerServiceWorker,
    subscribeToPush,
    unsubscribeFromPush,
    getCurrentSubscription,
    sendTestNotification
} from '@/services/pushService'

export default function PushNotificationSetup() {
    const [supported, setSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [subscribed, setSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if push is supported
        setSupported(isPushSupported())

        if (isPushSupported()) {
            setPermission(getNotificationPermission())
            checkSubscriptionStatus()
        }
    }, [])

    const checkSubscriptionStatus = async () => {
        try {
            const subscription = await getCurrentSubscription()
            setSubscribed(!!subscription)
        } catch (err) {
            console.error('Error checking subscription:', err)
        }
    }

    const handleEnableNotifications = async () => {
        setLoading(true)
        setError(null)

        try {
            // Request permission
            const perm = await requestNotificationPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                setError('Notification permission denied')
                return
            }

            // Register service worker
            await registerServiceWorker()

            // Subscribe to push
            await subscribeToPush()
            setSubscribed(true)

            // Send test notification
            await sendTestNotification()

        } catch (err) {
            console.error('Error enabling notifications:', err)
            setError(err instanceof Error ? err.message : 'Failed to enable notifications')
        } finally {
            setLoading(false)
        }
    }

    const handleDisableNotifications = async () => {
        setLoading(true)
        setError(null)

        try {
            const success = await unsubscribeFromPush()
            if (success) {
                setSubscribed(false)
            } else {
                setError('Failed to unsubscribe')
            }
        } catch (err) {
            console.error('Error disabling notifications:', err)
            setError(err instanceof Error ? err.message : 'Failed to disable notifications')
        } finally {
            setLoading(false)
        }
    }

    const handleTestNotification = async () => {
        try {
            await sendTestNotification()
        } catch (err) {
            console.error('Error sending test notification:', err)
            setError(err instanceof Error ? err.message : 'Failed to send test notification')
        }
    }

    if (!supported) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <BellOff className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-yellow-900">Push Notifications Not Supported</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-indigo-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Browser Push Notifications</h3>
                        <p className="text-sm text-gray-600">
                            Get real-time alerts directly in your browser
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {subscribed && (
                        <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <Check className="w-4 h-4" />
                            Enabled
                        </span>
                    )}
                    {permission === 'denied' && (
                        <span className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                            <X className="w-4 h-4" />
                            Blocked
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="space-y-3">
                {permission === 'denied' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                            You've blocked notifications. Please enable them in your browser settings to receive alerts.
                        </p>
                    </div>
                )}

                <div className="flex gap-2">
                    {!subscribed ? (
                        <button
                            onClick={handleEnableNotifications}
                            disabled={loading || permission === 'denied'}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            {loading ? 'Enabling...' : 'Enable Notifications'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleDisableNotifications}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <BellOff className="w-4 h-4" />
                                {loading ? 'Disabling...' : 'Disable Notifications'}
                            </button>
                            <button
                                onClick={handleTestNotification}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Send Test
                            </button>
                        </>
                    )}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                    <p>• Receive instant alerts when performance thresholds are breached</p>
                    <p>• Works even when the dashboard is closed</p>
                    <p>• Can be disabled anytime</p>
                </div>
            </div>
        </div>
    )
}
