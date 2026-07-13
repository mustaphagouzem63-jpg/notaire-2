// ============================================================
// DASHBOARD IPC HANDLERS
// ============================================================

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc'
import { countClients } from '../database/repositories/clients'
import { countContracts, countContractsToday, countContractsThisMonth, getContractsByType, getContractsByStatus, getMonthlyTrend } from '../database/repositories/contracts'
import { countUpcomingAppointments } from '../database/repositories/appointments'
import { getRecentActivity } from '../database/repositories/audit'

export function registerDashboardHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.DASHBOARD_STATS, async () => {
    return {
      totalClients: countClients(),
      totalContracts: countContracts(),
      contractsToday: countContractsToday(),
      contractsThisMonth: countContractsThisMonth(),
      upcomingAppointments: countUpcomingAppointments()
    }
  })

  ipcMain.handle(IPC_CHANNELS.DASHBOARD_RECENT_ACTIVITY, async () => {
    return getRecentActivity(10)
  })
  
  // Note: These could be grouped into DASHBOARD_STATS or called separately
  // for charts
  ipcMain.handle(IPC_CHANNELS.DASHBOARD_CHARTS, async () => {
    return {
      byType: getContractsByType(),
      byStatus: getContractsByStatus(),
      monthlyTrend: getMonthlyTrend()
    }
  })
}
