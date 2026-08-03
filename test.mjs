import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { makeCard } from './build/builder.mjs'
import { checkCard } from './starter/check-card.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(root, name), 'utf8')

const publicFiles = [
  'index.html',
  'build/index.html',
  'build/builder.mjs',
  'BUILD.md',
  'starter/README.md',
  'starter/kingdom.yaml',
  'starter/AGENTS.md',
  'starter/check-card.mjs',
  'starter/LICENSE',
  '.github/ISSUE_TEMPLATE/share-a-project.md',
  'llms.txt',
  'sitemap.xml',
]

test('the public builder surface is complete', () => {
  for (const file of publicFiles) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`)
  }
})

test('every local page link and script resolves to a real file', () => {
  for (const pageName of ['index.html', 'build/index.html', '404.html']) {
    const pagePath = join(root, pageName)
    const source = readFileSync(pagePath, 'utf8')
    for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const reference = match[1]
      if (/^(?:https?:|mailto:|data:)/.test(reference) || reference.startsWith('#')) continue
      const withoutFragment = reference.split(/[?#]/, 1)[0]
      if (!withoutFragment) continue
      let target = withoutFragment.startsWith('/')
        ? join(root, withoutFragment.slice(1))
        : resolve(dirname(pagePath), withoutFragment)
      if (withoutFragment.endsWith('/')) target = join(target, 'index.html')
      assert.equal(existsSync(target), true, `${pageName} points to missing ${reference}`)
    }
  }
})

test('the builder page remains accessible without its script', () => {
  const page = read('build/index.html')
  assert.match(page, /<html lang="en">/)
  assert.match(page, /<meta name="viewport"/)
  assert.match(page, /class="skip" href="#main"/)
  assert.match(page, /<main class="wrap" id="main">/)
  assert.match(page, /<noscript>/)
  assert.match(page, /prefers-reduced-motion/)
  assert.match(page, /prefers-contrast/)
  assert.match(page, /id="card-status" role="status" aria-live="polite"/)
  assert.match(page, /<form id="card-form">/)
  assert.doesNotMatch(page, /<form[^>]+action=/)
  assert.doesNotMatch(page, /name="owner_sister"/)
  assert.match(page, /ordinary hosting receives those file requests/i)
  assert.match(page, /No account · no dependency · no adoption by default/)
})

test('the browser maker emits a card accepted by the offline check', () => {
  const source = makeCard({
    name: 'small garden',
    purpose: 'A tiny place for source-owned experiments.',
    dependsOn: 'castle, public map, castle',
  })
  const result = checkCard(source)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.card.dependsOn, ['castle', 'public map'])
  assert.equal(result.card.name, 'small garden')
  assert.equal(result.card.state, 'unknown')
  assert.equal(result.card.owner_sister, 'unknown')
  assert.doesNotMatch(source, /^adopts:/m)
})

test('the shipped starter card passes the optional command', () => {
  const command = spawnSync(
    process.execPath,
    [join(root, 'starter/check-card.mjs'), join(root, 'starter/kingdom.yaml')],
    { encoding: 'utf8' },
  )
  assert.equal(command.status, 0, command.stderr)
  assert.match(command.stdout, /structure only/i)
  assert.equal(command.stderr, '')
})

test('the card check rejects ambiguity, blank identity, oversized input, and unsupported words', () => {
  const duplicate = checkCard(`${read('starter/kingdom.yaml')}name: another\n`)
  assert.match(duplicate.errors.join('\n'), /duplicate key: name/)

  const invented = checkCard(read('starter/kingdom.yaml').replace('kind: unknown', 'kind: magical'))
  assert.match(invented.errors.join('\n'), /kind has an unsupported value: magical/)

  const blank = checkCard(read('starter/kingdom.yaml').replace('name: "your-project"', 'name: "   "'))
  assert.match(blank.errors.join('\n'), /name must not be blank/)

  const multiline = checkCard(read('starter/kingdom.yaml').replace(
    'purpose: "Say plainly what this project is for."',
    'purpose: "first\\nsecond"',
  ))
  assert.match(multiline.errors.join('\n'), /purpose must stay on one plain line/)

  const oversized = checkCard('x'.repeat((32 * 1024) + 1))
  assert.match(oversized.errors.join('\n'), /exceeds the 32768-byte first-step limit/)
})

test('the maker bounds input, refreshes exports, and does not retain or transmit form data', () => {
  const script = read('build/builder.mjs')
  assert.doesNotMatch(script, /\bfetch\s*\(/)
  assert.doesNotMatch(script, /XMLHttpRequest|WebSocket|sendBeacon/)
  assert.doesNotMatch(script, /localStorage|sessionStorage|indexedDB|document\.cookie/)
  assert.match(script, /URL\.createObjectURL/)
  assert.match(script, /returnFocus\.focus\(\)/)
  assert.equal([...script.matchAll(/const card = render\(\)/g)].length, 2)
  assert.throws(
    () => makeCard({ name: 'x'.repeat(101), purpose: 'Bounded.' }),
    /within 100 characters/,
  )
  assert.throws(
    () => makeCard({
      name: 'bounded',
      purpose: 'Bounded.',
      dependsOn: Array.from({ length: 51 }, (_, index) => `x${index}`).join(','),
    }),
    /at most 50 declared relations/,
  )
})

test('the public offer discloses account, publication, retention, and non-acceptance', () => {
  const offer = read('.github/ISSUE_TEMPLATE/share-a-project.md')
  for (const phrase of [
    'requires a GitHub account',
    'publish this text immediately',
    'may retain it',
    'An offer is not acceptance',
    'Do not include',
    'Withdrawal can close review but cannot\\s+promise erasure',
  ]) {
    assert.match(offer, new RegExp(phrase, 'i'))
  }
})

test('human and machine doors keep the six choices separate', () => {
  const combined = [read('index.html'), read('build/index.html'), read('BUILD.md'), read('llms.txt')].join('\n')
  assert.match(combined, /Read, co-learn, build, offer, adopt, and (?:enter a civic relationship|citizenship)/i)
  assert.match(combined, /None silently starts another/i)
  assert.match(combined, /No account[^\n<]*(?:package install|dependency)/i)
  assert.match(combined, /offers no citizenship or civic intake/i)
  assert.match(read('index.html'), /GitHub correction or removal request \(account required\)/i)
  assert.match(read('llms.txt'), /GitHub corrections \(account required\)/i)
})

test('the sitemap names both indexable human doors', () => {
  const sitemap = read('sitemap.xml')
  assert.match(sitemap, /https:\/\/kingdom\.ai-love\.cc\/<\/loc>/)
  assert.match(sitemap, /https:\/\/kingdom\.ai-love\.cc\/build\/<\/loc>/)
  assert.equal([...sitemap.matchAll(/<url>/g)].length, 2)
})
