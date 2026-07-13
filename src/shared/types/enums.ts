// ============================================================
// ENUMS — Single source of truth for all domain enumerations
// ============================================================

export enum UserRole {
  ADMIN = 'admin',
  NOTARY = 'notary',
  CLERK = 'clerk',
  ASSISTANT = 'assistant',
  AUDITOR = 'auditor'
}

export enum ContractStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled'
}

export enum ContractType {
  SALE = 'sale',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  COMPANY_AGREEMENT = 'company_agreement',
  DONATION = 'donation'
}

export enum PartyRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  GRANTOR = 'grantor',
  GRANTEE = 'grantee',
  DONOR = 'donor',
  DONEE = 'donee',
  PARTNER = 'partner',
  REPRESENTATIVE = 'representative',
  WITNESS = 'witness'
}

export enum DocumentCategory {
  IDENTITY = 'identity',
  PROPERTY_TITLE = 'property_title',
  TAX_CERTIFICATE = 'tax_certificate',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  COMPANY_REGISTRATION = 'company_registration',
  OTHER = 'other'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  FINALIZE = 'FINALIZE',
  ARCHIVE = 'ARCHIVE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  RESTORE = 'RESTORE',
  CANCEL = 'CANCEL'
}

export enum AuditEntityType {
  USER = 'user',
  CLIENT = 'client',
  CONTRACT = 'contract',
  DOCUMENT = 'document',
  APPOINTMENT = 'appointment',
  BACKUP = 'backup',
  SETTINGS = 'settings',
  TEMPLATE = 'template',
  SYSTEM = 'system'
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  CONTRACT_STATUS = 'contract_status',
  SYSTEM_ALERT = 'system_alert',
  BACKUP_COMPLETED = 'backup_completed',
  DOCUMENT_UPLOADED = 'document_uploaded'
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light'
}

export enum Language {
  ARABIC = 'ar',
  FRENCH = 'fr'
}

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}
