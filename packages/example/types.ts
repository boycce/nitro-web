import type { Address, Config, Errors, MessageObject, MonasteryFile, SharedCollection, Store as NitroStore } from 'nitro-web/types'
import { UserRole, UserStatus, CompanyStatus, Currency } from './server/constants'
export type { Config, Errors, MessageObject, SharedCollection }

/* ---- Common ------------------------------- */

export type Date = number
export type Id = string
export type StateError = Error;
export interface StateErrors { errors: Errors; }
export type BaseEntity = {
  _id?: Id;
  createdAt: number;
  updatedAt: number;
}

/* ---- Store & User ------------------------- */

export type Store = NitroStore & {
  user: User
  sharedCollections: { roleOptions: SharedCollection<Role> } // cached with useFetchSharedCol()
}

/* ---- Employees (mock data example) -------- */

export type Role = { _id: string, name: string }
export type Employee = { _id: string, name: string, email: string, role: string, startedAt: number }

export type Company = BaseEntity & {
  business: {
    address?: Address
    currency: Currency
    name: string
    number?: string
    phone?: string
    website?: string
  }
  isDeleted?: boolean
  isMock?: boolean
  status: CompanyStatus
  users: {
    _id: Id
    role: UserRole
    status: UserStatus
  }[]
  invites: {
    email: string
    firstName: string
    role: UserRole
    inviteToken: string
  }[]
}

export type User = BaseEntity & {
  company: Company
  email?: string
  isAdmin?: boolean
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryFile
  // If single tenancy application
  // isInvited?: boolean
}
