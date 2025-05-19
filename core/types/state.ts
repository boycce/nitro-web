import { Role, Status } from '.'

export interface BaseEntity {
    id: string;
    createdAt: number;
    updatedAt: number;
}

export type StateError = {
    title: string, detail: string, inner?: {
        path: string;
        message: string;
    }[];
};

interface StateErrors {
    errors: StateError[];
}

export interface UserState extends BaseEntity, StateErrors {
    id: string;
    createdAt: number;
    updatedAt: number;
    status: Status;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    role: Role;
}