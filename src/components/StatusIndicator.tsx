"use client"
import React from 'react'

export type StatusType = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusIndicatorProps {
    status: StatusType
    label?: string
    tooltip?: string
    size?: 'sm' | 'md' | 'lg'
    showDot?: boolean
}

export default function StatusIndicator({
    status,
    label,
    tooltip,
    size = 'md',
    showDot = true
}: StatusIndicatorProps) {
    const statusConfig = {
        success: {
            color: 'bg-green-500',
            textColor: 'text-green-700',
            bgColor: 'bg-green-100',
            borderColor: 'border-green-500',
            label: label || 'On Target'
        },
        warning: {
            color: 'bg-yellow-500',
            textColor: 'text-yellow-700',
            bgColor: 'bg-yellow-100',
            borderColor: 'border-yellow-500',
            label: label || 'At Risk'
        },
        danger: {
            color: 'bg-red-500',
            textColor: 'text-red-700',
            bgColor: 'bg-red-100',
            borderColor: 'border-red-500',
            label: label || 'Needs Attention'
        },
        neutral: {
            color: 'bg-gray-500',
            textColor: 'text-gray-700',
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-500',
            label: label || 'No Data'
        }
    }

    const sizeConfig = {
        sm: {
            dot: 'w-2 h-2',
            text: 'text-xs',
            padding: 'px-2 py-1'
        },
        md: {
            dot: 'w-3 h-3',
            text: 'text-sm',
            padding: 'px-3 py-1'
        },
        lg: {
            dot: 'w-4 h-4',
            text: 'text-base',
            padding: 'px-4 py-2'
        }
    }

    const config = statusConfig[status]
    const sizeStyle = sizeConfig[size]

    return (
        <div
            className={`
        inline-flex items-center gap-2 rounded-full border
        ${config.bgColor} ${config.borderColor} ${sizeStyle.padding}
      `}
            title={tooltip}
        >
            {showDot && (
                <span className={`${sizeStyle.dot} ${config.color} rounded-full`} />
            )}
            <span className={`${sizeStyle.text} ${config.textColor} font-medium`}>
                {config.label}
            </span>
        </div>
    )
}

// Helper function to determine status based on percentage
export function getStatusFromPercentage(percentage: number): StatusType {
    if (percentage >= 80) return 'success'
    if (percentage >= 50) return 'warning'
    return 'danger'
}

// Helper function to determine status based on target achievement
export function getStatusFromTarget(actual: number, target: number): StatusType {
    if (target === 0) return 'neutral'
    const percentage = (actual / target) * 100
    return getStatusFromPercentage(percentage)
}
