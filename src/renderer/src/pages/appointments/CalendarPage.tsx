import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

export default function CalendarPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { token, user } = useAuth()
  
  const [appointments, setAppointments] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 30,
    client_id: '',
    contract_id: '',
    location: '',
    notes: '',
    status: 'scheduled'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      title: '', title_ar: '', appointment_date: '', start_time: '', end_time: '',
      duration_minutes: 30, client_id: '', contract_id: '', location: '', notes: '', status: 'scheduled'
    })
    setEditingAppointment(null)
  }

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const data = await window.api.getAppointments()
      setAppointments(data || [])
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
    fetchAppointments()
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const session = { user, token }
    
    try {
      if (editingAppointment) {
        await window.api.updateAppointment(editingAppointment.id, formData, session)
        showToast({ type: 'success', message: 'Rendez-vous mis à jour' })
      } else {
        await window.api.createAppointment(formData, session)
        showToast({ type: 'success', message: 'Rendez-vous créé avec succès' })
      }
      setIsModalOpen(false)
      resetForm()
      fetchAppointments()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment)
    setFormData({
      title: appointment.title || '',
      title_ar: appointment.title_ar || '',
      appointment_date: appointment.appointment_date || '',
      start_time: appointment.start_time || '',
      end_time: appointment.end_time || '',
      duration_minutes: appointment.duration_minutes || 30,
      client_id: appointment.client_id?.toString() || '',
      contract_id: appointment.contract_id?.toString() || '',
      location: appointment.location || '',
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const session = { user, token }
    try {
      await window.api.deleteAppointment(deleteTarget.id, session)
      showToast({ type: 'success', message: 'Rendez-vous supprimé' })
      setDeleteTarget(null)
      fetchAppointments()
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || t('common.error') })
    }
  }

  const columns = [
    { key: 'title', title: t('appointments.subject'), sortable: true },
    { 
      key: 'appointment_date', 
      title: t('appointments.date'),
      sortable: true,
      render: (appt: any) => new Date(appt.appointment_date).toLocaleDateString()
    },
    { 
      key: 'start_time', 
      title: t('appointments.time'),
      render: (appt: any) => appt.start_time
    },
    {
      key: 'client_name',
      title: t('appointments.client'),
      render: (appt: any) => appt.client_name || '—'
    },
    { 
      key: 'status', 
      title: t('common.status'),
      render: (appt: any) => <StatusBadge status={appt.status} type="appointment" />
    },
    {
      key: 'actions',
      title: t('common.actions'),
      render: (appt: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(appt) }}>
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(appt) }}>
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('appointments.title')}</h1>
          <p className="text-muted-foreground mt-1">Gérez vos rendez-vous et votre agenda / إدارة مواعيدك وجدولك</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          leftIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>}
        >
          {t('appointments.new')}
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={appointments} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title={editingAppointment ? 'Modifier le rendez-vous' : t('appointments.new')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('appointments.subject')}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
            <Input
              label={t('appointments.subjectAr')}
              value={formData.title_ar}
              onChange={e => setFormData({...formData, title_ar: e.target.value})}
              className="text-right font-arabic"
              dir="rtl"
            />
            <Input
              label={t('appointments.date')}
              type="date"
              value={formData.appointment_date}
              onChange={e => setFormData({...formData, appointment_date: e.target.value})}
              required
            />
            <Input
              label={t('appointments.time')}
              type="time"
              value={formData.start_time}
              onChange={e => setFormData({...formData, start_time: e.target.value})}
              required
            />
            <Input
              label="Heure de fin"
              type="time"
              value={formData.end_time}
              onChange={e => setFormData({...formData, end_time: e.target.value})}
            />
            <Input
              label="Durée (minutes)"
              type="number"
              min="5"
              step="5"
              value={formData.duration_minutes}
              onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 30})}
            />
            <Select
              label={t('appointments.client')}
              options={[{ value: '', label: '— Aucun —' }, ...clientOptions]}
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value})}
            />
            {editingAppointment && (
              <Select
                label={t('common.status')}
                options={[
                  { value: 'scheduled', label: 'Programmé' },
                  { value: 'confirmed', label: 'Confirmé' },
                  { value: 'completed', label: 'Terminé' },
                  { value: 'cancelled', label: 'Annulé' },
                  { value: 'no_show', label: 'Non présenté' },
                ]}
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              />
            )}
            <Input
              label="Lieu"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="md:col-span-2"
            />
            <Textarea
              label="Notes"
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
              {editingAppointment ? t('common.save') : t('appointments.new')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le rendez-vous"
        message={`Êtes-vous sûr de vouloir supprimer le rendez-vous "${deleteTarget?.title}" ?`}
      />
    </div>
  )
}
