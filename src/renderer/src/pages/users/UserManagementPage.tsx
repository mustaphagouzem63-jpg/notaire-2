import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

export default function UserManagementPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { token, user: currentUser } = useAuth()
  
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'clerk',
    language_preference: 'fr',
    theme_preference: 'dark'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      username: '', full_name: '', password: '', role: 'clerk',
      language_preference: 'fr', theme_preference: 'dark'
    })
    setEditingUser(null)
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const data = await window.api.getUsers()
      setUsers(data || [])
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const session = { user: currentUser, token }
    
    try {
      if (editingUser) {
        const { password, ...updateData } = formData
        await window.api.updateUser(editingUser.id, updateData, session)
        showToast({ type: 'success', message: 'Utilisateur mis à jour' })
      } else {
        if (!formData.password || formData.password.length < 6) {
          showToast({ type: 'error', message: 'Le mot de passe doit contenir au moins 6 caractères' })
          setIsSubmitting(false)
          return
        }
        await window.api.createUser(formData, session)
        showToast({ type: 'success', message: 'Utilisateur créé avec succès' })
      }
      setIsModalOpen(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      full_name: user.full_name,
      password: '',
      role: user.role,
      language_preference: user.language_preference || 'fr',
      theme_preference: user.theme_preference || 'dark'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const session = { user: currentUser, token }
    try {
      await window.api.deleteUser(deleteTarget.id, session)
      showToast({ type: 'success', message: 'Utilisateur supprimé' })
      setDeleteTarget(null)
      fetchUsers()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordTarget || !newPassword) return
    if (newPassword.length < 6) {
      showToast({ type: 'error', message: 'Le mot de passe doit contenir au moins 6 caractères' })
      return
    }
    const session = { user: currentUser, token }
    try {
      await window.api.resetPassword(resetPasswordTarget.id, newPassword, session)
      showToast({ type: 'success', message: 'Mot de passe réinitialisé' })
      setResetPasswordTarget(null)
      setNewPassword('')
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'primary',
    notary: 'success',
    clerk: 'default',
    assistant: 'secondary',
    auditor: 'warning'
  }

  const columns = [
    { key: 'username', title: t('auth.username'), sortable: true },
    { key: 'full_name', title: 'Nom complet', sortable: true },
    { 
      key: 'role', 
      title: 'Rôle',
      render: (user: any) => (
        <Badge variant={roleColors[user.role] as any || 'default'} className="capitalize">
          {user.role}
        </Badge>
      )
    },
    {
      key: 'is_active',
      title: 'Statut',
      render: (user: any) => (
        <Badge variant={user.is_active ? 'success' : 'destructive'}>
          {user.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'last_login_at',
      title: 'Dernière connexion',
      render: (user: any) => user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Jamais'
    },
    { 
      key: 'actions', 
      title: t('common.actions'),
      render: (u: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(u) }}>
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { 
            e.stopPropagation()
            setResetPasswordTarget(u)
            setNewPassword('')
          }}>
            Réinit. MDP
          </Button>
          {u.id !== currentUser?.id && (
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(u) }}>
              {t('common.delete')}
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('nav.users')}</h1>
          <p className="text-muted-foreground mt-1">Gérez les accès et les utilisateurs du système / إدارة المستخدمين والصلاحيات</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          leftIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>}
        >
          Nouvel utilisateur
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={users} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.username')}
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
            required
            disabled={!!editingUser}
          />
          <Input
            label="Nom complet"
            value={formData.full_name}
            onChange={e => setFormData({...formData, full_name: e.target.value})}
            required
          />
          {!editingUser && (
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
            />
          )}
          <Select
            label="Rôle"
            options={[
              { value: 'admin', label: 'Administrateur' },
              { value: 'notary', label: 'Notaire' },
              { value: 'clerk', label: 'Clerc' },
              { value: 'assistant', label: 'Assistant(e)' },
              { value: 'auditor', label: 'Auditeur' },
            ]}
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Langue"
              options={[
                { value: 'fr', label: 'Français' },
                { value: 'ar', label: 'العربية' },
              ]}
              value={formData.language_preference}
              onChange={e => setFormData({...formData, language_preference: e.target.value})}
            />
            <Select
              label="Thème"
              options={[
                { value: 'dark', label: 'Sombre' },
                { value: 'light', label: 'Clair' },
              ]}
              value={formData.theme_preference}
              onChange={e => setFormData({...formData, theme_preference: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); resetForm() }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetPasswordTarget}
        onClose={() => { setResetPasswordTarget(null); setNewPassword('') }}
        title={`Réinitialiser le mot de passe — ${resetPasswordTarget?.username}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm border border-amber-200 dark:border-amber-800/50">
            L'utilisateur sera forcé de changer son mot de passe lors de sa prochaine connexion.
          </div>
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => { setResetPasswordTarget(null); setNewPassword('') }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${deleteTarget?.username}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
