import type { Address, Config, Errors, MessageObject, MonasteryImage, Store as NitroStore } from 'nitro-web/types'
import { UserRole, UserStatus, CompanyStatus, Currency } from './server/constants'
export type { Config, Errors, MessageObject }

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
  user?: User
}

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
  avatar?: MonasteryImage
  // If single tenancy application
  // isInvited?: boolean
}
