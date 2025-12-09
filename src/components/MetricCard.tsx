"use client"
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type TrendDirection = 'up' | 'down' | 'neutral'

interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: {
        direction: TrendDirection
        value: string
        label?: string
    }
    status?: 'success' | 'warning' | 'danger' | 'neutral'
    icon?: React.ReactNode
    loading?: boolean
    onClick?: () => void
}

export default function MetricCard({
    title,
    value,
    subtitle,
    trend,
    status = 'neutral',
    icon,
    loading = false,
    onClick
}: MetricCardProps) {
    const statusColors = {
        success: 'border-green-500 bg-green-50',
        warning: 'border-yellow-500 bg-yellow-50',
        danger: 'border-red-500 bg-red-50',
        neutral: 'border-gray-200 bg-white'
    }

    const trendColors = {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600'
    }

    const TrendIcon = trend?.direction === 'up'
        ? TrendingUp
        : trend?.direction === 'down'
            ? TrendingDown
            : Minus

    return (
        <div
            className={`
        rounded-lg border-2 p-6 transition-all duration-200
        ${statusColors[status]}
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${loading ? 'animate-pulse' : ''}
      `}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>

                    {loading ? (
                        <div className="h-8 w-24 bg-gray-300 rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
                    )}

                    {subtitle && (
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    )}

                    {trend && !loading && (
                        <div className={`flex items-center gap-1 mt-2 ${trendColors[trend.direction]}`}>
                            <TrendIcon size={16} />
                            <span className="text-sm font-medium">{trend.value}</span>
                            {trend.label && (
                                <span className="text-xs text-gray-500 ml-1">{trend.label}</span>
                            )}
                        </div>
                    )}
                </div>

                {icon && (
                    <div className="ml-4 text-gray-400">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    )
}
