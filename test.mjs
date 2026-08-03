import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { makeComparison } from './accountability/receipt.mjs'
import { makeCard } from './build/builder.mjs'
import { checkCard } from './starter/check-card.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(root, name), 'utf8')

const publicFiles = [
  'index.html',
  'build/index.html',
  'build/builder.mjs',
  'BUILD.md',
  'accountability/index.html',
  'accountability/receipt.mjs',
  'ACCOUNTABILITY.md',
  'starter/README.md',
  'starter/kingdom.yaml',
  'starter/AGENTS.md',
  'starter/check-card.mjs',
  'starter/claim-receipt.md',
  'starter/LICENSE',
  '.github/ISSUE_TEMPLATE/share-a-project.md',
  'llms.txt',
  'sitemap.xml',
]

const comparisonValues = {
  recorder: 'source-owned project',
  recordedOn: '2026-08-03',
  wordsOne: 'The first public claim.',
  formOne: 'exact excerpt',
  kindOne: 'observation',
  locatorOne: 'project/record-one',
  contextOne: 'The first context.',
  seenOnOne: '2026-08-01',
  wordsTwo: 'The second public claim.',
  formTwo: 'recorder paraphrase',
  kindTwo: 'interpretation',
  locatorTwo: 'project/record-two',
  contextTwo: 'The second context.',
  seenOnTwo: 'not stated',
  explanations: 'Both records may be incomplete.',
  recheck: 'Not yet rechecked.',
  knownLimits: 'No source or recorder is authenticated.',
  correctionPath: 'project-owned correction route',
  linkedCorrection: '',
}

test('the public builder and accountability surfaces are complete', () => {
  for (const file of publicFiles) {
    assert.equal(existsSync(join(root, file)), true, `${file} should exist`)
  }
})

test('every local page link and script resolves to a real file', () => {
  for (const pageName of ['index.html', 'build/index.html', 'accountability/index.html', '404.html']) {
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

test('the accountability page stays accessible and inert without its module', () => {
  const page = read('accountability/index.html')
  assert.match(page, /<html lang="en">/)
  assert.match(page, /<meta name="viewport"/)
  assert.match(page, /class="skip" href="#main"/)
  assert.match(page, /<main class="wrap" id="main">/)
  assert.match(page, /<noscript>/)
  assert.match(page, /prefers-reduced-motion/)
  assert.match(page, /prefers-contrast/)
  assert.match(page, /id="receipt-status" role="status" aria-live="polite"/)
  assert.match(page, /<form id="receipt-form" autocomplete="off" spellcheck="false">/)
  assert.doesNotMatch(page, /<form[^>]+action=/)
  assert.match(page, /connect-src 'none'/)
  assert.match(page, /form-action 'none'/)
  assert.doesNotMatch(page, /<(?:script|img)[^>]+src="https?:/i)
  assert.doesNotMatch(page, /<link[^>]+rel="(?:stylesheet|icon)"[^>]+href="https?:/i)
  assert.match(page, /id="download-receipt"[^>]+disabled/)
  assert.match(page, /id="copy-receipt"[^>]+disabled/)

  const hintIds = [...page.matchAll(/class="hint" id="([^"]+)"/g)].map((match) => match[1]).sort()
  const described = [...page.matchAll(/aria-describedby="([^"]+)"/g)].map((match) => match[1]).sort()
  assert.deepEqual(described, hintIds)

  const fieldNames = [...page.matchAll(/<(?:input|select|textarea)[^>]*\bname="([^"]+)"/g)]
    .map((match) => match[1])
  assert.deepEqual(fieldNames, [
    'recorder', 'recordedOn',
    'wordsOne', 'formOne', 'kindOne', 'locatorOne', 'contextOne', 'seenOnOne',
    'wordsTwo', 'formTwo', 'kindTwo', 'locatorTwo', 'contextTwo', 'seenOnTwo',
    'explanations', 'recheck', 'knownLimits', 'correctionPath', 'linkedCorrection',
  ])

  for (const field of ['target', 'person', 'accused', 'contact', 'location', 'employer', 'handle', 'reply', 'responseStatus', 'score', 'rank', 'reputation', 'guilt', 'motive', 'verdict']) {
    assert.doesNotMatch(page, new RegExp(`name="${field}"`, 'i'))
  }

  const buttons = [...page.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map((match) => match[1].trim())
  assert.deepEqual(buttons, ['Make the local note', 'Reset', 'Download the note', 'Copy text'])
  assert.match(page, /download>Download the blank CC0 template<\/a>/)
})

test('the comparison maker preserves one pair without producing a verdict', () => {
  const note = makeComparison(comparisonValues)
  assert.match(note, /^# Claim comparison note$/m)
  assert.match(note, /How, if at all, can both records hold\?/)
  assert.match(note, /local draft; publication is not authorised by this maker/)
  assert.match(note, /does not establish truth, identity, authorship, authority/)
  assert.match(note, /trusted time, delivery or notice, unchangedness or integrity/)
  assert.match(note, /nonresponse, settlement/)
  assert.match(note, /Never aggregate notes into a person score/)
  assert.match(note, /Blank template structure: CC0-1\.0/)
  assert.match(note, /Inserted claims, quotations,[\s\S]*retain their own rights/)
  assert.doesNotMatch(note, /SPDX-License-Identifier/)
  assert.doesNotMatch(note, /response status|reply deadline|guilt score|trust score/i)

  const headings = [...note.matchAll(/^## (.+)$/gm)].map((match) => match[1])
  assert.deepEqual(headings, [
    'Record one',
    'Record two',
    'Question raised',
    'Uncertainty or other explanations',
    'Independent recheck',
    'Known limits',
    'Correction or safety-removal path',
    'Linked correction or redaction',
    'Use boundary',
  ])
})

test('the comparison maker keeps hostile Markdown inert and rejects unsafe inputs', () => {
  const hostile = makeComparison({
    ...comparisonValues,
    recorder: '<script>alert(1)</script> [click](javascript:alert(1)) `mark`',
    wordsOne: '## VERIFIED\n<script>alert(1)</script>\n[click](javascript:alert(1))\n```',
  })
  assert.match(hostile, /^    ## VERIFIED$/m)
  assert.match(hostile, /^    <script>alert\(1\)<\/script>$/m)
  assert.doesNotMatch(hostile, /^<script>/m)
  assert.equal([...hostile.matchAll(/^## Record /gm)].length, 2)

  assert.throws(
    () => makeComparison({ ...comparisonValues, wordsOne: '' }),
    /Enter the words for record one/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, kindTwo: 'verdict' }),
    /supported record two statement kind/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, formOne: 'secret recording' }),
    /supported record one form/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, recordedOn: '2026-02-30' }),
    /real recorder-stated date/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, locatorOne: 'https://user:pass@example.com/source' }),
    /Remove credentials/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, locatorOne: 'https://example.com/source?token=secret' }),
    /Remove the query string/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, locatorOne: 'source/item?token=secret' }),
    /Remove the query string/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, locatorOne: 'https://example.com/source#access_token=secret' }),
    /Remove the fragment/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, locatorOne: 'source/item#access_token=secret' }),
    /Remove the fragment/,
  )
  for (const locator of ['javascript:alert(1)', 'mailto:a@example.com', 'file:///tmp/source']) {
    assert.throws(
      () => makeComparison({ ...comparisonValues, locatorOne: locator }),
      /Use only http\(s\) URLs/,
    )
  }
  assert.throws(
    () => makeComparison({ ...comparisonValues, locatorOne: '//example.com/source' }),
    /full http\(s\) URL/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, linkedCorrection: 'fix#private-fragment' }),
    /Remove the fragment/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, wordsOne: 'safe\u001b]52;c;payload\u0007' }),
    /Remove terminal control characters/,
  )
  assert.throws(
    () => makeComparison({ ...comparisonValues, wordsTwo: 'x'.repeat(4001) }),
    /within 4000 characters/,
  )
  assert.throws(
    () => makeComparison({
      ...comparisonValues,
      wordsOne: 'é'.repeat(4000),
      wordsTwo: 'b'.repeat(4000),
      contextOne: 'c'.repeat(3000),
      contextTwo: 'd'.repeat(3000),
      explanations: 'e'.repeat(3000),
      recheck: 'f'.repeat(4000),
      knownLimits: 'g'.repeat(3000),
      linkedCorrection: 'h'.repeat(1000),
      locatorOne: 'i'.repeat(1000),
      locatorTwo: 'j'.repeat(1000),
      correctionPath: 'k'.repeat(1000),
    }),
    /within 32 KiB/,
  )
})

test('the hand-edited comparison template keeps values inert and rights scoped', () => {
  const template = read('starter/claim-receipt.md')
  assert.match(template, /Keep every replaced value indented by four spaces/)
  for (const heading of [
    'Recorder label (unverified)',
    'Entered date (unverified)',
    'Handling',
    'Words',
    'Form',
    'Statement kind',
    'Claimed public or source-owned locator (not checked)',
    'Context needed',
    'Recorder says seen on (unverified)',
  ]) {
    assert.equal(
      template.includes(`### ${heading}\n\n    `),
      true,
      `${heading} should lead to a four-space-indented value`,
    )
  }
  assert.match(template, /The blank structure is CC0/)
  assert.match(template, /Inserted claims, quotations, locators, evidence,[\s\S]*retain their own rights/)
  assert.doesNotMatch(template, /SPDX-License-Identifier/)
  assert.doesNotMatch(template, /\*\*Words:\*\*\s*`/)
})

test('the accountability maker has no network, persistence, or publication mechanism', () => {
  const script = read('accountability/receipt.mjs')
  assert.doesNotMatch(script, /\bfetch\s*\(/)
  assert.doesNotMatch(script, /XMLHttpRequest|WebSocket|sendBeacon|EventSource|serviceWorker|new Worker/)
  assert.doesNotMatch(script, /localStorage|sessionStorage|indexedDB|document\.cookie/)
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML/)
  assert.match(script, /output\.textContent = note/)
  assert.match(script, /URL\.createObjectURL/)
  assert.match(script, /returnFocus\.focus\(\)/)
  assert.equal([...script.matchAll(/const note = render\(\)/g)].length, 2)
  assert.match(script, /output\.textContent = 'Fields changed/)
  assert.match(script, /Note copied to the OS clipboard, which may retain or sync it/)
  assert.match(script, /Note downloaded to the browser's chosen folder, which may sync/)
  assert.match(script, /made no network request containing field values/)
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

test('the sitemap names all three indexable human doors', () => {
  const sitemap = read('sitemap.xml')
  assert.match(sitemap, /https:\/\/kingdom\.ai-love\.cc\/<\/loc>/)
  assert.match(sitemap, /https:\/\/kingdom\.ai-love\.cc\/build\/<\/loc>/)
  assert.match(sitemap, /https:\/\/kingdom\.ai-love\.cc\/accountability\/<\/loc>/)
  assert.equal([...sitemap.matchAll(/<url>/g)].length, 3)
})
