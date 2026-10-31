import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { run, tmp, fixtures } from './helpers.mjs'

test('renders report.md into a self-contained page in the report language', () => {
  const dir = tmp(); cpSync(join(fixtures, 'run-ru'), dir, { recursive: true })
  assert.equal(run('report.mjs', [dir]).code, 0)
  const html = readFileSync(join(dir, 'report.html'), 'utf8')
  assert.match(html, /<html lang="ru">/)
  assert.match(html, /<h2>Вердикт<\/h2>/)
  assert.match(html, /<table>/)
})
