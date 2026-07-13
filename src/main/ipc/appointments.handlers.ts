// ============================================================
// APPOINTMENTS IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import {
  findAllAppointments,
  findAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  findAppointmentsByDateRange
} from '../database/repositories/appointments'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'

export function registerAppointmentsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APPOINTMENTS_LIST, async (_, params) => {
    return findAllAppointments(params)
  })

  ipcMain.handle(IPC_CHANNELS.APPOINTMENTS_GET, async (_, id: number) => {
    return findAppointmentById(id)
  })

  ipcMain.handle(IPC_CHANNELS.APPOINTMENTS_CREATE, async (_, data, sessionData) => {
    const appointment = createAppointment({ ...data, created_by: sessionData?.user?.id })
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.CREATE,
        entity_type: AuditEntityType.APPOINTMENT,
        entity_id: appointment.id,
        description: `Created appointment: ${appointment.title} on ${appointment.appointment_date}`,
        session_id: sessionData.token
      })
    }
    
    return appointment
  })

  ipcMain.handle(IPC_CHANNELS.APPOINTMENTS_UPDATE, async (_, id: number, data, sessionData) => {
    const appointment = updateAppointment(id, data)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.UPDATE,
        entity_type: AuditEntityType.APPOINTMENT,
        entity_id: appointment.id,
        description: `Updated appointment: ${appointment.title}`,
        session_id: sessionData.token
      })
    }
    
    return appointment
  })

  ipcMain.handle(IPC_CHANNELS.APPOINTMENTS_DELETE, async (_, id: number, sessionData) => {
    const appointment = findAppointmentById(id)
    if (!appointment) return false
    
    deleteAppointment(id)
    
    if (sessionData?.user) {
      logAction({
        user_id: sessionData.user.id,
        username: sessionData.user.username,
        action_type: AuditActionType.DELETE,
        entity_type: AuditEntityType.APPOINTMENT,
        entity_id: id,
        description: `Deleted appointment: ${appointment.title}`,
        session_id: sessionData.token
      })
    }
    
    return true
  })

  ipcMain.handle(IPC_CHANNELS.APPOINTMENTS_CALENDAR, async (_, startDate: string, endDate: string) => {
    return findAppointmentsByDateRange(startDate, endDate)
  })
}
