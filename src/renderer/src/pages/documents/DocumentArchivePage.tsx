import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { SearchInput } from '../../components/ui/SearchInput'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Tabs } from '../../components/ui/Tabs'

export default function DocumentArchivePage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { user, token } = useAuth()
  
  const [documents, setDocuments] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [uploadData, setUploadData] = useState({
    file_name: '',
    document_category: 'other',
    client_id: '',
    contract_id: ''
  })
  const [isUploading, setIsUploading] = useState(false)

  const fetchDocuments = async (query = '') => {
    setIsLoading(true)
    try {
      const params: any = {}
      if (query) params.search = query
      if (activeCategory !== 'all') params.category = activeCategory
      const data = await window.api.getDocuments(params)
      setDocuments(data || [])
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
    fetchDocuments()
    fetchClients()
  }, [activeCategory])

  const handleFileSelect = async () => {
    try {
      const result = await window.api.openFileDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Documents', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const fileName = filePath.split(/[\\/]/).pop() || 'document'
        setUploadData(prev => ({ ...prev, file_name: fileName }))
        // Store file path for reading later
        setSelectedFile({ name: fileName, path: filePath } as any)
      }
    } catch (error: any) {
      showToast({ type: 'error', message: 'Erreur de sélection du fichier' })
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      showToast({ type: 'error', message: 'Veuillez sélectionner un fichier' })
      return
    }
    
    setIsUploading(true)
    const session = { user, token }
    
    try {
      // Read file from disk using the file path
      const filePath = (selectedFile as any).path
      // We'll pass the file metadata and let the backend handle the file copy
      await window.api.uploadDocument({
        ...uploadData,
        file_name: uploadData.file_name || selectedFile.name,
        source_path: filePath
      }, new ArrayBuffer(0), session)
      
      showToast({ type: 'success', message: 'Document importé avec succès' })
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      setUploadData({ file_name: '', document_category: 'other', client_id: '', contract_id: '' })
      fetchDocuments()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur lors de l\'importation' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const session = { user, token }
    try {
      await window.api.deleteDocument(deleteTarget.id, session)
      showToast({ type: 'success', message: 'Document supprimé' })
      setDeleteTarget(null)
      fetchDocuments()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const handleOpenDocument = async (doc: any) => {
    try {
      await window.api.openDocument(doc.id)
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Impossible d\'ouvrir le fichier' })
    }
  }

  const categoryTabs = [
    { id: 'all', label: 'Tous' },
    { id: 'identity', label: t('documents.cat_id') },
    { id: 'property_title', label: t('documents.cat_property') },
    { id: 'tax_certificate', label: t('documents.cat_contract') },
    { id: 'other', label: t('documents.cat_other') },
  ]

  const columns = [
    { key: 'file_name', title: t('documents.fileName'), sortable: true },
    { 
      key: 'document_category', 
      title: t('documents.category'),
      render: (doc: any) => (
        <Badge variant="secondary">
          {doc.document_category ? (t(`documents.cat_${doc.document_category}`, doc.document_category) as string) : '—'}
        </Badge>
      )
    },
    {
      key: 'file_size',
      title: 'Taille',
      render: (doc: any) => {
        if (!doc.file_size) return '—'
        const kb = doc.file_size / 1024
        if (kb < 1024) return `${kb.toFixed(1)} KB`
        return `${(kb / 1024).toFixed(1)} MB`
      }
    },
    { 
      key: 'uploaded_at', 
      title: t('common.createdAt'),
      render: (doc: any) => new Date(doc.uploaded_at).toLocaleString()
    },
    { 
      key: 'actions', 
      title: t('common.actions'),
      render: (doc: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenDocument(doc) }}>
            {t('documents.download')}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc) }}>
            {t('common.delete')}
          </Button>
        </div>
      )
    }
  ]

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.national_id} - ${c.full_name}` }))

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('documents.title')}</h1>
          <p className="text-muted-foreground mt-1">Gérez vos archives numériques / إدارة أرشيفك الرقمي</p>
        </div>
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>}
        >
          {t('documents.upload')}
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <SearchInput 
              onSearch={fetchDocuments} 
              placeholder={t('common.search')}
              className="w-full max-w-sm"
            />
          </div>
          <Tabs 
            tabs={categoryTabs} 
            activeTab={activeCategory} 
            onTabChange={setActiveCategory} 
          />
        </div>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={documents} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); setSelectedFile(null) }}
        title={t('documents.upload')}
        size="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fichier</label>
              <div 
                onClick={handleFileSelect}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
                    <span className="font-medium text-foreground">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <p className="text-sm">Cliquez pour sélectionner un fichier</p>
                  </div>
                )}
              </div>
            </div>

            <Select
              label={t('documents.category')}
              options={[
                { value: 'identity', label: t('documents.cat_id') },
                { value: 'property_title', label: t('documents.cat_property') },
                { value: 'tax_certificate', label: t('documents.cat_contract') },
                { value: 'power_of_attorney', label: 'Procuration' },
                { value: 'company_registration', label: 'Registre de commerce' },
                { value: 'other', label: t('documents.cat_other') },
              ]}
              value={uploadData.document_category}
              onChange={e => setUploadData({...uploadData, document_category: e.target.value})}
            />

            <Select
              label="Client associé (optionnel)"
              options={[{ value: '', label: '— Aucun —' }, ...clientOptions]}
              value={uploadData.client_id}
              onChange={e => setUploadData({...uploadData, client_id: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null) }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={isUploading} disabled={!selectedFile}>
              {t('documents.upload')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.file_name}" ?`}
      />
    </div>
  )
}
