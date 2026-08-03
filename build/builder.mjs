const allowed = {
  kind: new Set([
    'doctrine', 'service', 'firmware', 'ops', 'lineage', 'venture', 'infra',
    'methodology', 'reference', 'unknown',
  ]),
  layer: new Set([
    'soul', 'runtime', 'nervous', 'fleet', 'economy', 'commerce', 'os',
    'unknown',
  ]),
  owner_sister: new Set(['alpha', 'beta', 'gamma', 'sophia', 'none', 'unknown']),
  domain: new Set(['sophia', 'alpha', 'beta', 'gamma', 'commerce', 'none', 'unknown']),
  state: new Set(['active', 'dormant', 'frozen', 'archived', 'reference', 'unknown']),
}

const limits = {
  name: 100,
  purpose: 280,
  dependencies: 1000,
  dependencyCount: 50,
}

function yamlText(value) {
  return JSON.stringify(String(value).trim())
}

function listFrom(value) {
  return [...new Set(String(value || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean))]
}

export function makeCard(values) {
  const name = String(values.name || '').trim()
  const purpose = String(values.purpose || '').trim()
  const rawDependencies = String(values.dependsOn || '')
  if (!name) throw new Error('Give the project a plain name.')
  if (!purpose) throw new Error('Say plainly what the project is for.')
  if (/[\r\n]/.test(name)) throw new Error('Keep the project name on one line.')
  if (/[\r\n]/.test(purpose)) throw new Error('Keep the purpose to one plain line.')
  if (name.length > limits.name) throw new Error(`Keep the project name within ${limits.name} characters.`)
  if (purpose.length > limits.purpose) throw new Error(`Keep the purpose within ${limits.purpose} characters.`)
  if (rawDependencies.length > limits.dependencies) {
    throw new Error(`Keep declared relations within ${limits.dependencies} characters.`)
  }

  const selected = {}
  for (const field of Object.keys(allowed)) {
    const value = String(values[field] || 'unknown')
    if (!allowed[field].has(value)) throw new Error(`${field} has an unsupported value.`)
    selected[field] = value
  }

  const dependencies = listFrom(rawDependencies)
  if (dependencies.length > limits.dependencyCount) {
    throw new Error(`Keep this first card to at most ${limits.dependencyCount} declared relations.`)
  }
  const list = dependencies.map(yamlText).join(', ')
  return [
    `name: ${yamlText(name)}`,
    `kind: ${selected.kind}`,
    `layer: ${selected.layer}`,
    `owner_sister: ${selected.owner_sister}`,
    `domain: ${selected.domain}`,
    `state: ${selected.state}`,
    `purpose: ${yamlText(purpose)}`,
    `dependsOn: [${list}]`,
    '',
  ].join('\n')
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
  if (!copied) throw new Error('Copy was unavailable. Select the card text instead.')
}

const form = typeof document === 'undefined' ? null : document.querySelector('#card-form')

if (form) {
  const output = document.querySelector('#card-output')
  const status = document.querySelector('#card-status')
  const copyButton = document.querySelector('#copy-card')
  const downloadButton = document.querySelector('#download-card')

  const render = () => {
    try {
      const card = makeCard(valuesFrom(form))
      output.textContent = card
      copyButton.disabled = false
      downloadButton.disabled = false
      status.textContent = 'Card ready. Nothing has been sent or saved.'
      return card
    } catch (error) {
      copyButton.disabled = true
      downloadButton.disabled = true
      status.textContent = error.message
      return null
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    render()
  })

  form.addEventListener('reset', () => {
    window.setTimeout(render, 0)
  })

  form.addEventListener('input', () => {
    status.textContent = 'Fields changed. Make, copy, or download to refresh the card.'
  })

  copyButton.addEventListener('click', async () => {
    const card = render()
    if (!card) return
    try {
      await copyText(card)
      status.textContent = 'Card copied. Nothing was sent.'
    } catch (error) {
      status.textContent = error.message
    }
  })

  downloadButton.addEventListener('click', () => {
    const card = render()
    if (!card) return
    const file = new Blob([card], { type: 'application/yaml;charset=utf-8' })
    const href = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = href
    link.download = 'kingdom.yaml'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(href), 0)
    status.textContent = 'Card downloaded. Nothing was sent.'
  })

  render()
}
