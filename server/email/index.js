// import axios from '@hokify/axios'
import nodemailer from 'nodemailer'
import mailgun from 'nodemailer-mailgun-transport'
import nunjucks from 'nunjucks'
import inlineCss from 'inline-css'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

let templates = {}
let nodemailerMailgun = undefined
const _dirname = dirname(fileURLToPath(import.meta.url)) + '/'


export async function sendEmail({ template, to, bcc, data={}, from, replyTo, recipientVariables, subject, test, skipCssInline, config }) {
  /**
   * Email recipient a predefined template with data and/or recipientVariables
   *
   * @param {string} template = e.g. 'reset-password' or html
   * @param {string} to - e.g. "Bruce Lee<bruce@gmail.com>, ..."
   * @param {object} config - e.g. { mailgunKey, mailgunDomain, emailFrom, clientUrl }
   * @param {string} <bcc> - e.g. "Chuck Norris<chuck@gmail.com>" (not sent in development)
   * @param {object} <data> - recipientVariables[to] shorthand
   * @param {string} <from> - e.g. "Chuck Norris<chuck@gmail.com>"
   * @param {string} <replyTo> - e.g. "Chuck Norris<chuck@gmail.com>"
   * @param {object} <recipientVariables> - mailgun recipient-variables for batch sending
   * @param {string} <subject> - subject, this can also be defined in the template
   * @param {boolean} <skipCssInline> - skip inlining css
   * @param {boolean} <test> - subject, this can also be defined in the template
   * @return Promise([mailgunErr, mailgunInfo])
   */
  if (!config) {
    throw new Error('sendEmail: `config` missing')
  } else if (!config.emailFrom || !config.clientUrl) {
    throw new Error('sendEmail: `config.emailFrom` or `config.clientUrl` is missing')
  } else if (!test && (!config.mailgunKey || !config.mailgunDomain)) {
    throw new Error('sendEmail: `config.mailgunKey` or `config.mailgunDomain` is missing')
  } else if (!template) {
    throw new Error('sendEmail: `template` missing')
  } else if (!to) {
    throw new Error('sendEmail: `to` missing')
  }

  // Setup nodemailer once
  if (!nodemailerMailgun && !test) {
    nodemailerMailgun = nodemailer.createTransport(
      mailgun({ auth: { api_key: config.mailgunKey, domain: config.mailgunDomain }})
    )
  }

  // From, replayTo
  from = from || config.emailFrom
  replyTo = replyTo || config.emailReplyTo || from

  // Data is recipientVariables[to] shorthand
  if (data) {
    recipientVariables = { [getNameEmail(to)[1]]: data }
  }

  // Add default recipientVariables
  for (let toEmail in recipientVariables) {
    recipientVariables[toEmail] = {
      domain: config.clientUrl,
      email: toEmail,
      greet: data.name || getNameEmail(to)[0]? 'Hi ' + (data.name || getNameEmail(to)[0]) : 'Hello',
      name: getNameEmail(to)[0],
      replyToEmail: getNameEmail(replyTo)[1],
      replyToName: getNameEmail(replyTo)[0],
      ...recipientVariables[toEmail],
    }
  }

  let settings = {
    bcc: bcc,
    from: from,
    isDev: config.clientUrl.match(/:/),
    recipientVariables: recipientVariables,
    replyTo: replyTo,
    skipCssInline: skipCssInline,
    subject: subject,
    template: template,
    test: config.emailTestMode || test,
    to: to,
    url: config.clientUrl,
  }

  // Grab html and send
  let html = template.match('<') ? template : await getTemplate(settings, config)
  if (!html) throw new Error('Sendmail: No template returned from getTemplate(..)')
  return await sendWithMailgun(settings, html) // note, mailgun errors are resolved
}

async function getTemplate(settings, config) {
  try {
    var templateName = settings.template
    if (!templates[templateName] || settings.isDev) {
      nunjucks.configure({ noCache: config.env === 'development' })
      // Setup the nunjucks environment
      let env = new nunjucks.Environment([
        new nunjucks.FileSystemLoader(`${config.emailTemplateDir}`), // user templates take precedence
        new nunjucks.FileSystemLoader(`${_dirname}`), // then fallback to nitro default templates
      ])
      // Get the template
      let template = env.getTemplate(templateName + '.html', true)
      // Render the template
      let html = template.render({})
      if (settings.skipCssInline && settings.test) {
        templates[templateName] = html
      } else {
        try { 
          // First try to inline the CSS from the user templates directory (config.emailTemplateDir)
          templates[templateName] = await inlineCssForPath(html, config.emailTemplateDir)
        } catch (e) {
          // If the CSS is not found, use default nitro CSS file
          if (templateName == 'reset-password' || templateName == 'welcome') {
            templates[templateName] = await inlineCssForPath(html, `${_dirname}`)
          } else {
            throw e
          }
        }
      }
      return templates[templateName]
    } else {
      return templates[templateName]
    }
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
  let processedhtml = await processTemplate(settings, html)
  if (settings.test) return processedhtml

  return new Promise((resolve, reject) => {
    nodemailerMailgun.sendMail({
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
    }, function(err, info) {
      if (err) {
        console.error('SendEmail mailgun error')
        reject(err)
      } else {
        resolve(info)
      }
    })
  })
}
