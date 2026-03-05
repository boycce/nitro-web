import type { 
  Errors, MonasteryImage, Store as NitroStore,
} from 'nitro-web/types'

/* ---- Re-exports from nitro-web ------------ */

export type { ClientError, Errors, MessageObject } from 'nitro-web/types'

/* ---- Configs ------------------------------ */

export type { ConfigServer } from './server/config'
export type { ConfigClient } from './client/config'

/* ---- Enums -------------------------------- */

export type Role = 'admin' | 'user'

/* ---- Common ------------------------------- */

export type Date = number
export type Id = string
export type StateError = Error;
export interface StateErrors { errors: Errors; }
export type BaseEntity = {
  _id?: Id;
  createdAt?: number;
  updatedAt?: number;
}

/* ---- Store & User ------------------------- */

export type Store = NitroStore & {
  user?: User
}

export type User = BaseEntity & {
  isInvited?: boolean
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryImage
  type: 'user' | 'admin',
}
