import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guardRecipients, sendEmail } from '../server/email/index.js'

const redirect = { emailRedirectTo: 'Dev<dev@example.test>', emailAllowList: '@wayneenterprises.com, Alfred@Example.com' }

test('guardRecipients', async (t) => {
  await t.test('does nothing without emailRedirectTo, whatever the environment', () => {
    const out = guardRecipients({ to: 'jane@customer.test', cc: 'cc@customer.test', config: { env: 'development' } })
    assert.deepEqual(out, { to: 'jane@customer.test', cc: 'cc@customer.test', bcc: undefined, redirected: false })
  })

  await t.test('redirects to the one address and names the intended recipients', () => {
    const out = guardRecipients({ to: 'Jane<jane@customer.test>', cc: 'cc@customer.test', bcc: 'bcc@customer.test', config: redirect })
    assert.equal(out.to, 'Dev<dev@example.test>')
    assert.equal(out.cc, undefined)
    assert.equal(out.bcc, undefined)
    assert.equal(out.redirected, true)
    assert.equal(out.subjectPrefix, '[redirected → Jane<jane@customer.test> cc:cc@customer.test bcc:bcc@customer.test] ')
  })

  await t.test('sends as addressed when every recipient is on the allow list, by domain or exact address, any case', () => {
    const to = 'Bruce<bruce@wayneenterprises.com>,ALFRED@example.com'
    assert.deepEqual(guardRecipients({ to, config: redirect }), { to, cc: undefined, bcc: undefined, redirected: false })
  })

  await t.test('one recipient off the list redirects the whole email', () => {
    assert.equal(guardRecipients({ to: 'bruce@wayneenterprises.com', cc: 'jane@customer.test', config: redirect }).redirected, true)
  })

  await t.test('a domain entry is the domain, not a suffix of some other one', () => {
    assert.equal(guardRecipients({ to: 'bruce@notwayneenterprises.com', config: redirect }).redirected, true)
    assert.equal(guardRecipients({ to: 'bruce@wayneenterprises.com.evil.test', config: redirect }).redirected, true)
  })

  await t.test('an empty allow list admits nothing', () => {
    assert.equal(guardRecipients({ to: 'bruce@wayneenterprises.com', config: { emailRedirectTo: 'dev@example.test' } }).redirected, true)
  })
})

test('sendEmail redirects in test mode too, keeping the intended recipient\'s variables and prefixing the subject', async () => {
  // Development test mode logs what would be sent; capture that instead of posting to Mailgun
  const info = console.info
  const logged = []
  console.info = (...args) => logged.push(args)
  try {
    const html = await sendEmail({
      config: { ...redirect, baseUrl: 'http://localhost:3000', emailFrom: 'Nitro<support@nitro.test>', name: 'nitro',
        env: 'development', emailTestMode: true, pwd: process.cwd() },
      template: '<p>%recipient.greet%, this went to %recipient.email%</p>',
      subject: 'Welcome %recipient.name%',
      to: 'Jane<jane@customer.test>',
      cc: 'cc@customer.test',
    })
    assert.equal(html, '<p>Hi Jane, this went to jane@customer.test</p>')
    const sent = logged.find((args) => args[0] === 'Test mode: sendEmail mailgunOpts')?.[1]
    assert.ok(sent, 'logged the message it would send')
    assert.equal(sent.to, 'Dev<dev@example.test>')
    assert.equal(sent.cc, undefined)
    assert.equal(sent.subject, '[redirected → Jane<jane@customer.test> cc:cc@customer.test] Welcome Jane')
  } finally {
    console.info = info
  }
})
