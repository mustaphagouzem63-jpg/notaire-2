// ============================================================
// ENTITY INTERFACES — Shared between main process and renderer
// ============================================================

import {
  UserRole, ContractStatus, ContractType, PartyRole,
  DocumentCategory, AppointmentStatus, AuditActionType,
  AuditEntityType, NotificationType, ClientStatus, Theme, Language
} from './enums'

// ── Users ─────────────────────────────────────────────────────
export interface IUser {
  id: number
  username: string
  full_name: string
  role: UserRole
  theme_preference: Theme
  language_preference: Language
  is_active: boolean
  force_password_change: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

// User without sensitive fields (for renderer)
export type IUserPublic = Omit<IUser, 'force_password_change'>

// ── Clients ───────────────────────────────────────────────────
export interface IClient {
  id: number
  full_name: string
  full_name_ar: string | null
  national_id: string
  phone: string | null
  address: string | null
  address_ar: string | null
  notes: string | null
  status: ClientStatus
  is_deleted: boolean
  created_by: number | null
  created_at: string
  updated_at: string
}

// ── Contracts ─────────────────────────────────────────────────
export interface IContract {
  id: number
  contract_number: string
  contract_type: ContractType
  client_a_id: number
  client_b_id: number | null
  content_ar: string | null
  content_fr: string | null
  property_details: string | null
  pdf_path: string | null
  status: ContractStatus
  signed_date: string | null
  notary_fees: number
  government_tax: number
  stamp_duty: number
  signature_image_path: string | null
  stamp_image_path: string | null
  document_hash: string | null
  is_deleted: boolean
  created_by: number | null
  approved_by: number | null
  finalized_by: number | null
  created_at: string
  updated_at: string
}

// Contract with joined client names for list views
export interface IContractWithClients extends IContract {
  client_a_name: string
  client_b_name: string | null
}

// ── Contract Parties ──────────────────────────────────────────
export interface IContractParty {
  id: number
  contract_id: number
  client_id: number
  role: PartyRole
}

export interface IContractPartyWithClient extends IContractParty {
  client_name: string
  national_id: string
}

// ── Documents ─────────────────────────────────────────────────
export interface IDocument {
  id: number
  client_id: number | null
  contract_id: number | null
  file_name: string
  file_path: string
  document_category: DocumentCategory | null
  ocr_text: string | null
  mime_type: string | null
  file_size: number | null
  version: number
  is_current: boolean
  parent_document_id: number | null
  change_summary: string | null
  uploaded_by: number | null
  uploaded_at: string
}

// ── Appointments ──────────────────────────────────────────────
export interface IAppointment {
  id: number
  client_id: number | null
  contract_id: number | null
  title: string
  title_ar: string | null
  appointment_date: string
  start_time: string
  end_time: string | null
  duration_minutes: number
  status: AppointmentStatus
  location: string | null
  notes: string | null
  reminder_sent: boolean
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface IAppointmentWithClient extends IAppointment {
  client_name: string | null
  contract_number: string | null
}

// ── Audit Logs ────────────────────────────────────────────────
export interface IAuditLog {
  id: number
  user_id: number | null
  username: string
  action_type: AuditActionType
  entity_type: AuditEntityType
  entity_id: number | null
  old_value: string | null
  new_value: string | null
  description: string | null
  session_id: string | null
  timestamp: string
}

// ── Notifications ─────────────────────────────────────────────
export interface INotification {
  id: number
  user_id: number | null
  type: NotificationType
  title: string
  message: string
  entity_type: string | null
  entity_id: number | null
  is_read: boolean
  created_at: string
}

// ── Office Settings ───────────────────────────────────────────
export interface IOfficeSetting {
  key: string
  value: string
  updated_at: string
}

// ── Contract Templates ────────────────────────────────────────
export interface IContractTemplate {
  id: number
  contract_type: ContractType
  version: number
  name_fr: string
  name_ar: string
  content_fr: string
  content_ar: string
  is_active: boolean
  created_by: number | null
  created_at: string
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  lastId: number | null
}

export interface PaginationParams {
  limit: number
  afterId?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string | number | boolean>
}

// ── Search Results ────────────────────────────────────────────
export interface ISearchResult {
  type: 'client' | 'contract' | 'document' | 'appointment'
  id: number
  title: string
  subtitle: string
  highlight: string
  relevance: number
}

// ── Dashboard Stats ───────────────────────────────────────────
export interface IDashboardStats {
  totalClients: number
  totalContracts: number
  contractsToday: number
  contractsThisMonth: number
  upcomingAppointments: number
  contractsByType: { type: string; count: number }[]
  contractsByStatus: { status: string; count: number }[]
  recentActivity: IAuditLog[]
  monthlyTrend: { month: string; count: number }[]
}

// ── Auth ──────────────────────────────────────────────────────
export interface IAuthSession {
  user: IUser
  token: string
  expiresAt: string
}

export interface ILoginResult {
  success: boolean
  session?: IAuthSession
  error?: string
  forcePasswordChange?: boolean
}
