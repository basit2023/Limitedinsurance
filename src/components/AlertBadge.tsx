"use client"
import React from 'react'

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low'

interface AlertBadgeProps {
    priority: AlertPriority
    count?: number
    onClick?: () => void
    className?: string
}

export default function AlertBadge({
    priority,
    count,
    onClick,
    className = ''
}: AlertBadgeProps) {
    const priorityConfig = {
        critical: {
            bg: 'bg-red-600',
            text: 'text-white',
            label: 'Critical',
            icon: '🚨'
        },
        high: {
            bg: 'bg-orange-500',
            text: 'text-white',
            label: 'High',
            icon: '⚠️'
        },
        medium: {
            bg: 'bg-yellow-500',
            text: 'text-white',
            label: 'Medium',
            icon: '⚡'
        },
        low: {
            bg: 'bg-blue-500',
            text: 'text-white',
            label: 'Low',
            icon: 'ℹ️'
        }
    }

    const config = priorityConfig[priority] || priorityConfig['medium']

    return (
        <span
            className={`
        inline-flex items-center gap-1 rounded-full px-3 py-1
        ${config.bg} ${config.text} text-xs font-semibold
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {count !== undefined && count > 0 && (
                <span className="ml-1 bg-white bg-opacity-30 rounded-full px-2 py-0.5">
                    {count}
                </span>
            )}
        </span>
    )
}

// Alert type badge
interface AlertTypeBadgeProps {
    type: string
    className?: string
}

export function AlertTypeBadge({ type, className = '' }: AlertTypeBadgeProps) {
    const typeColors: Record<string, string> = {
        'low_sales': 'bg-red-100 text-red-800',
        'zero_sales': 'bg-red-600 text-white',
        'high_dq': 'bg-orange-100 text-orange-800',
        'low_approval': 'bg-yellow-100 text-yellow-800',
        'milestone': 'bg-green-100 text-green-800',
        'below_threshold': 'bg-purple-100 text-purple-800'
    }

    const color = typeColors[type] || 'bg-gray-100 text-gray-800'

    const safeType = type || 'Unknown'
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
            {safeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    )
}
