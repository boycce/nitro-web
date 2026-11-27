// Adds this release's changes to CHANGELOG.md and the readme, run by standard-version after the version bump
import { execSync } from 'child_process'
import fs from 'fs'

const repo = 'https://github.com/boycce/nitro-web'
const file = 'CHANGELOG.md'
const readme = '../../readme.md'
const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8' })

const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version
const last = JSON.parse(git('show HEAD:./package.json')).version
const date = new Date().toISOString().slice(0, 10)

// feat, fix and perf commits since the last release, with any "BREAKING: how to update" line from the body
const changes = git(`log ${last}..HEAD --format=%h%x1f%s%x1f%b%x1e -- . ../webpack`)
  .split('\x1e')
  .map((commit) => {
    const [hash, subject, body] = commit.trim().split('\x1f')
    const match = subject?.match(/^(?:feat|fix|perf)(?:\(.+?\))?!?: (.+)/)
    const breaking = body?.match(/^BREAKING:\s*(.+)$/m)?.[1]
    return match && { hash: hash, summary: match[1], breaking: breaking }
  })
  .filter(Boolean)

if (changes.length) {
  const entry = [`## ${version} (${date})`, '']
  for (const c of changes) {
    entry.push(`- ${c.summary} ([${c.hash}](${repo}/commit/${c.hash}))`)
    if (c.breaking) entry.push(`  - **Breaking:** ${c.breaking}`)
  }
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/^# Changelog\s*/, '') : ''
  fs.writeFileSync(file, `# Changelog\n\n${entry.join('\n')}\n\n${old}`.trimEnd() + '\n')
}

if (!fs.existsSync(file)) process.exit()

// Readme: tables of the last 20 breaking changes and the last 5 releases, linking to their changelog entry
const releases = fs.readFileSync(file, 'utf8').split(/^## /m).slice(1).map((section) => {
  const [heading, ...lines] = section.trim().split('\n')
  const anchor = heading.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
  const cell = (text) => text.replace(/\|/g, '\\|')
  return {
    link: `[${heading.split(' ')[0]}](packages/core/${file}#${anchor})`,
    changes: lines.filter((l) => l.startsWith('- ')).map((l) => cell(l.slice(2).replace(/ \(\[\w+\]\(.+?\)\)$/, ''))),
    breaking: lines.filter((l) => l.includes('**Breaking:**')).map((l) => cell(l.split('**Breaking:** ')[1])),
  }
})
const breaking = releases.flatMap((r) => r.breaking.map((b) => `| ${r.link} | ${b} |`)).slice(0, 20)
const recent = releases.slice(0, 5).map((r) => `| ${r.link} | ${r.changes.join('; ')} |`)
const block = [
  '<!-- changelog -->',
  '### Breaking changes', '', '| Version | How to update |', '| --- | --- |', ...breaking, '',
  '### Recent changes', '', '| Version | Changes |', '| --- | --- |', ...recent,
  '<!-- /changelog -->',
].join('\n')
fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replace(/<!-- changelog -->[\s\S]*<!-- \/changelog -->/, block))
git(`add ${file} ${readme}`)
