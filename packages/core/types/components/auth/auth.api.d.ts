export function findUserFromProvider(query: any, passwordToCheck: any, ...args: any[]): Promise<any>;
export function getStore(user: any): Promise<{
    user: any;
}>;
export function signinAndGetStore(user: any, isDesktop: any, getStore: any): Promise<any>;
export function userCreate({ business, password, ...userDataProp }: {
    [x: string]: any;
    business: any;
    password: any;
}): Promise<any>;
export function tokenCreate(id: any): Promise<any>;
export function tokenParse(token: any): any;
export function validatePassword(password: string, password2: any): Promise<void>;
export function resetInstructions(req: any, res: any): Promise<void>;
export function inviteInstructions(req: any, res: any): Promise<void>;
export function inviteConfirm(req: any, res: any): Promise<void>;
export function resetConfirm(req: any, res: any): Promise<void>;
export function inviteOrResetConfirm(type: any, req: any): Promise<any>;
/**
 * Checks if the user exists, updates the user with the invite token and sends the invite email
 * @param {object} options
 * @param {'reset' | 'invite'} options.type -  The type of token to send (default: 'reset')
 * @param {{_id: string, email: string, firstName: string}} options.user -  The user to send the invite email to
 * @param {function} [options.beforeUpdate] - callback hook to run before updating the user
 * @param {function} [options.beforeSendEmail] -  callback hook to run before sending the email
 * @returns {Promise<{token: string, mailgunPromise: Promise<unknown>}>}
 */
export function sendToken({ type, user, beforeUpdate, beforeSendEmail }: {
    type: "reset" | "invite";
    user: {
        _id: string;
        email: string;
        firstName: string;
    };
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
    'post    /api/reset-password': (typeof resetConfirm)[];
    'post    /api/invite-instructions': (typeof inviteInstructions)[];
    'post    /api/invite-accept': (typeof inviteConfirm)[];
    'delete  /api/account/:uid': (typeof remove)[];
    setup: typeof setup;
    findUserFromProvider: typeof findUserFromProvider;
    getStore: typeof getStore;
    signinAndGetStore: typeof signinAndGetStore;
    tokenCreate: typeof tokenCreate;
    tokenParse: typeof tokenParse;
    userCreate: typeof userCreate;
    validatePassword: typeof validatePassword;
    sendToken: typeof sendToken;
    inviteOrResetConfirm: typeof inviteOrResetConfirm;
};
declare function store(req: any, res: any): Promise<void>;
declare function signout(req: any, res: any): void;
declare function signin(req: any, res: any): any;
declare function signup(req: any, res: any): Promise<void>;
declare function remove(req: any, res: any): Promise<void>;
declare function setup(middleware: any, _config: any): void;
export {};
//# sourceMappingURL=auth.api.d.ts.map