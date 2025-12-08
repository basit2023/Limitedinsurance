/**
 * Permission-Based Authorization Examples
 * 
 * This file demonstrates how to use the permission system throughout your application.
 */

import { useAuth } from '@/contexts/AuthContext'

// Example 1: Basic Permission Check in a Component
export function ExampleCreateButton() {
  const { hasPermission } = useAuth()

  if (!hasPermission('can_create')) {
    return null // Don't show button if user can't create
  }

  return (
    <button className="btn-primary">
      Create New Item
    </button>
  )
}

// Example 2: Conditional Rendering Based on Multiple Permissions
export function ExampleActionButtons() {
  const { hasPermission, permissions } = useAuth()

  return (
    <div className="action-buttons">
      {hasPermission('can_view') && (
        <button>View Details</button>
      )}
      
      {hasPermission('can_edit') && (
        <button>Edit</button>
      )}
      
      {hasPermission('can_delete') && (
        <button>Delete</button>
      )}
      
      {/* Check permission level */}
      {permissions && permissions.permission_level >= 50 && (
        <button>Advanced Settings</button>
      )}
    </div>
  )
}

// Example 3: Permission Guard for Entire Page Section
export function ExampleAdminSection() {
  const { permissions } = useAuth()

  if (!permissions || permissions.permission_level < 80) {
    return (
      <div className="alert alert-warning">
        You need administrator privileges to access this section.
      </div>
    )
  }

  return (
    <div className="admin-section">
      <h2>Admin Controls</h2>
      {/* Admin-only content */}
    </div>
  )
}

// Example 4: Using Permissions in API Calls
export function ExampleDataManagement() {
  const { hasPermission } = useAuth()

  const handleCreate = async () => {
    if (!hasPermission('can_create')) {
      alert('You do not have permission to create items')
      return
    }

    // Proceed with API call
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* data */ })
    })
  }

  const handleUpdate = async (id: string) => {
    if (!hasPermission('can_edit')) {
      alert('You do not have permission to edit items')
      return
    }

    // Proceed with API call
    const response = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* data */ })
    })
  }

  const handleDelete = async (id: string) => {
    if (!hasPermission('can_delete')) {
      alert('You do not have permission to delete items')
      return
    }

    if (!confirm('Are you sure?')) return

    // Proceed with API call
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
  }

  return (
    <div>
      {hasPermission('can_create') && (
        <button onClick={handleCreate}>Create</button>
      )}
      {hasPermission('can_edit') && (
        <button onClick={() => handleUpdate('item-id')}>Update</button>
      )}
      {hasPermission('can_delete') && (
        <button onClick={() => handleDelete('item-id')}>Delete</button>
      )}
    </div>
  )
}

// Example 5: Permission-Based Table Actions
export function ExampleUserTable({ users }: { users: any[] }) {
  const { hasPermission } = useAuth()

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          {(hasPermission('can_edit') || hasPermission('can_delete')) && (
            <th>Actions</th>
          )}
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            {(hasPermission('can_edit') || hasPermission('can_delete')) && (
              <td>
                {hasPermission('can_edit') && (
                  <button>Edit</button>
                )}
                {hasPermission('can_delete') && (
                  <button>Delete</button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Example 6: Permission-Based Form Fields
export function ExampleForm() {
  const { hasPermission, permissions } = useAuth()

  return (
    <form>
      {/* Everyone can view */}
      <input type="text" placeholder="Name" disabled={!hasPermission('can_edit')} />
      
      {/* Only users with edit permission can change this */}
      {hasPermission('can_edit') ? (
        <input type="text" placeholder="Description" />
      ) : (
        <p>Description: {/* read-only value */}</p>
      )}
      
      {/* Only high-level users can see sensitive fields */}
      {permissions && permissions.permission_level >= 70 && (
        <input type="text" placeholder="Sensitive Data" />
      )}
      
      {/* Submit button only for users with create/edit permission */}
      {(hasPermission('can_create') || hasPermission('can_edit')) && (
        <button type="submit">Save</button>
      )}
    </form>
  )
}
