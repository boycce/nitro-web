import type { Errors, Store as NitroStore, MonasteryImage } from 'nitro-web/types'
export type { Config, Errors, MessageObject } from 'nitro-web/types'

/* ---- Common ------------------------------- */

export type Id = string
export type StateErrors = { errors?: Errors; }
export type BaseEntity = {
  _id: Id;
  createdAt: number;
  updatedAt: number;
}

/* ---- Enums -------------------------------- */

// ...

/* ---- User & Store ------------------------- */

export type User = BaseEntity & {
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryImage
  type: 'user' | 'admin'
}
export type Store = NitroStore & {
  user?: User
}
