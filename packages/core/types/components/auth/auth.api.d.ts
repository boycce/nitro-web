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
export const routes: {
    'get     /api/store': (typeof store)[];
    'get     /api/signout': (typeof signout)[];
    'post    /api/signin': (typeof signin)[];
    'post    /api/signup': (typeof signup)[];
    'post    /api/reset-instructions': (typeof resetInstructions)[];
    'post    /api/reset-password': (typeof resetPassword)[];
    'post    /api/invite-instructions': (typeof inviteInstructions)[];
    'post    /api/invite-accept': (typeof resetPassword)[];
    'delete  /api/account/:uid': (typeof remove)[];
    setup: typeof setup;
    findUserFromProvider: typeof findUserFromProvider;
    getStore: typeof getStore;
    signinAndGetStore: typeof signinAndGetStore;
    tokenCreate: typeof tokenCreate;
    tokenParse: typeof tokenParse;
    userCreate: typeof userCreate;
    validatePassword: typeof validatePassword;
};
declare function store(req: any, res: any): Promise<void>;
declare function signout(req: any, res: any): void;
declare function signin(req: any, res: any): any;
declare function signup(req: any, res: any): Promise<void>;
declare function resetInstructions(req: any, res: any): Promise<void>;
declare function resetPassword(req: any, res: any): Promise<void>;
declare function inviteInstructions(req: any, res: any): Promise<any>;
declare function remove(req: any, res: any): Promise<void>;
declare function setup(middleware: any, _config: any): void;
export {};
//# sourceMappingURL=auth.api.d.ts.map