import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { Badge } from '../../components/ui/Badge'

export default function AuditLogPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { token, user } = useAuth()
  
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  
  const [filters, setFilters] = useState({
    action_type: '',
    entity_type: '',
    date_from: '',
    date_to: ''
  })

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const params: any = {}
      if (filters.action_type) params.action_type = filters.action_type
      if (filters.entity_type) params.entity_type = filters.entity_type
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      
      const data = await window.api.getAuditLogs(params)
      setLogs(data || [])
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleFilter = () => {
    fetchLogs()
  }

  const handleClearFilters = () => {
    setFilters({ action_type: '', entity_type: '', date_from: '', date_to: '' })
    fetchLogs()
  }

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    const session = { user, token }
    try {
      const filePath = await window.api.exportAuditLogs(format, session)
      showToast({ type: 'success', message: `Exporté vers: ${filePath}` })
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Erreur d\'exportation' })
    } finally {
      setIsExporting(false)
    }
  }

  const actionColors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'primary',
    DELETE: 'destructive',
    APPROVE: 'success',
    FINALIZE: 'primary',
    LOGIN: 'secondary',
    LOGOUT: 'secondary',
    EXPORT: 'warning',
    RESTORE: 'warning',
    CANCEL: 'destructive'
  }

  const columns = [
    { 
      key: 'timestamp', 
      title: 'Date/Heure', 
      sortable: true,
      render: (log: any) => (
        <span className="text-sm tabular-nums">{new Date(log.timestamp).toLocaleString()}</span>
      )
    },
    { key: 'username', title: 'Utilisateur' },
    { 
      key: 'action_type', 
      title: 'Action',
      render: (log: any) => (
        <Badge variant={actionColors[log.action_type] as any || 'outline'} className="capitalize">
          {log.action_type}
        </Badge>
      )
    },
    { 
      key: 'entity_type', 
      title: 'Entité', 
      render: (log: any) => (
        <span className="capitalize">{log.entity_type}</span>
      )
    },
    { key: 'description', title: 'Description', className: 'max-w-xs truncate' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('nav.audit')}</h1>
          <p className="text-muted-foreground mt-1">Journal de sécurité et traçabilité des actions / سجل الأمان وتتبع الإجراءات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} isLoading={isExporting}>
            Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')} isLoading={isExporting}>
            Exporter JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              label="Type d'action"
              options={[
                { value: '', label: 'Toutes les actions' },
                { value: 'CREATE', label: 'Création' },
                { value: 'UPDATE', label: 'Modification' },
                { value: 'DELETE', label: 'Suppression' },
                { value: 'APPROVE', label: 'Approbation' },
                { value: 'FINALIZE', label: 'Finalisation' },
                { value: 'LOGIN', label: 'Connexion' },
                { value: 'LOGOUT', label: 'Déconnexion' },
                { value: 'EXPORT', label: 'Exportation' },
                { value: 'RESTORE', label: 'Restauration' },
              ]}
              value={filters.action_type}
              onChange={e => setFilters({...filters, action_type: e.target.value})}
            />
            <Select
              label="Type d'entité"
              options={[
                { value: '', label: 'Toutes les entités' },
                { value: 'user', label: 'Utilisateur' },
                { value: 'client', label: 'Client' },
                { value: 'contract', label: 'Contrat' },
                { value: 'document', label: 'Document' },
                { value: 'appointment', label: 'Rendez-vous' },
                { value: 'backup', label: 'Sauvegarde' },
                { value: 'settings', label: 'Paramètres' },
              ]}
              value={filters.entity_type}
              onChange={e => setFilters({...filters, entity_type: e.target.value})}
            />
            <Input
              label="Date début"
              type="date"
              value={filters.date_from}
              onChange={e => setFilters({...filters, date_from: e.target.value})}
            />
            <Input
              label="Date fin"
              type="date"
              value={filters.date_to}
              onChange={e => setFilters({...filters, date_to: e.target.value})}
            />
            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                Filtrer
              </Button>
              <Button variant="ghost" onClick={handleClearFilters}>
                Réinit.
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={logs} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
