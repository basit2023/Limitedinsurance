// Permission utility functions and types

export type PermissionType = 'can_create' | 'can_edit' | 'can_delete' | 'can_view'

export type Permissions = {
  permission_level: number
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_view: boolean
}

/**
 * Check if permissions object has a specific permission
 */
export function hasPermission(
  permissions: Permissions | null,
  permission: PermissionType
): boolean {
  if (!permissions) return false
  return permissions[permission] === true
}

/**
 * Check if permissions meet minimum level
 */
export function hasMinimumLevel(
  permissions: Permissions | null,
  minLevel: number
): boolean {
  if (!permissions) return false
  return permissions.permission_level >= minLevel
}

/**
 * Get all active permissions as array
 */
export function getActivePermissions(permissions: Permissions | null): PermissionType[] {
  if (!permissions) return []
  
  const active: PermissionType[] = []
  if (permissions.can_view) active.push('can_view')
  if (permissions.can_create) active.push('can_create')
  if (permissions.can_edit) active.push('can_edit')
  if (permissions.can_delete) active.push('can_delete')
  
  return active
}
