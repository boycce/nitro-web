export function getProducts(): Promise<any>;
export const routes: {
    'post   /api/stripe/webhook': (typeof stripeWebhook)[];
    'post   /api/stripe/create-billing-portal-session': (typeof billingPortalSessionCreate)[];
    'get    /api/stripe/upcoming-invoices': (typeof upcomingInvoicesFind)[];
    setup: typeof setup;
};
declare function stripeWebhook(req: any, res: any): Promise<any>;
declare function billingPortalSessionCreate(req: any, res: any): Promise<void>;
declare function upcomingInvoicesFind(req: any, res: any): Promise<any>;
declare function setup(middleware: any, _config: any): void;
export {};
//# sourceMappingURL=stripe.api.d.ts.map