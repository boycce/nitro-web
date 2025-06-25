import type { Config, Errors, MessageObject, MonasteryImage, Store as NitroStore } from 'nitro-web/types'
export type { Config, Errors, MessageObject }

/* ---- Enums -------------------------------- */

export type Role = 'admin' | 'user'

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

export type User = BaseEntity & {
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryImage
  type: 'user' | 'admin'
}
