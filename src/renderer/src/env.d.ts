/// <reference types="vite/client" />

interface Window {
  api: {
    // Auth
    login: (credentials: any) => Promise<any>
    logout: (token: string) => Promise<boolean>
    getSession: (token: string) => Promise<any>
    changePassword: (data: any) => Promise<boolean>
    
    // Clients
    getClients: (params?: any) => Promise<any>
    getClient: (id: number) => Promise<any>
    createClient: (data: any, session?: any) => Promise<any>
    updateClient: (id: number, data: any, session?: any) => Promise<any>
    deleteClient: (id: number, session?: any) => Promise<boolean>
    searchClients: (query: string) => Promise<any>
    
    // Contracts
    getContracts: (params?: any) => Promise<any>
    getContract: (id: number) => Promise<any>
    generateContractNumber: () => Promise<string>
    createContract: (data: any, session?: any) => Promise<any>
    updateContract: (id: number, data: any, session?: any) => Promise<any>
    transitionContract: (id: number, status: string, session?: any) => Promise<any>
    deleteContract: (id: number, session?: any) => Promise<boolean>
    generateContractPdf: (id: number, session?: any) => Promise<any>
    searchContracts: (query: string) => Promise<any>
    
    // Documents
    getDocuments: (params?: any) => Promise<any>
    getDocument: (id: number) => Promise<any>
    uploadDocument: (data: any, fileBuffer: ArrayBuffer, session?: any) => Promise<any>
    deleteDocument: (id: number, session?: any) => Promise<boolean>
    getDocumentVersions: (id: number) => Promise<any>
    restoreDocumentVersion: (id: number, session?: any) => Promise<any>
    openDocument: (id: number) => Promise<boolean>
    runOCR: (id: number) => Promise<any>
    
    // Appointments
    getAppointments: (params?: any) => Promise<any>
    getAppointment: (id: number) => Promise<any>
    createAppointment: (data: any, session?: any) => Promise<any>
    updateAppointment: (id: number, data: any, session?: any) => Promise<any>
    deleteAppointment: (id: number, session?: any) => Promise<boolean>
    getCalendar: (start: string, end: string) => Promise<any>
    
    // Users
    getUsers: () => Promise<any>
    getUser: (id: number) => Promise<any>
    createUser: (data: any, session?: any) => Promise<any>
    updateUser: (id: number, data: any, session?: any) => Promise<any>
    deleteUser: (id: number, session?: any) => Promise<boolean>
    resetPassword: (id: number, newPassword: string, session?: any) => Promise<boolean>
    
    // Audit
    getAuditLogs: (params?: any) => Promise<any>
    exportAuditLogs: (format: string, session?: any) => Promise<string>
    
    // Notifications
    getNotifications: (userId: number) => Promise<any>
    getUnreadCount: (userId: number) => Promise<number>
    markNotificationRead: (id: number, userId: number) => Promise<boolean>
    markAllRead: (userId: number) => Promise<boolean>
    deleteNotification: (id: number, userId: number) => Promise<boolean>
    
    // Settings
    getSettings: () => Promise<any>
    getSetting: (key: string) => Promise<any>
    updateSettings: (settings: any, session?: any) => Promise<boolean>
    
    // Backup
    getBackups: () => Promise<any>
    createBackup: (session?: any) => Promise<any>
    restoreBackup: (path: string, session?: any) => Promise<boolean>
    deleteBackup: (name: string, session?: any) => Promise<boolean>
    
    // Templates
    getTemplates: () => Promise<any>
    getTemplate: (id: number) => Promise<any>
    getTemplateByType: (type: string) => Promise<any>
    updateTemplate: (id: number, data: any, session?: any) => Promise<any>
    
    // Dashboard & Search
    getDashboardStats: () => Promise<any>
    getRecentActivity: () => Promise<any>
    getDashboardCharts: () => Promise<any>
    globalSearch: (query: string, session?: any) => Promise<any>
    
    // Dialogs
    openFileDialog: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
    showError: (title: string, content: string) => Promise<void>
    showMessage: (options: any) => Promise<any>
    saveFile: (defaultPath: string) => Promise<{ canceled: boolean; filePath: string | undefined }>
    copyFileTo: (source: string, dest: string) => Promise<boolean>
    
    // Platform
    platform: string
  }
}
