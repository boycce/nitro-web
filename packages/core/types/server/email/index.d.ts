/**
 * Sends an email using a predefined template, with optional data/or recipientVariables
 * @typedef {{ baseUrl?: string, emailFrom?: string, mailgunDomain?: string, mailgunKey?: string, name?: string }} Config
 *
 * @param {object} opts
 * @param {string} opts.template - Template name or raw HTML, e.g., 'reset-password'
 * @param {string} opts.to - Recipient(s), e.g. "Bruce<bruce@wayneenterprises.com>,..."
 * @param {Config} opts.config - Config object
 * @param {string} [opts.bcc] - BCC, e.g. "Bruce<bruce@wayneenterprises.com>" (not sent in development)
 * @param {object} [opts.data] - common template data shared across recipients
 * @param {object} [opts.swigData] - vars for Nunjucks/Swig render only (not sent to Mailgun). Inherits data.
 * @param {string} [opts.from] - sender address, e.g. "Bruce<bruce@wayneenterprises.com>"
 * @param {string} [opts.replyTo] - reply-to address, e.g. "Bruce<bruce@wayneenterprises.com>"
 * @param {object} [opts.recipientVariables] - Mailgun recipient-variables for batch sending
 * @param {string} [opts.subject] - subject (can also be defined in template)
 * @param {boolean} [opts.skipCssInline] - skip CSS inlining
 * @param {boolean} [opts.test] - enable test mode
 * @returns {Promise<[any, any]>} Resolves with [mailgunErr, mailgunInfo]
 */
export function sendEmail({ template, to, config, bcc, data, swigData, from, replyTo, recipientVariables, subject, skipCssInline, test, }: {
    template: string;
    to: string;
    config: Config;
    bcc?: string;
    data?: object;
    swigData?: object;
    from?: string;
    replyTo?: string;
    recipientVariables?: object;
    subject?: string;
    skipCssInline?: boolean;
    test?: boolean;
}): Promise<[any, any]>;
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
};
//# sourceMappingURL=index.d.ts.map