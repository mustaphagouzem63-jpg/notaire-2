import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { PermissionGate } from '../../components/shared/PermissionGate'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Badge } from '../../components/ui/Badge'

export default function ClientListPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user, token } = useAuth()
  
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    full_name_ar: '',
    national_id: '',
    phone: '',
    address: '',
    address_ar: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      full_name: '', full_name_ar: '', national_id: '', phone: '', address: '', address_ar: '', notes: ''
    })
    setEditingClient(null)
  }

  const fetchClients = async (query = '') => {
    setIsLoading(true)
    try {
      const data = query 
        ? await window.api.searchClients(query)
        : await window.api.getClients()
      setClients(data || [])
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const session = { user, token }
    
    try {
      if (editingClient) {
        await window.api.updateClient(editingClient.id, formData, session)
        showToast({ type: 'success', message: 'Client mis à jour avec succès' })
      } else {
        await window.api.createClient(formData, session)
        showToast({ type: 'success', message: 'Client créé avec succès' })
      }
      setIsModalOpen(false)
      resetForm()
      fetchClients()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (client: any) => {
    setEditingClient(client)
    setFormData({
      full_name: client.full_name || '',
      full_name_ar: client.full_name_ar || '',
      national_id: client.national_id || '',
      phone: client.phone || '',
      address: client.address || '',
      address_ar: client.address_ar || '',
      notes: client.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const session = { user, token }
    try {
      await window.api.deleteClient(deleteTarget.id, session)
      showToast({ type: 'success', message: 'Client supprimé' })
      setDeleteTarget(null)
      fetchClients()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const columns = [
    { key: 'national_id', title: t('clients.nationalId'), sortable: true, className: 'font-mono' },
    { 
      key: 'full_name', 
      title: t('clients.fullName'),
      sortable: true,
      render: (client: any) => (
        <div>
          <div className="font-medium">{client.full_name}</div>
          {client.full_name_ar && (
            <div className="text-xs text-muted-foreground font-arabic" dir="rtl">{client.full_name_ar}</div>
          )}
        </div>
      )
    },
    { key: 'phone', title: t('clients.phone') },
    {
      key: 'status',
      title: t('common.status'),
      render: (client: any) => (
        <Badge variant={client.status === 'active' ? 'success' : 'secondary'} className="capitalize">
          {client.status === 'active' ? 'Actif' : client.status}
        </Badge>
      )
    },
    { 
      key: 'actions', 
      title: t('common.actions'),
      render: (client: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(client) }}>
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(client) }}>
            {t('common.delete')}
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('clients.title')}</h1>
          <p className="text-muted-foreground mt-1">Gérez vos clients et leurs informations / إدارة العملاء ومعلوماتهم</p>
        </div>
        <PermissionGate permission="clients.create">
          <Button 
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            leftIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>}
          >
            {t('clients.new')}
          </Button>
        </PermissionGate>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <SearchInput 
            onSearch={fetchClients} 
            placeholder={t('common.search')}
            className="w-full max-w-sm"
          />
          <div className="text-sm text-muted-foreground self-center">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </div>
        </div>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={clients} 
            isLoading={isLoading} 
            onRowClick={(client) => handleEdit(client)}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title={editingClient ? 'Modifier le client' : t('clients.new')}
        size="lg"
      >
        <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('clients.nationalId')}
              value={formData.national_id}
              onChange={e => setFormData({...formData, national_id: e.target.value})}
              required
              disabled={!!editingClient}
            />
            <Input
              label={t('clients.phone')}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              required
            />
            <Input
              label={t('clients.fullName')}
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              required
            />
            <Input
              label={t('clients.fullNameAr')}
              value={formData.full_name_ar}
              onChange={e => setFormData({...formData, full_name_ar: e.target.value})}
              required
              className="text-right font-arabic"
              dir="rtl"
            />
            <Textarea
              label={t('clients.address')}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="md:col-span-2"
            />
            <Textarea
              label={t('clients.addressAr')}
              value={formData.address_ar}
              onChange={e => setFormData({...formData, address_ar: e.target.value})}
              className="md:col-span-2 text-right font-arabic"
              dir="rtl"
            />
            <Textarea
              label={t('clients.notes')}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="md:col-span-2"
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        message={t('clients.deleteConfirm')}
      />
    </div>
  )
}
