export function setupRouter(config: any): Promise<http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>>;
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
import http from 'http';
import express from 'express';
//# sourceMappingURL=router.d.ts.map