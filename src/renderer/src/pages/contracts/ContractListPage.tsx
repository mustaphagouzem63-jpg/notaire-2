import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Tabs } from '../../components/ui/Tabs'
import { PermissionGate } from '../../components/shared/PermissionGate'

const CONTRACT_TYPES = [
  { value: 'sale', label: 'Vente' },
  { value: 'power_of_attorney', label: 'Procuration' },
  { value: 'company_agreement', label: 'Accord de société' },
  { value: 'donation', label: 'Donation' },
]

export default function ContractListPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user, token } = useAuth()
  
  const [contracts, setContracts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('all')
  
  const [formData, setFormData] = useState({
    contract_type: 'sale',
    client_id: '',
    second_party_name: '',
    second_party_name_ar: '',
    second_party_national_id: '',
    property_description: '',
    property_description_ar: '',
    amount: '',
    stamp_duty: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      contract_type: 'sale', client_id: '', second_party_name: '', second_party_name_ar: '',
      second_party_national_id: '', property_description: '', property_description_ar: '',
      amount: '', stamp_duty: '', notes: ''
    })
  }

  const fetchContracts = async (query = '') => {
    setIsLoading(true)
    try {
      const params: any = {}
      if (query) params.search = query
      if (activeTab !== 'all') params.status = activeTab
      const data = await window.api.getContracts(params)
      setContracts(data || [])
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const data = await window.api.getClients()
      setClients(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchContracts()
    fetchClients()
  }, [activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const session = { user, token }
    
    try {
      await window.api.createContract(formData, session)
      showToast({ type: 'success', message: 'Contrat créé avec succès' })
      setIsModalOpen(false)
      resetForm()
      fetchContracts()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTransition = async (id: number, status: string) => {
    const session = { user, token }
    try {
      await window.api.transitionContract(id, status, session)
      showToast({ type: 'success', message: `Contrat mis à jour: ${status}` })
      fetchContracts()
      if (selectedContract?.id === id) {
        const updated = await window.api.getContract(id)
        setSelectedContract(updated)
      }
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const handleGeneratePdf = async (id: number) => {
    const session = { user, token }
    try {
      await window.api.generateContractPdf(id, session)
      showToast({ type: 'success', message: 'PDF généré avec succès' })
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const session = { user, token }
    try {
      await window.api.deleteContract(deleteTarget.id, session)
      showToast({ type: 'success', message: 'Contrat supprimé' })
      setDeleteTarget(null)
      fetchContracts()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const statusTabs = [
    { id: 'all', label: 'Tous' },
    { id: 'draft', label: 'Brouillon' },
    { id: 'review', label: 'En révision' },
    { id: 'approved', label: 'Approuvé' },
    { id: 'finalized', label: 'Finalisé' },
  ]

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.national_id} - ${c.full_name}` }))

  const columns = [
    { key: 'contract_number', title: t('contracts.number'), sortable: true, className: 'font-mono text-sm' },
    { 
      key: 'contract_type', 
      title: t('contracts.type'),
      render: (c: any) => (
        <span className="capitalize">{CONTRACT_TYPES.find(ct => ct.value === c.contract_type)?.label || c.contract_type}</span>
      )
    },
    {
      key: 'client_name',
      title: 'Client',
      render: (c: any) => c.client_name || '—'
    },
    {
      key: 'amount',
      title: t('contracts.amount'),
      render: (c: any) => c.amount ? `${parseFloat(c.amount).toLocaleString()} TND` : '—'
    },
    { 
      key: 'status', 
      title: t('common.status'),
      render: (c: any) => <StatusBadge status={c.status} type="contract" />
    },
    { 
      key: 'created_at', 
      title: t('common.createdAt'),
      sortable: true,
      render: (c: any) => new Date(c.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      title: t('common.actions'),
      render: (c: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedContract(c); setIsDetailModalOpen(true) }}>
            {t('common.view')}
          </Button>
          {c.status === 'draft' && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleTransition(c.id, 'review') }}>
              Soumettre
            </Button>
          )}
          {c.status === 'review' && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleTransition(c.id, 'approved') }}>
              Approuver
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c) }}>
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('contracts.title')}</h1>
          <p className="text-muted-foreground mt-1">Gérez vos contrats et actes notariés / إدارة العقود والصكوك</p>
        </div>
        <PermissionGate permission="contracts.create">
          <Button 
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            leftIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>}
          >
            {t('contracts.new')}
          </Button>
        </PermissionGate>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <SearchInput 
              onSearch={fetchContracts} 
              placeholder={t('common.search')}
              className="w-full max-w-sm"
            />
            <div className="text-sm text-muted-foreground self-center">
              {contracts.length} contrat{contracts.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Tabs 
            tabs={statusTabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={contracts} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {/* Create Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title={t('contracts.new')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t('contracts.type')}
              options={CONTRACT_TYPES}
              value={formData.contract_type}
              onChange={e => setFormData({...formData, contract_type: e.target.value})}
              required
            />
            <Select
              label="Client (partie 1)"
              options={[{ value: '', label: '— Sélectionner —' }, ...clientOptions]}
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value})}
              required
            />
            <Input
              label="Partie 2 — Nom"
              value={formData.second_party_name}
              onChange={e => setFormData({...formData, second_party_name: e.target.value})}
            />
            <Input
              label="الطرف الثاني"
              value={formData.second_party_name_ar}
              onChange={e => setFormData({...formData, second_party_name_ar: e.target.value})}
              className="text-right font-arabic"
              dir="rtl"
            />
            <Input
              label="CIN Partie 2"
              value={formData.second_party_national_id}
              onChange={e => setFormData({...formData, second_party_national_id: e.target.value})}
            />
            <Input
              label={t('contracts.amount')}
              type="number"
              step="0.001"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
            />
            <Input
              label="Droit de timbre (TND)"
              type="number"
              step="0.001"
              value={formData.stamp_duty}
              onChange={e => setFormData({...formData, stamp_duty: e.target.value})}
            />
          </div>
          <Textarea
            label="Description du bien"
            value={formData.property_description}
            onChange={e => setFormData({...formData, property_description: e.target.value})}
          />
          <Textarea
            label="وصف العقار"
            value={formData.property_description_ar}
            onChange={e => setFormData({...formData, property_description_ar: e.target.value})}
            className="text-right font-arabic"
            dir="rtl"
          />
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); resetForm() }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {t('contracts.new')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contract Detail View */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedContract(null) }}
        title={`Contrat ${selectedContract?.contract_number || ''}`}
        size="lg"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{CONTRACT_TYPES.find(ct => ct.value === selectedContract.contract_type)?.label || selectedContract.contract_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Statut:</span>
                <div className="mt-1"><StatusBadge status={selectedContract.status} type="contract" /></div>
              </div>
              <div>
                <span className="text-muted-foreground">Montant:</span>
                <p className="font-medium">{selectedContract.amount ? `${parseFloat(selectedContract.amount).toLocaleString()} TND` : '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Droit de timbre:</span>
                <p className="font-medium">{selectedContract.stamp_duty ? `${parseFloat(selectedContract.stamp_duty).toLocaleString()} TND` : '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date de création:</span>
                <p className="font-medium">{new Date(selectedContract.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-border">
              {selectedContract.status === 'draft' && (
                <Button size="sm" onClick={() => handleTransition(selectedContract.id, 'review')}>Soumettre en révision</Button>
              )}
              {selectedContract.status === 'review' && (
                <Button size="sm" onClick={() => handleTransition(selectedContract.id, 'approved')}>Approuver</Button>
              )}
              {selectedContract.status === 'approved' && (
                <Button size="sm" onClick={() => handleTransition(selectedContract.id, 'finalized')}>Finaliser</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handleGeneratePdf(selectedContract.id)}>
                Générer PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le contrat"
        message={`Êtes-vous sûr de vouloir supprimer le contrat "${deleteTarget?.contract_number}" ?`}
      />
    </div>
  )
}
