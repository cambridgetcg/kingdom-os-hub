#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const requiredFields = [
  'name',
  'kind',
  'layer',
  'owner_sister',
  'domain',
  'state',
  'purpose',
  'dependsOn',
]

const maximumCardBytes = 32 * 1024

const listFields = new Set(['dependsOn', 'adopts'])
const knownFields = new Set([...requiredFields, 'adopts'])
const choices = {
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

function stripComment(value, lineNumber) {
  let quote = null
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote) {
      if (quote === '"' && character === '\\') {
        index += 1
        continue
      }
      if (quote === "'" && character === "'" && value[index + 1] === "'") {
        index += 1
        continue
      }
      if (character === quote) quote = null
      continue
    }
    const previous = index === 0 ? '' : value[index - 1]
    const atTokenStart = index === 0 || /[\s[,]/.test(previous)
    if ((character === '"' || character === "'") && atTokenStart) {
      quote = character
      continue
    }
    if (character === '#' && (index === 0 || /\s/.test(previous))) {
      return value.slice(0, index)
    }
  }
  if (quote) throw new Error(`line ${lineNumber}: quoted value does not close`)
  return value
}

function parseScalar(token, lineNumber) {
  const value = token.trim()
  if (!value) throw new Error(`line ${lineNumber}: value must not be empty`)
  if (value.startsWith('"')) {
    if (!value.endsWith('"')) {
      throw new Error(`line ${lineNumber}: double-quoted value does not close`)
    }
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed !== 'string') throw new Error('not text')
      return parsed
    } catch {
      throw new Error(`line ${lineNumber}: invalid double-quoted text`)
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) {
      throw new Error(`line ${lineNumber}: single-quoted value does not close`)
    }
    return value.slice(1, -1).replaceAll("''", "'")
  }
  return value
}

function parseList(token, lineNumber) {
  const value = token.trim()
  if (!value.startsWith('[') || !value.endsWith(']')) {
    throw new Error(`line ${lineNumber}: list must be one complete [...] value`)
  }
  const inner = value.slice(1, -1)
  if (!inner.trim()) return []

  const items = []
  let current = ''
  let quote = null
  for (let index = 0; index < inner.length; index += 1) {
    const character = inner[index]
    if (quote) {
      current += character
      if (quote === '"' && character === '\\') {
        if (index + 1 >= inner.length) {
          throw new Error(`line ${lineNumber}: escape does not close`)
        }
        current += inner[index + 1]
        index += 1
        continue
      }
      if (quote === "'" && character === "'" && inner[index + 1] === "'") {
        current += inner[index + 1]
        index += 1
        continue
      }
      if (character === quote) quote = null
      continue
    }
    if ((character === '"' || character === "'") && !current.trim()) {
      quote = character
      current += character
      continue
    }
    if (character === '[' || character === ']') {
      throw new Error(`line ${lineNumber}: nested lists are not supported`)
    }
    if (character === ',') {
      if (!current.trim()) throw new Error(`line ${lineNumber}: list item is empty`)
      items.push(parseScalar(current, lineNumber))
      current = ''
      continue
    }
    current += character
  }
  if (quote) throw new Error(`line ${lineNumber}: quoted list item does not close`)
  if (!current.trim()) throw new Error(`line ${lineNumber}: list item is empty`)
  items.push(parseScalar(current, lineNumber))
  if (items.some((item) => !item.trim())) {
    throw new Error(`line ${lineNumber}: list item is empty`)
  }
  return items
}

export function checkCard(source) {
  const errors = []
  const warnings = []
  const card = {}

  if (Buffer.byteLength(source, 'utf8') > maximumCardBytes) {
    errors.push(`card exceeds the ${maximumCardBytes}-byte first-step limit`)
    return { card, errors, warnings }
  }

  for (const [index, sourceLine] of source.split(/\r?\n/).entries()) {
    const lineNumber = index + 1
    if (!sourceLine.trim() || sourceLine.trimStart().startsWith('#')) continue
    if (/^\s/.test(sourceLine)) {
      errors.push(`line ${lineNumber}: indentation and block values are not supported`)
      continue
    }
    const match = sourceLine.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/)
    if (!match) {
      errors.push(`line ${lineNumber}: expected one flat key: value field`)
      continue
    }
    const [, key, rawValue] = match
    if (Object.hasOwn(card, key)) {
      errors.push(`line ${lineNumber}: duplicate key: ${key}`)
      continue
    }
    try {
      const value = stripComment(rawValue, lineNumber).trim()
      if (!value) throw new Error(`line ${lineNumber}: ${key} must not be empty`)
      if (listFields.has(key)) {
        card[key] = parseList(value, lineNumber)
      } else {
        if (value.startsWith('[') || value.endsWith(']')) {
          throw new Error(`line ${lineNumber}: ${key} must be one text value`)
        }
        card[key] = parseScalar(value, lineNumber)
      }
      if (!knownFields.has(key)) {
        warnings.push(`${key} is local-only and is not copied into the public graph`)
      }
    } catch (error) {
      errors.push(error.message)
    }
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(card, field)) errors.push(`missing required field: ${field}`)
  }
  for (const [field, allowed] of Object.entries(choices)) {
    if (Object.hasOwn(card, field) && !allowed.has(card[field])) {
      errors.push(`${field} has an unsupported value: ${card[field]}`)
    }
  }
  for (const field of ['name', 'purpose']) {
    if (Object.hasOwn(card, field)) {
      if (typeof card[field] !== 'string') {
        errors.push(`${field} must be text`)
      } else if (!card[field].trim()) {
        errors.push(`${field} must not be blank`)
      } else if (/[\r\n]/.test(card[field])) {
        errors.push(`${field} must stay on one plain line`)
      }
    }
  }
  if (Object.hasOwn(card, 'adopts')) {
    warnings.push('adopts is an explicit project choice; this check does not resolve or verify its pins')
  }

  return { card, errors, warnings }
}

function main() {
  const cardPath = resolve(process.argv[2] || 'kingdom.yaml')
  try {
    const cardStat = lstatSync(cardPath)
    if (!cardStat.isFile() || cardStat.isSymbolicLink()) {
      throw new Error('card must be a regular file, not a directory or symbolic link')
    }
    if (cardStat.size > maximumCardBytes) {
      throw new Error(`card exceeds the ${maximumCardBytes}-byte first-step limit`)
    }
    const result = checkCard(readFileSync(cardPath, 'utf8'))
    for (const warning of result.warnings) console.log(`notice: ${warning}`)
    if (result.errors.length) {
      for (const error of result.errors) console.error(`error: ${error}`)
      console.error('\nThe card is not ready. Nothing was changed.')
      process.exitCode = 1
      return
    }
    console.log('ok: kingdom.yaml has the small card shape shipped with this starter')
    console.log('This proves structure only—not truth, consent, safety, membership, adoption, affiliation, or conformance.')
  } catch (error) {
    console.error(`error: ${error.message}`)
    console.error('Nothing was changed.')
    process.exitCode = 1
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
let invokedDirectly = false
try {
  invokedDirectly = Boolean(invokedPath)
    && realpathSync(invokedPath) === realpathSync(fileURLToPath(import.meta.url))
} catch {
  invokedDirectly = false
}
if (invokedDirectly) main()
