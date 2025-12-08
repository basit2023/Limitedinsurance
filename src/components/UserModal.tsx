"use client"
import { useState, useEffect } from 'react'

type UserType = {
  id: string
  name: string
  permission_level: number
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_view: boolean
  description?: string
}

type UserModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: UserFormData) => Promise<void>
  user?: {
    id: string
    email: string
    full_name?: string
    user_type_id?: string
    status?: boolean
  } | null
}

export type UserFormData = {
  id?: string
  email: string
  full_name: string
  user_type_id: string
  password?: string
  status: boolean
}

export default function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const [userTypes, setUserTypes] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<UserFormData>({
    email: '',
    full_name: '',
    user_type_id: '',
    password: '',
    status: true
  })

  useEffect(() => {
    if (isOpen) {
      fetchUserTypes()
      if (user) {
        setForm({
          id: user.id,
          email: user.email,
          full_name: user.full_name || '',
          user_type_id: user.user_type_id || '',
          password: '',
          status: user.status ?? true
        })
      } else {
        setForm({
          email: '',
          full_name: '',
          user_type_id: '',
          password: '',
          status: true
        })
      }
    }
  }, [isOpen, user])

  const fetchUserTypes = async () => {
    try {
      const res = await fetch('/api/user-types')
      const data = await res.json()
      setUserTypes(data.userTypes || [])
    } catch (err) {
      console.error('Error fetching user types:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      console.error('Error saving user:', err)
      alert('Error saving user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedUserType = userTypes.find(ut => ut.id === form.user_type_id)

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {user ? 'Edit User' : 'Add New User'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.user_type_id}
              onChange={e => setForm({ ...form, user_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
            >
              <option value="">Select user type...</option>
              {userTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} (Level {type.permission_level})
                  {type.description ? ` - ${type.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedUserType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Permissions for {selectedUserType.name}:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center">
                  <span className={selectedUserType.can_view ? 'text-green-600' : 'text-gray-400'}>
                    {selectedUserType.can_view ? '✓' : '✗'} View
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={selectedUserType.can_create ? 'text-green-600' : 'text-gray-400'}>
                    {selectedUserType.can_create ? '✓' : '✗'} Create
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={selectedUserType.can_edit ? 'text-green-600' : 'text-gray-400'}>
                    {selectedUserType.can_edit ? '✓' : '✗'} Edit
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={selectedUserType.can_delete ? 'text-green-600' : 'text-gray-400'}>
                    {selectedUserType.can_delete ? '✓' : '✗'} Delete
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {!user && <span className="text-red-500">*</span>}
              {user && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!user}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              checked={form.status}
              onChange={e => setForm({ ...form, status: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
              Active User
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
