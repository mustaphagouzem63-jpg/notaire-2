import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useTheme } from '../../hooks/useTheme'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const { theme, setTheme, language, setLanguage } = useTheme()
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Office settings
  const [officeSettings, setOfficeSettings] = useState({
    office_name: '',
    office_name_ar: '',
    office_address: '',
    office_address_ar: '',
    office_phone: '',
    notary_name: '',
    notary_name_ar: ''
  })
  const [isSavingOffice, setIsSavingOffice] = useState(false)

  // Backups
  const [backups, setBackups] = useState<any[]>([])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<any>(null)
  const [deleteBackupTarget, setDeleteBackupTarget] = useState<any>(null)

  // Load office settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api.getSettings()
        setOfficeSettings({
          office_name: settings.office_name || '',
          office_name_ar: settings.office_name_ar || '',
          office_address: settings.office_address || '',
          office_address_ar: settings.office_address_ar || '',
          office_phone: settings.office_phone || '',
          notary_name: settings.notary_name || '',
          notary_name_ar: settings.notary_name_ar || ''
        })
      } catch (error) {
        console.error('Failed to load settings', error)
      }
    }
    loadSettings()
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      const data = await window.api.getBackups()
      setBackups(data || [])
    } catch (error) {
      console.error('Failed to load backups', error)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({ type: 'error', message: 'Les mots de passe ne correspondent pas' })
      return
    }
    
    setIsSubmitting(true)
    try {
      if (token) {
        const success = await window.api.changePassword({ 
          token, 
          newPassword: passwordForm.newPassword 
        })
        if (success) {
          showToast({ type: 'success', message: 'Mot de passe mis à jour avec succès' })
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } else {
          showToast({ type: 'error', message: 'Échec de la mise à jour du mot de passe' })
        }
      }
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveOfficeSettings = async () => {
    setIsSavingOffice(true)
    const session = { user, token }
    try {
      await window.api.updateSettings(officeSettings, session)
      showToast({ type: 'success', message: 'Paramètres du cabinet sauvegardés' })
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur' })
    } finally {
      setIsSavingOffice(false)
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    const session = { user, token }
    try {
      const result = await window.api.createBackup(session)
      showToast({ type: 'success', message: `Sauvegarde créée: ${result?.fileName || 'OK'}` })
      fetchBackups()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur de sauvegarde' })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!restoreTarget) return
    const session = { user, token }
    try {
      await window.api.restoreBackup(restoreTarget.path || restoreTarget.fileName, session)
      showToast({ type: 'success', message: 'Restauration effectuée. Redémarrez l\'application.' })
      setRestoreTarget(null)
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur de restauration' })
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteBackupTarget) return
    const session = { user, token }
    try {
      await window.api.deleteBackup(deleteBackupTarget.fileName, session)
      showToast({ type: 'success', message: 'Sauvegarde supprimée' })
      setDeleteBackupTarget(null)
      fetchBackups()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur' })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('nav.settings')}</h1>
        <p className="text-muted-foreground mt-1">Gérez vos préférences et paramètres de compte / إدارة التفضيلات والإعدادات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Office Information */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations du Cabinet / معلومات المكتب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom du cabinet"
                value={officeSettings.office_name}
                onChange={e => setOfficeSettings({...officeSettings, office_name: e.target.value})}
              />
              <Input
                label="اسم المكتب"
                value={officeSettings.office_name_ar}
                onChange={e => setOfficeSettings({...officeSettings, office_name_ar: e.target.value})}
                className="text-right font-arabic"
                dir="rtl"
              />
              <Input
                label="Adresse"
                value={officeSettings.office_address}
                onChange={e => setOfficeSettings({...officeSettings, office_address: e.target.value})}
              />
              <Input
                label="العنوان"
                value={officeSettings.office_address_ar}
                onChange={e => setOfficeSettings({...officeSettings, office_address_ar: e.target.value})}
                className="text-right font-arabic"
                dir="rtl"
              />
              <Input
                label="Téléphone"
                value={officeSettings.office_phone}
                onChange={e => setOfficeSettings({...officeSettings, office_phone: e.target.value})}
              />
              <div></div>
              <Input
                label="Nom du Notaire"
                value={officeSettings.notary_name}
                onChange={e => setOfficeSettings({...officeSettings, notary_name: e.target.value})}
              />
              <Input
                label="اسم الموثق"
                value={officeSettings.notary_name_ar}
                onChange={e => setOfficeSettings({...officeSettings, notary_name_ar: e.target.value})}
                className="text-right font-arabic"
                dir="rtl"
              />
            </div>
            <Button onClick={handleSaveOfficeSettings} isLoading={isSavingOffice} className="w-full md:w-auto">
              Sauvegarder les informations
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Préférences de l'application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Langue / اللغة</label>
              <div className="flex gap-2">
                <Button 
                  variant={language === 'fr' ? 'primary' : 'outline'}
                  onClick={() => setLanguage('fr')}
                  className="flex-1"
                >
                  Français
                </Button>
                <Button 
                  variant={language === 'ar' ? 'primary' : 'outline'}
                  onClick={() => setLanguage('ar')}
                  className="flex-1"
                >
                  العربية
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Thème visuel</label>
              <div className="flex gap-2">
                <Button 
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex-1"
                >
                  ☀️ Clair
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex-1"
                >
                  🌙 Sombre
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Sécurité du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="Mot de passe actuel"
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
                minLength={6}
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
              />
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Mettre à jour le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Backup Management */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sauvegardes / النسخ الاحتياطية</CardTitle>
            <Button onClick={handleCreateBackup} isLoading={isCreatingBackup} size="sm">
              Créer une sauvegarde
            </Button>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                <p>Aucune sauvegarde disponible</p>
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((backup, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{backup.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {backup.createdAt ? new Date(backup.createdAt).toLocaleString() : '—'}
                        {backup.size ? ` • ${(backup.size / 1024 / 1024).toFixed(1)} MB` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRestoreTarget(backup)}>
                        Restaurer
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteBackupTarget(backup)}>
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestoreBackup}
        title="Restaurer la sauvegarde"
        message="Attention : la restauration remplacera toutes les données actuelles. L'application devra être redémarrée. Continuer ?"
      />

      {/* Delete Backup Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteBackupTarget}
        onClose={() => setDeleteBackupTarget(null)}
        onConfirm={handleDeleteBackup}
        title="Supprimer la sauvegarde"
        message={`Êtes-vous sûr de vouloir supprimer la sauvegarde "${deleteBackupTarget?.fileName}" ?`}
      />
    </div>
  )
}
