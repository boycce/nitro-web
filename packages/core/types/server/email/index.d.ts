/**
 * Sends an email using a predefined template, with optional data/or recipientVariables
 * @typedef {{ baseUrl?: string, emailFrom?: string, mailgunDomain?: string, mailgunKey?: string, name?: string,
 *   emailRedirectTo?: string, emailAllowList?: string }} Config
 *
 * @param {object} opts
 * @param {string} opts.template - Template name or raw HTML, e.g., 'reset-password'
 * @param {string} opts.to - Recipient(s), e.g. "Bruce<bruce@wayneenterprises.com>,..."
 * @param {Config} opts.config - Config object
 * @param {string} [opts.cc] - CC, e.g. "Bruce<bruce@wayneenterprises.com>,..." (not sent in development)
 * @param {string} [opts.bcc] - BCC, e.g. "Bruce<bruce@wayneenterprises.com>,..." (not sent in development)
 * @param {object} [opts.data] - common template data shared across recipients
 * @param {object} [opts.swigData] - vars for Nunjucks/Swig render only (not sent to Mailgun). Inherits data.
 * @param {string} [opts.from] - sender address, e.g. "Bruce<bruce@wayneenterprises.com>"
 * @param {string} [opts.replyTo] - reply-to address, e.g. "Bruce<bruce@wayneenterprises.com>"
 * @param {object} [opts.recipientVariables] - Mailgun recipient-variables for batch sending
 * @param {string} [opts.subject] - subject (can also be defined in template)
 * @param {boolean} [opts.skipCssInline] - skip CSS inlining
 * @param {boolean} [opts.test] - enable test mode
 * @param {{ filename: string, content: Buffer, contentType?: string }[]} [opts.attachments] - file attachments
 * @returns {Promise<[any, any]>} Resolves with [mailgunErr, mailgunInfo]
 */
export function sendEmail({ template, to, config, cc, bcc, data, swigData, from, replyTo, recipientVariables, subject, skipCssInline, test, attachments, }: {
    template: string;
    to: string;
    config: Config;
    cc?: string;
    bcc?: string;
    data?: object;
    swigData?: object;
    from?: string;
    replyTo?: string;
    recipientVariables?: object;
    subject?: string;
    skipCssInline?: boolean;
    test?: boolean;
    attachments?: {
        filename: string;
        content: Buffer;
        contentType?: string;
    }[];
}): Promise<[any, any]>;
/**
 * Keeps non-production email out of real inboxes. With `config.emailRedirectTo` set, every email is sent to that
 * address instead of its recipients, unless all of them are on `config.emailAllowList`, so testers can still receive
 * their own. The intended recipients are kept in the subject. Set `emailRedirectTo` in every environment that must
 * not reach real people (a developer's machine, staging) and leave it unset in production: an address sitting on a
 * user record is otherwise a live recipient, whichever path sends to it (`tokenSend` included).
 * @param {object} opts
 * @param {string} opts.to - as passed to sendEmail
 * @param {string} [opts.cc]
 * @param {string} [opts.bcc]
 * @param {Config} opts.config - reads `emailRedirectTo` and `emailAllowList`
 * @returns {{ to: string, cc?: string, bcc?: string, redirected: boolean, subjectPrefix?: string }}
 */
export function guardRecipients({ to, cc, bcc, config }: {
    to: string;
    cc?: string;
    bcc?: string;
    config: Config;
}): {
    to: string;
    cc?: string;
    bcc?: string;
    redirected: boolean;
    subjectPrefix?: string;
};
export const requiredEmailConfigKeys: string[];
export const optionalEmailConfigKeys: string[];
/**
 * Sends an email using a predefined template, with optional data/or recipientVariables
 */
export type Config = {
    baseUrl?: string;
    emailFrom?: string;
    mailgunDomain?: string;
    mailgunKey?: string;
    name?: string;
    emailRedirectTo?: string;
    emailAllowList?: string;
};
//# sourceMappingURL=index.d.ts.map