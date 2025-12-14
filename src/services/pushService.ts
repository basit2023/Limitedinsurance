/**
 * Client-side Push Notification Service
 * Handles push notification subscription and management
 */

export interface PushSubscriptionData {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    return Notification.permission
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser')
    }

    const permission = await Notification.requestPermission()
    return permission
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported')
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        })
        console.log('✅ Service Worker registered:', registration)
        return registration
    } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
        throw error
    }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
    try {
        // Ensure service worker is registered
        const registration = await navigator.serviceWorker.ready

        // Get VAPID public key from environment
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
            throw new Error('VAPID public key not configured')
        }

        // Convert VAPID key to Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        })

        // Convert subscription to JSON
        const subscriptionJSON = subscription.toJSON()

        if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
            throw new Error('Invalid subscription data')
        }

        const subscriptionData: PushSubscriptionData = {
            endpoint: subscriptionJSON.endpoint,
            keys: {
                p256dh: subscriptionJSON.keys.p256dh || '',
                auth: subscriptionJSON.keys.auth || ''
            }
        }

        // Send subscription to backend
        await saveSubscriptionToBackend(subscriptionData)

        console.log('✅ Push subscription successful:', subscriptionData)
        return subscriptionData

    } catch (error) {
        console.error('❌ Push subscription failed:', error)
        throw error
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            return true
        }

        // Unsubscribe from push
        const successful = await subscription.unsubscribe()

        if (successful) {
            // Remove from backend
            await removeSubscriptionFromBackend(subscription.endpoint)
            console.log('✅ Push unsubscription successful')
        }

        return successful

    } catch (error) {
        console.error('❌ Push unsubscription failed:', error)
        return false
    }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
    try {
        const registration = await navigator.serviceWorker.ready
        return await registration.pushManager.getSubscription()
    } catch (error) {
        console.error('Error getting current subscription:', error)
        return null
    }
}

/**
 * Save subscription to backend
 */
async function saveSubscriptionToBackend(subscription: PushSubscriptionData): Promise<void> {
    // Get user ID from localStorage
    const userStr = localStorage.getItem('user')
    let userId = null
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr)
            userId = user.id
        } catch (e) {
            console.error('Error parsing user from localStorage:', e)
        }
    }

    const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...subscription,
            userId
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Backend error:', error)
        throw new Error('Failed to save subscription to backend')
    }
}

/**
 * Remove subscription from backend
 */
async function removeSubscriptionFromBackend(endpoint: string): Promise<void> {
    const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
    })

    if (!response.ok) {
        throw new Error('Failed to remove subscription from backend')
    }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
}

/**
 * Test push notification (for development)
 */
export async function sendTestNotification(): Promise<void> {
    if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted')
    }

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('Test Notification', {
        body: 'This is a test notification from the Insurance Alert Portal',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'test-notification',
        requireInteraction: false
    })
}
