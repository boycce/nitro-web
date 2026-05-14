/** @returns {Promise<{ server: import('http').Server, expressApp: import('express').Application }>} */
export function setupRouter(config: any): Promise<{
    server: import("http").Server;
    expressApp: import("express").Application;
}>;
export function isAdminUser(req: any): boolean;
export function isValidUserOrRespond(req: any, res: any): boolean;
/** @type {MiddlewareConfig} */
export const middleware: MiddlewareConfig;
export type Request = express.Request & {
    version: string;
    user?: any;
};
export type Response = express.Response & {
    error: (msg?: string | Error | Error[], detail?: string) => void;
    unauthorized: (msg?: string | Error | Error[]) => void;
    forbidden: (msg?: string | Error | Error[]) => void;
    notFound: (msg?: string | Error | Error[]) => void;
    serverError: (msg?: string | Error | Error[]) => void;
};
export type MiddlewareConfig = {
    order: string[];
    [key: string]: ((req: Request, res: Response, next: Function) => void) | string[];
};
import express from 'express';
//# sourceMappingURL=router.d.ts.map