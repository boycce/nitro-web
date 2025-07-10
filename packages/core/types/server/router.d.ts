export function setupRouter(config: any): Promise<http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>>;
export namespace middleware {
    let order: string[];
    function modifyRequest(req: any, res: any, next: any): void;
    let parseUrlEncoded: import("connect").NextHandleFunction;
    let parseJson: import("connect").NextHandleFunction;
    function parseFile(req: any, res: any, next: any): void;
    function beforeAPIRoute(req: any, res: any, next: any): void;
    function isAdmin(req: any, res: any, next: any): void;
    function isCompanyOwner(req: any, res: any, next: any): any;
    function isCompanyUser(req: any, res: any, next: any): any;
    function isUser(req: any, res: any, next: any): void;
}
import http from 'http';
//# sourceMappingURL=router.d.ts.map