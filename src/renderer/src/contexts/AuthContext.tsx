import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  username: string
  full_name: string
  role: string
  language_preference: string
  theme_preference: string
  permissions?: string[]
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('notary_auth_token')
      
      if (storedToken) {
        try {
          const session = await window.api.getSession(storedToken)
          if (session) {
            setToken(session.token)
            setUser(session.user)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('notary_auth_token')
          }
        } catch (error) {
          console.error('Failed to restore session', error)
          localStorage.removeItem('notary_auth_token')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    setIsAuthenticated(true)
    localStorage.setItem('notary_auth_token', newToken)
  }

  const logout = async () => {
    if (token) {
      await window.api.logout(token)
    }
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('notary_auth_token')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
