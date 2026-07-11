// @ts-nocheck
// import axios from '@hokify/axios'
import nodemailer from 'nodemailer'
import mailgun from 'nodemailer-mailgun-transport'
import nunjucks from 'nunjucks'
import inlineCss from 'inline-css'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'
import { getDirectories, ucFirst } from 'nitro-web/util'

let templates = {}
let nodemailerMailgun = undefined
const _dirname = dirname(fileURLToPath(import.meta.url)) + '/'

export const requiredEmailConfigKeys = ['baseUrl', 'emailFrom', 'name', 'env']
export const optionalEmailConfigKeys = ['emailReplyTo', 'emailTestMode', 'mailgunDomain', 'mailgunKey']


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
export async function sendEmail({ 
  template,
  to, 
  config,
  bcc, 
  data,
  swigData,
  from, 
  replyTo, 
  recipientVariables, 
  subject, 
  skipCssInline,
  test,  
}) {
  const isTest = config.emailTestMode || test
  if (!config) throw new Error('sendEmail: `config` missing')
  for (const key of requiredEmailConfigKeys) {
    if (!config[key]) throw new Error(`sendEmail: config.${key} is missing`)
  }
  if (!isTest && (!config.mailgunKey || !config.mailgunDomain)) {
    throw new Error('sendEmail: config.mailgunKey and config.mailgunDomain are required')
  }
  if (!template) throw new Error('sendEmail: `template` missing')
  if (!to) throw new Error('sendEmail: `to` missing')

  // Setup nodemailer once
  if (!nodemailerMailgun && !isTest) {
    nodemailerMailgun = nodemailer.createTransport(
      mailgun({ auth: { api_key: config.mailgunKey, domain: config.mailgunDomain }})
    )
  }

  // From, replayTo
  from = from || config.emailFrom
  replyTo = replyTo || config.emailReplyTo || from

  const defaultData = {
    configName: ucFirst(config.name),
    domain: config.baseUrl,
    replyToEmail: getNameEmail(replyTo)[1],
    replyToName: getNameEmail(replyTo)[0],
    ...(data || {}),
  }

  if (swigData) {
    swigData = {
      ...defaultData,
      ...swigData,
    }
  }

  const toSplit = to.split(',')

  // Add default recipientVariables
  if (!recipientVariables) recipientVariables = {}

  // Add default values to recipientVariables
  for (let toNameEmail of toSplit) {
    const [toName, toEmail] = getNameEmail(toNameEmail)
    recipientVariables[toEmail] = {
      ...defaultData,
      email: toEmail,
      greet: toName ? 'Hi ' + toName : 'Hello',
      name: toName,
      ...(recipientVariables[toEmail] || {}),
    }
  }

  let settings = {
    bcc: bcc,
    emailTemplateDir: getDirectories(path, config.pwd).emailTemplateDir,
    from: from,
    isDev: config.env === 'development',
    recipientVariables: recipientVariables,
    replyTo: replyTo,
    skipCssInline: skipCssInline,
    subject: subject,
    template: template,
    test: isTest,
    to: to,
    swigData: swigData,
  }

  // Grab html and send
  let html = template.match('<') ? template : await getTemplate(settings)
  if (!html) throw new Error('Sendmail: No template returned from getTemplate(..)')
  return await sendWithMailgun(settings, html) // note, mailgun errors are resolved
}

async function getTemplate(settings) {
  try {
    var templateName = settings.template
    // Return cached template (if there is no swig data)
    if (templates[templateName] && !settings.isDev && !settings.swigData) {
      return templates[templateName]
    }
    // Setup the nunjucks environment
    nunjucks.configure({ noCache: settings.isDev })
    let nunjucksEnv = new nunjucks.Environment([
      new nunjucks.FileSystemLoader(`${settings.emailTemplateDir}`), // user templates take precedence
      new nunjucks.FileSystemLoader(`${_dirname}`), // then fallback to nitro default templates
    ])
    // Get the template
    let template = nunjucksEnv.getTemplate(templateName + '.html', true)
    let html = template.render(settings.swigData || {})
    // Inline CSS
    if (!settings.skipCssInline || !settings.test) {
      try {
        // First try to inline the CSS from the user templates directory
        html = await inlineCssForPath(html, settings.emailTemplateDir)
      } catch (e) {
        // If the CSS is not found, use default nitro CSS file
        if (templateName == 'reset-password' || templateName == 'welcome') {
          html = await inlineCssForPath(html, `${_dirname}`)
        } else {
          throw e
        }
      }
    }
    // Cache the template (if there is no swig data)
    if (!settings.swigData) templates[templateName] = html
    return html
  } catch (e) {
    console.error(`Sendmail: issue retrieving the email template "${templateName}.html"`)
    console.error(e)
    throw e
  }
}

async function inlineCssForPath(html, path) {
  const url = join('file://', path)
  return await inlineCss(html, { url })
}

function getNameEmail(nameEmail) {
  // Splits 'Bruce<bruce@gmail.com>' into [name, email]
  nameEmail = nameEmail.split(',')[0]
  var name = nameEmail.match('<')? nameEmail.split('<')[0] : ''
  var email = nameEmail.match('<')? nameEmail.split(/<|>/g)[1] : nameEmail
  return [name, email]
}

function processTemplate(settings, html) {
  // If sending to only one email, replace mailgun placeholders before they reach mailgun (handy for testing templates)
  if (!settings.to.match(/,/) && Object.keys(settings.recipientVariables).length) {
    const recipientVariables = settings.recipientVariables[Object.keys(settings.recipientVariables)[0]]
    for (let key in recipientVariables) {
      html = html.replace(new RegExp('%recipient\\.' + key + '%', 'g'), recipientVariables[key])
    }
  }
  // Extract the subject from the template
  let foundSubject = html.match(new RegExp('\\[\\[\\s*subject\\s*=\\s*(.*?)\\s*\\]\\]'))
  html = html.replace(new RegExp('\\[\\[\\s*subject\\s*=.*?\\]\\]'), '')
  // Save subject (if called from an instance)
  if (!settings.subject) {
    if (foundSubject) settings.subject = foundSubject[1]
    else throw new Error('Sendmail: please pass `subject` or set it in the template')
  }
  return html
}

async function sendWithMailgun(settings, html) {
  // Supports batch sending via recipientVariables, limit 1000 emails
  // https://documentation.mailgun.com/en/latest/user_manual.html?highlight=batch%20sending#batch-sending
  const processedhtml = await processTemplate(settings, html)
  const mailgunOpts = {
    ...(settings.bcc && !settings.isDev? { bcc: settings.bcc } : {}),
    from: settings.from,
    html: processedhtml,
    'h:Reply-To': settings.replyTo,
    subject: settings.subject,
    to: settings.to,
    ...(!settings.recipientVariables? {} : {
      'recipient-variables': typeof settings.recipientVariables == 'string'
        ? settings.recipientVariables
        : JSON.stringify(settings.recipientVariables),
    }),
  }
  if (settings.test && settings.isDev) {
    console.info('Test mode: sendEmail mailgunOpts', { ...mailgunOpts, html: null, 'recipient-variables': settings.recipientVariables })
  }
  if (settings.test) return processedhtml

  return new Promise((resolve, reject) => {
    nodemailerMailgun.sendMail(mailgunOpts, function(err, info) {
      if (err) {
        console.error('SendEmail mailgun error')
        reject(err)
      } else {
        resolve(info)
      }
    })
  })
}
