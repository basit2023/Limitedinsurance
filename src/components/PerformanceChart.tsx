"use client"
import React from 'react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    TooltipProps
} from 'recharts'

export type ChartType = 'line' | 'bar'

interface DataPoint {
    [key: string]: string | number
}

interface PerformanceChartProps {
    data: DataPoint[]
    type?: ChartType
    xKey: string
    yKeys: Array<{
        key: string
        label: string
        color: string
    }>
    height?: number
    loading?: boolean
    title?: string
}

export default function PerformanceChart({
    data,
    type = 'line',
    xKey,
    yKeys,
    height = 300,
    loading = false,
    title
}: PerformanceChartProps) {
    if (loading) {
        return (
            <div className="w-full bg-gray-100 rounded-lg animate-pulse" style={{ height }}>
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Loading chart...</p>
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" style={{ height }}>
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No data available</p>
                </div>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-bold">{entry.value}</span>
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    const ChartComponent = type === 'line' ? LineChart : BarChart

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey={xKey}
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                        iconType="circle"
                    />
                    {yKeys.map((yKey) => (
                        type === 'line' ? (
                            <Line
                                key={yKey.key}
                                type="monotone"
                                dataKey={yKey.key}
                                stroke={yKey.color}
                                strokeWidth={2}
                                name={yKey.label}
                                dot={{ fill: yKey.color, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ) : (
                            <Bar
                                key={yKey.key}
                                dataKey={yKey.key}
                                fill={yKey.color}
                                name={yKey.label}
                                radius={[4, 4, 0, 0]}
                            />
                        )
                    ))}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    )
}
