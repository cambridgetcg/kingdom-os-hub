const kinds = new Set([
  'observation',
  'expectation',
  'commitment',
  'consequence',
  'interpretation',
  'unknown',
])

const forms = new Set(['exact excerpt', 'recorder paraphrase'])

const limits = {
  recorder: 160,
  words: 4000,
  locator: 1000,
  context: 3000,
  seenOn: 80,
  explanations: 3000,
  recheck: 4000,
  knownLimits: 3000,
  correctionPath: 1000,
  linkedCorrection: 1000,
}

function textValue(value) {
  const text = String(value || '').replace(/\r\n?/g, '\n').trim()
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(text)) {
    throw new Error('Remove terminal control characters from the note text.')
  }
  return text
}

function required(values, field, message) {
  const value = textValue(values[field])
  if (!value) throw new Error(message)
  return value
}

function bounded(value, limit, label) {
  if (value.length > limit) throw new Error(`Keep ${label} within ${limit} characters.`)
  return value
}

function oneLine(value, label) {
  if (/\n/.test(value)) throw new Error(`Keep ${label} on one line.`)
  return value
}

function selected(values, field, allowed, label) {
  const value = String(values[field] || '')
  if (!allowed.has(value)) throw new Error(`Choose one supported ${label}.`)
  return value
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function safeLocator(value, label) {
  const locator = oneLine(bounded(value, limits.locator, label), label)
  if (locator.includes('?')) {
    throw new Error(`Remove the query string from ${label}; it may contain private data.`)
  }
  if (locator.includes('#')) {
    throw new Error(`Remove the fragment from ${label}; it may contain private data.`)
  }
  if (/^\/\//.test(locator)) {
    throw new Error(`Use a full http(s) URL or a plain source-owned path for ${label}.`)
  }
  const scheme = locator.match(/^[a-z][a-z0-9+.-]*:/i)
  if (scheme && !/^https?:\/\//i.test(locator)) {
    throw new Error(`Use only http(s) URLs or a plain source-owned path for ${label}.`)
  }
  if (!/^https?:\/\//i.test(locator)) return locator
  let parsed
  try {
    parsed = new URL(locator)
  } catch {
    throw new Error(`${label} is not a valid public URL or plain source-owned pointer.`)
  }
  if (parsed.username || parsed.password) throw new Error(`Remove credentials from ${label}.`)
  return locator
}

function codeBlock(value) {
  return value.split('\n').map((line) => `    ${line}`).join('\n')
}

function inlineCode(value) {
  const runs = value.match(/`+/g) || []
  const longest = runs.reduce((length, run) => Math.max(length, run.length), 0)
  const fence = '`'.repeat(Math.max(1, longest + 1))
  return `${fence} ${value} ${fence}`
}

function textSection(title, value, fallback) {
  return [`## ${title}`, '', codeBlock(value || fallback), '']
}

function recordSection(number, record) {
  return [
    `## Record ${number}`,
    '',
    `- **Form:** \`${record.form}\``,
    `- **Statement kind:** \`${record.kind}\``,
    `- **Claimed public or source-owned locator (not checked):** ${inlineCode(record.locator)}`,
    `- **Recorder says seen on (unverified):** ${inlineCode(record.seenOn)}`,
    '',
    '### Words',
    '',
    codeBlock(record.words),
    '',
    '### Context needed',
    '',
    codeBlock(record.context || 'No additional context supplied.'),
    '',
  ]
}

function recordFrom(values, suffix, number) {
  return {
    words: bounded(required(values, `words${suffix}`, `Enter the words for record ${number}.`), limits.words, `record ${number} words`),
    form: selected(values, `form${suffix}`, forms, `record ${number} form`),
    kind: selected(values, `kind${suffix}`, kinds, `record ${number} statement kind`),
    locator: safeLocator(
      required(values, `locator${suffix}`, `Give a public or source-owned locator for record ${number}.`),
      `record ${number} locator`,
    ),
    context: bounded(textValue(values[`context${suffix}`]), limits.context, `record ${number} context`),
    seenOn: oneLine(
      bounded(required(values, `seenOn${suffix}`, `State when the recorder says record ${number} was seen, or write not stated.`), limits.seenOn, `record ${number} seen-on statement`),
      `record ${number} seen-on statement`,
    ),
  }
}

export function makeComparison(values) {
  const recorder = oneLine(
    bounded(required(values, 'recorder', 'Name the recorder as claimed, or write not stated.'), limits.recorder, 'the recorder claim'),
    'the recorder claim',
  )
  const recordedOn = String(values.recordedOn || '')
  if (!validDate(recordedOn)) throw new Error('Choose a real recorder-stated date.')

  const recordOne = recordFrom(values, 'One', 'one')
  const recordTwo = recordFrom(values, 'Two', 'two')
  const explanations = bounded(textValue(values.explanations), limits.explanations, 'uncertainty and other explanations')
  const recheck = bounded(textValue(values.recheck), limits.recheck, 'the independent recheck')
  const knownLimits = bounded(textValue(values.knownLimits), limits.knownLimits, 'the known limits')
  const correctionPath = bounded(
    required(values, 'correctionPath', 'Name a practical correction or safety-removal path.'),
    limits.correctionPath,
    'the correction path',
  )
  const linkedCorrectionValue = textValue(values.linkedCorrection)
  const linkedCorrection = linkedCorrectionValue
    ? safeLocator(linkedCorrectionValue, 'the linked correction or redaction locator')
    : ''

  const note = [
    '<!-- Blank template structure: CC0-1.0. Inserted claims, quotations,',
    'locators, and evidence retain their own rights. -->',
    '',
    '# Claim comparison note',
    '',
    '> This note is one recorder\'s claimed comparison. Check the named sources',
    '> independently. It does not establish truth, identity, authorship, authority,',
    '> trusted time, delivery or notice, unchangedness or integrity, causation,',
    '> contradiction, intent, deception, guilt, consent, nonresponse, settlement,',
    '> endorsement, or anyone\'s worth. Context, changed belief, translation, or',
    '> source error may explain any apparent difference.',
    '',
    `- **Recorder label (unverified):** ${inlineCode(recorder)}`,
    `- **Entered date (unverified):** \`${recordedOn}\``,
    '- **Handling:** `local draft; publication is not authorised by this maker`',
    '',
    ...recordSection('one', recordOne),
    ...recordSection('two', recordTwo),
    '## Question raised',
    '',
    'How, if at all, can both records hold?',
    '',
    ...textSection('Uncertainty or other explanations', explanations, 'Context, changed belief, translation, source error, incomplete evidence, or a recorder\'s mistake may explain any apparent difference.'),
    ...textSection('Independent recheck', recheck, 'Not yet rechecked.'),
    ...textSection('Known limits', knownLimits, 'No additional limits stated beyond the proof boundary at the top of this note.'),
    ...textSection('Correction or safety-removal path', correctionPath, 'No path supplied.'),
    ...textSection('Linked correction or redaction', linkedCorrection, 'No linked correction or redaction is included in this draft. This says nothing about response or nonresponse.'),
    '## Use boundary',
    '',
    '- Make the claim answerable; never make a person answer.',
    '- One note compares one pair of records. It never becomes a dossier.',
    '- Do not include private messages, secrets, personal data, contact details, location, employer, device data, or another person\'s unshared story.',
    '- Do not use a note to name private people or minors, provoke or impersonate someone, hide a recording, or make employment, housing, credit, education, medical, policing, immigration, or another high-impact decision.',
    '- A difference is a question before it is a contradiction. Contradiction alone would still not prove intent, deception, motive, or guilt.',
    '- Silence, refusal, absence, rest, or leaving are not admission and receive no score, deadline, or repeat pressure.',
    '- Never aggregate notes into a person score, trust total, blacklist, registry, feed, or punishment.',
    '- The same evidence, context, and correction standards apply to the recorder.',
    '',
  ].join('\n')

  if (new TextEncoder().encode(note).byteLength > 32 * 1024) {
    throw new Error('Keep this first comparison note within 32 KiB.')
  }
  return note
}

function localDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function valuesFrom(form) {
  return Object.fromEntries(new FormData(form).entries())
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value)
    return
  }
  const field = document.createElement('textarea')
  const returnFocus = document.activeElement
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } finally {
    field.remove()
    if (returnFocus instanceof HTMLElement) returnFocus.focus()
  }
  if (!copied) throw new Error('Copy was unavailable. Select the note text instead.')
}

const form = typeof document === 'undefined' ? null : document.querySelector('#receipt-form')

if (form) {
  const dateField = document.querySelector('#recorded-on')
  const output = document.querySelector('#receipt-output')
  const status = document.querySelector('#receipt-status')
  const copyButton = document.querySelector('#copy-receipt')
  const downloadButton = document.querySelector('#download-receipt')

  const ensureDate = () => {
    if (!dateField.value) dateField.value = localDate()
  }

  const render = () => {
    ensureDate()
    try {
      const note = makeComparison(valuesFrom(form))
      output.textContent = note
      copyButton.disabled = false
      downloadButton.disabled = false
      status.textContent = 'Local preview ready. This page made no network request containing field values and published nothing.'
      return note
    } catch (error) {
      copyButton.disabled = true
      downloadButton.disabled = true
      output.textContent = 'Complete every required field to make a local comparison note.'
      status.textContent = error.message
      return null
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    render()
  })

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      ensureDate()
      render()
    }, 0)
  })

  form.addEventListener('input', () => {
    copyButton.disabled = true
    downloadButton.disabled = true
    output.textContent = 'Fields changed. Make the note again to refresh this preview.'
    status.textContent = 'Fields changed. The earlier preview was cleared.'
  })

  copyButton.addEventListener('click', async () => {
    const note = render()
    if (!note) return
    try {
      await copyText(note)
      status.textContent = 'Note copied to the OS clipboard, which may retain or sync it. This page made no network request containing field values.'
    } catch (error) {
      status.textContent = error.message
    }
  })

  downloadButton.addEventListener('click', () => {
    const note = render()
    if (!note) return
    const file = new Blob([note], { type: 'text/markdown;charset=utf-8' })
    const href = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = href
    link.download = 'claim-comparison-note.md'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(href), 0)
    status.textContent = "Note downloaded to the browser's chosen folder, which may sync. This page made no network request containing field values."
  })

  render()
}
