import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { Button } from './../components/ui/Button'
import { Input } from './../components/ui/Input'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [forceChange, setForceChange] = useState(false)
  const [sessionToken, setSessionToken] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const result = await window.api.login({ username, password })
      
      if (result.success) {
        if (result.forcePasswordChange) {
          setForceChange(true)
          setSessionToken(result.session.token)
        } else {
          login(result.session.token, result.session.user)
          navigate('/dashboard')
        }
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setError('')
    setIsLoading(true)
    
    try {
      const success = await window.api.changePassword({ token: sessionToken, newPassword })
      
      if (success) {
        // After password change, we need to fetch the session again
        const session = await window.api.getSession(sessionToken)
        if (session) {
          login(sessionToken, session.user)
          navigate('/dashboard')
        } else {
          setError('Session expired, please login again')
          setForceChange(false)
        }
      } else {
        setError('Failed to change password')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/20 rounded-full blur-3xl mix-blend-multiply opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/50 rounded-full blur-3xl mix-blend-multiply opacity-70"></div>
      
      <div className="w-full max-w-md">
        <div className="glass-card shadow-xl p-8 rounded-2xl relative z-10 border border-white/20 dark:border-slate-800/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notary<span className="text-primary-500">Pro</span></h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Mme Henda Ben Mansour | نظام إدارة مكتب التوثيق</p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 border border-rose-200 dark:border-rose-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              {error}
            </div>
          )}

          {!forceChange ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label={t('auth.username')}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
              
              <Input
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              
              <Button type="submit" className="w-full mt-2" isLoading={isLoading} size="lg">
                {t('auth.loginBtn')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm mb-4 border border-amber-200 dark:border-amber-800/50">
                {t('auth.forceChange')}
              </div>
              
              <Input
                label={t('auth.newPassword')}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
              <Button type="submit" className="w-full mt-2" isLoading={isLoading} size="lg">
                {t('common.save')}
              </Button>
            </form>
          )}
        </div>
        
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8 relative z-10">
          &copy; {new Date().getFullYear()} NotaryPro. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
