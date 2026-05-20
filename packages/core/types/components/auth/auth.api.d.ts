export function resetInstructions(req: any, res: any): Promise<void>;
export function inviteInstructions(req: any, res: any): Promise<any>;
export function resendInstructions(req: any, res: any): Promise<any>;
export function resetConfirm(req: any, res: any): Promise<void>;
export function inviteConfirm(req: any, res: any): Promise<void>;
export function invitePreConfirm(req: any, res: any): Promise<void>;
export function updateMemberRole(req: any, res: any): Promise<void>;
export function removeMember(req: any, res: any): Promise<void>;
export function userFindFromProvider(query: any, passwordToCheck: any, ...args: any[]): Promise<any>;
export function userSigninGetStore(user: any, isDesktop: any): Promise<{
    jwt: string;
    user: any;
}>;
export function getStore(user: any, _req: any): Promise<{
    user: any;
}>;
/**
 * Creates a new user and company (if multi tenant and `user.company` is not an id)
 * @param {object} userData - user data
 * @param {string} [userData.password] - optional
 * @param {string} [userData.password2] - optional, to confirm the password
 * @param {string} [userData.company] - if multi tenant and `user.company` is not an id, create a new company
 * @param {string} [baseUrl] - baseUrl to use for the email
 * @param {boolean} [skipSendEmail=false] - whether to skip sending the welcome email
 * @returns {Promise<object>} - the created user
 */
export function userCreate({ password, password2, company, ...userDataProp }: {
    password?: string;
    password2?: string;
    company?: string;
}, baseUrl?: string, invite: any, skipSendEmail?: boolean): Promise<object>;
export function passwordValidate(password: string, password2: any): Promise<void>;
export function tokenCreate(modelName: any, id: any): Promise<any>;
export function tokenParse(token: any, modelName: any, maxAgeMs?: number): any;
export function addUserToCompany(companyId: any, userId: any, role: any, token: any, justValidate: any): Promise<any>;
export function tokenConfirmForReset(req: any): Promise<{
    jwt: string;
    user: any;
}>;
export function tokenConfirmForSingleTenant(req: any, isReset: any): Promise<{
    jwt: string;
    user: any;
}>;
export function tokenConfirmForMultiTenant(req: any): Promise<{
    jwt: string;
    user: any;
} | {
    isExistingUser: boolean;
    email: any;
} | {
    isExistingUser?: undefined;
    email?: undefined;
}>;
/**
 * Creates and sends a reset or invite token to a user or company
 * @param {object} options
 * @param {'reset' | 'invite' | 'companyInvite'} options.type - token type
 * @param {string} options.id - user or company id
 * @param {{
 *   email: string,
 *   firstName: string,
 *   [key: string]: any, // other fields to include in the invite row
 * }} options.payload
 * @param {function} [options.beforeUpdate] - runs before updating the model with the token, return null to skip update
 * @param {function} [options.beforeSendEmail] - runs before sending the email, receives (options, token)
 * @param {string} [options.baseUrl] - baseUrl to use for the email
 * @returns {Promise<{token: string, mailgunPromise: Promise<unknown>}>}
 */
export function tokenSend({ type, id, payload, beforeUpdate, beforeSendEmail, baseUrl, isResend }: {
    type: "reset" | "invite" | "companyInvite";
    id: string;
    payload: {
        email: string;
        firstName: string;
        [key: string]: any;
    };
    beforeUpdate?: Function;
    beforeSendEmail?: Function;
    baseUrl?: string;
}): Promise<{
    token: string;
    mailgunPromise: Promise<unknown>;
}>;
export function getBaseUrl(req: any): any;
export function resolveBaseUrl(reqUrl: any, cfgUrl: any): any;
export function ensureNotLastOwner(companyUsers: any, idNowNonOwner: any): void;
export namespace auth {
    export { userFindFromProvider };
    export { userSigninGetStore };
    export { getStore };
    export { addUserToCompany };
    export { userCreate };
    export { passwordValidate };
    export { tokenCreate };
    export { tokenParse };
    export { tokenSend };
    export { tokenConfirmForReset };
    export { tokenConfirmForSingleTenant };
    export { tokenConfirmForMultiTenant };
    export { getBaseUrl };
    export { invitePreConfirm };
    export { inviteConfirm };
    export { updateMemberRole };
    export { removeMember };
}
export const routes: {
    'get     /api/store': (typeof store)[];
    'get     /api/signout': (typeof signout)[];
    'post    /api/signin': (typeof signin)[];
    'post    /api/signup': (typeof signup)[];
    'post    /api/reset-instructions': (typeof resetInstructions)[];
    'post    /api/reset-confirm': (typeof resetConfirm)[];
    'post    /api/invite-instructions': (typeof inviteInstructions)[];
    'post    /api/resend-instructions': (typeof resendInstructions)[];
    'get     /api/invite-pre-confirm/:token': (typeof invitePreConfirm)[];
    'post    /api/invite-confirm/:token': (typeof inviteConfirm)[];
    'delete  /api/account/:uid': (typeof remove)[];
    'put     /api/company/:cid/member-role/:uidOrEmail': (string | typeof updateMemberRole)[];
    'delete  /api/company/:cid/member/:uidOrEmail': (string | typeof removeMember)[];
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