"use client"
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type PermissionType = 'can_create' | 'can_edit' | 'can_delete' | 'can_view'

interface ProtectedComponentProps {
  children: React.ReactNode
  requiredPermission?: PermissionType
  minPermissionLevel?: number
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * HOC component that protects content based on permissions
 * 
 * Usage:
 * <ProtectedByPermission requiredPermission="can_create">
 *   <CreateButton />
 * </ProtectedByPermission>
 * 
 * Or check permission level:
 * <ProtectedByPermission minPermissionLevel={80}>
 *   <AdminPanel />
 * </ProtectedByPermission>
 */
export default function ProtectedByPermission({
  children,
  requiredPermission,
  minPermissionLevel,
  fallback = null,
  redirectTo
}: ProtectedComponentProps) {
  const { permissions, hasPermission, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated && redirectTo) {
      router.push(redirectTo)
    }
  }, [loading, isAuthenticated, redirectTo, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>
  }

  // Check permission level
  if (minPermissionLevel !== undefined && permissions) {
    if (permissions.permission_level < minPermissionLevel) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

/**
 * Wrapper for create actions
 */
export function CanCreate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedByPermission requiredPermission="can_create" fallback={fallback}>
      {children}
    </ProtectedByPermission>
  )
}

/**
 * Wrapper for edit actions
 */
export function CanEdit({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedByPermission requiredPermission="can_edit" fallback={fallback}>
      {children}
    </ProtectedByPermission>
  )
}

/**
 * Wrapper for delete actions
 */
export function CanDelete({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedByPermission requiredPermission="can_delete" fallback={fallback}>
      {children}
    </ProtectedByPermission>
  )
}

/**
 * Wrapper for view actions
 */
export function CanView({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedByPermission requiredPermission="can_view" fallback={fallback}>
      {children}
    </ProtectedByPermission>
  )
}

/**
 * Admin-level permission (level 80+)
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedByPermission minPermissionLevel={80} fallback={fallback}>
      {children}
    </ProtectedByPermission>
  )
}

/**
 * Manager-level permission (level 60+)
 */
export function ManagerOrAbove({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedByPermission minPermissionLevel={60} fallback={fallback}>
      {children}
    </ProtectedByPermission>
  )
}
