import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveBaseUrl } from '../components/auth/auth.api.js'

const cases = [
  // [cfgUrl, reqUrl, expected, description]

  // cfg: match
  
  ['https://app.example.com',    'https://app.example.com',         'https://app.example.com',        'match: exact'],
  ['https://app.example.com',    'https://wildcard.example.com',    'https://wildcard.example.com',   'match: sibling'],
  ['https://app.example.com',    'https://foo.bar.example.com',     'https://foo.bar.example.com',    'match: nested'],
  ['https://app.example.com',    'https://example.com',             'https://example.com',            'match: apex'],
  ['https://app.example.com',    'http://app.example.com:3000',     'http://app.example.com:3000',    'match: port (ignored)'],
  ['https://example.co.uk',      'https://app.example.co.uk',       'https://app.example.co.uk',      'match: co.uk nested'],

  ['http://localhost:3000',      'http://localhost:3001',           'http://localhost:3001',          'match: localhost: port (ignored)'],
  ['http://localhost:3000',      'http://app.localhost:3001',       'http://app.localhost:3001',      'match: localhost: nested'],
  ['http://app.localhost:3000',  'http://app2.localhost:3001',      'http://app2.localhost:3001',     'match: localhost: sibling'],
  ['http://127.0.0.1:3000',      'http://127.0.0.1:3000',           'http://127.0.0.1:3000',          'match: IP exact'],

  // cfg: mismatch

  ['https://app.example.com',    'https://example2.com',            'https://app.example.com',        'mismatch: apex'],
  ['https://app.example.com',    'https://evilapp.example.com.bad', 'https://app.example.com',        'mismatch: nested'],
  ['https://example.co.uk',      'https://other.co.uk',             'https://example.co.uk',          'mismatch: co.uk apex'],

  ['http://otherhost',           'http://app.localhost',            'http://otherhost',               'mismatch: localhost: nested'],
  ['http://127.0.0.1',           'http://192.168.1.1',              'http://127.0.0.1',               'mismatch: IP different'],
  ['https://app.example.com',    undefined,                         'https://app.example.com',        'mismatch: undefined'],
  ['https://app.example.com',    '',                                'https://app.example.com',        'mismatch: empty'],
  ['https://app.example.com',    'not a url',                       'https://app.example.com',        'mismatch: bad string'],
]

test('resolveBaseUrl', async (t) => {
  for (const [cfgUrl, reqUrl, expected, desc] of cases) {
    await t.test(desc, () => {
      assert.equal(resolveBaseUrl(reqUrl, cfgUrl), expected)
    })
  }
})
