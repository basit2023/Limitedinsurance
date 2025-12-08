"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  full_name?: string
  user_type_id?: string
  status?: boolean
}

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null
        if (storedToken) {
          // Verify token with backend
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          })
          
          if (res.ok) {
            const data = await res.json()
            setUser(data.user)
            setToken(storedToken)
          } else {
            // Token invalid, clear it
            sessionStorage.removeItem('access_token')
            sessionStorage.removeItem('user_email')
            sessionStorage.removeItem('user_type')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('user_email')
        sessionStorage.removeItem('user_type')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.token) {
        sessionStorage.setItem('access_token', data.token)
        sessionStorage.setItem('user_email', data.user.email)
        sessionStorage.setItem('user_type', data.user_type || 'user')
        setToken(data.token)
        setUser(data.user)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, full_name: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      if (data.token) {
        sessionStorage.setItem('access_token', data.token)
        sessionStorage.setItem('user_email', data.user.email)
        sessionStorage.setItem('user_type', data.user_type || 'admin')
        setToken(data.token)
        setUser(data.user)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = () => {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user_email')
    sessionStorage.removeItem('user_type')
    setToken(null)
    setUser(null)
    router.push('/login')
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
