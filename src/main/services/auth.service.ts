// ============================================================
// AUTH SERVICE — Session management and authentication
// ============================================================

import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { findUserByUsername, updateLastLogin, updatePassword, findUserById } from '../database/repositories/users'
import { logAction } from '../database/repositories/audit'
import { AuditActionType, AuditEntityType } from '@shared/types/enums'
import type { IAuthSession, ILoginResult, IUser } from '@shared/types/entities'

// In-memory session store
// Key: session token, Value: User details + expiry
const activeSessions = new Map<string, IAuthSession>()

// Session duration: 12 hours
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000

export async function login(username: string, password: string): Promise<ILoginResult> {
  const user = findUserByUsername(username)
  
  if (!user || !user.is_active) {
    return { success: false, error: 'Invalid credentials or inactive account' }
  }
  
  const isValid = await bcrypt.compare(password, user.password_hash)
  
  if (!isValid) {
    return { success: false, error: 'Invalid credentials' }
  }
  
  if (user.force_password_change) {
    return { 
      success: true, 
      forcePasswordChange: true,
      session: createSession(user)
    }
  }
  
  updateLastLogin(user.id)
  
  const session = createSession(user)
  
  logAction({
    user_id: user.id,
    username: user.username,
    action_type: AuditActionType.LOGIN,
    entity_type: AuditEntityType.USER,
    entity_id: user.id,
    session_id: session.token
  })
  
  return { success: true, session }
}

export function logout(token: string): boolean {
  const session = activeSessions.get(token)
  
  if (session) {
    logAction({
      user_id: session.user.id,
      username: session.user.username,
      action_type: AuditActionType.LOGOUT,
      entity_type: AuditEntityType.USER,
      entity_id: session.user.id,
      session_id: token
    })
    
    activeSessions.delete(token)
    return true
  }
  
  return false
}

export function getSession(token: string): IAuthSession | null {
  const session = activeSessions.get(token)
  
  if (!session) return null
  
  // Check if expired
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    activeSessions.delete(token)
    return null
  }
  
  // Refresh user data to get latest permissions/roles
  const updatedUser = findUserById(session.user.id)
  if (!updatedUser || !updatedUser.is_active) {
    activeSessions.delete(token)
    return null
  }
  
  session.user = updatedUser
  return session
}

export async function changePassword(token: string, newPassword: string): Promise<boolean> {
  const session = getSession(token)
  
  if (!session) return false
  
  const hash = await bcrypt.hash(newPassword, 10)
  updatePassword(session.user.id, hash)
  
  logAction({
    user_id: session.user.id,
    username: session.user.username,
    action_type: AuditActionType.UPDATE,
    entity_type: AuditEntityType.USER,
    entity_id: session.user.id,
    description: 'Password changed',
    session_id: token
  })
  
  return true
}

function createSession(user: IUser): IAuthSession {
  // Strip password hash if it's there
  const userPublic = { ...user }
  if ('password_hash' in userPublic) {
    delete (userPublic as any).password_hash
  }
  
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()
  
  const session: IAuthSession = {
    user: userPublic as IUser,
    token,
    expiresAt
  }
  
  activeSessions.set(token, session)
  
  return session
}
