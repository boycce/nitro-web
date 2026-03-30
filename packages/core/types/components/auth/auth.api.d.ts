export function resetInstructions(req: any, res: any): Promise<void>;
export function inviteInstructions(req: any, res: any): Promise<void>;
export function resetConfirm(req: any, res: any): Promise<void>;
export function inviteConfirm(req: any, res: any): Promise<void>;
export function userFindFromProvider(query: any, passwordToCheck: any, ...args: any[]): Promise<any>;
export function userSigninGetStore(user: any, isDesktop: any): Promise<any>;
export function getStore(user: any): Promise<{
    user: any;
}>;
/**
 * Creates a new user and company (if multi tenant and `user.company` is not an id)
 * @param {object} userData - user data
 * @param {string} [userData.password] - optional
 * @param {string} [userData.password2] - optional, to confirm the password
 * @param {string} [userData.company] - if multi tenant and `user.company` is not an id, create a new company
 * @param {boolean} [skipSendEmail=false] - whether to skip sending the welcome email
 * @returns {Promise<object>} - the created user
 */
export function userCreate({ password, password2, company, ...userDataProp }: {
    password?: string;
    password2?: string;
    company?: string;
}, skipSendEmail?: boolean): Promise<object>;
export function passwordValidate(password: string, password2: any): Promise<void>;
export function tokenCreate(modelName: any, id: any): Promise<any>;
export function tokenParse(token: any, modelName: any, maxAgeMs?: number): any;
export function tokenConfirmForReset(req: any): Promise<any>;
export function tokenConfirmForSingleTenant(req: any, isReset: any): Promise<any>;
export function tokenConfirmForMultiTenant(req: any): Promise<any>;
/**
 * Creates and sends a reset or invite token to a user or company
 * @param {object} options
 * @param {'reset' | 'invite' | 'companyInvite'} options.type - token type (default: 'reset')
 * @param {string} options._id - user or company id
 * @param {string} options.email - recipient email
 * @param {string} options.firstName - recipient first name
 * @param {function} [options.beforeUpdate] - runs before updating the model with the token, return null to skip update
 * @param {function} [options.beforeSendEmail] - runs before sending the email, receives (options, token)
 * @returns {Promise<{token: string, mailgunPromise: Promise<unknown>}>}
 */
export function tokenSend({ type, _id, email, firstName, beforeUpdate, beforeSendEmail }: {
    type: "reset" | "invite" | "companyInvite";
    _id: string;
    email: string;
    firstName: string;
    beforeUpdate?: Function;
    beforeSendEmail?: Function;
}): Promise<{
    token: string;
    mailgunPromise: Promise<unknown>;
}>;
export const routes: {
    'get     /api/store': (typeof store)[];
    'get     /api/signout': (typeof signout)[];
    'post    /api/signin': (typeof signin)[];
    'post    /api/signup': (typeof signup)[];
    'post    /api/reset-instructions': (typeof resetInstructions)[];
    'post    /api/reset-confirm': (typeof resetConfirm)[];
    'post    /api/invite-instructions': (typeof inviteInstructions)[];
    'post    /api/invite-confirm': (typeof inviteConfirm)[];
    'delete  /api/account/:uid': (typeof remove)[];
    setup: typeof setup;
};
declare function store(req: any, res: any): Promise<void>;
declare function signout(req: any, res: any): void;
declare function signin(req: any, res: any): any;
declare function signup(req: any, res: any): Promise<void>;
declare function remove(req: any, res: any): Promise<void>;
declare function setup(middleware: any, _config: any, helpers?: {}): void;
export {};
//# sourceMappingURL=auth.api.d.ts.map