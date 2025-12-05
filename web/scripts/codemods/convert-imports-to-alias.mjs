#!/usr/bin/env node
import path from 'node:path'
import fs from 'node:fs/promises'
import { globby } from 'globby'
import recast from 'recast'
import * as babelParser from 'recast/parsers/babel'

// Simple codemod: convert relative imports within src/ to use the '@' alias.
// Usage: node scripts/codemods/convert-imports-to-alias.mjs

const cwd = process.cwd()
const srcRoot = path.resolve(cwd, 'src')
const alias = '@'

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function rewriteImport(filePath, value) {
  if (!value || typeof value !== 'string') return value
  // Ignore bare package imports
  if (!value.startsWith('.')) return value
  // Resolve absolute path of the import target
  const abs = path.resolve(path.dirname(filePath), value)
  // Only rewrite if target is under src/
  if (!abs.startsWith(srcRoot)) return value
  const rel = toPosix(path.relative(srcRoot, abs))
  return `${alias}/${rel}`
}

async function processFile(file) {
  const src = await fs.readFile(file, 'utf8')
  const ast = recast.parse(src, { parser: babelParser })
  let changed = false

  recast.types.visit(ast, {
    visitImportDeclaration(pathNode) {
      const source = pathNode.value.source
      if (source && source.value) {
        const next = rewriteImport(file, source.value)
        if (next !== source.value) {
          source.value = next
          changed = true
        }
      }
      this.traverse(pathNode)
    },
    visitExportAllDeclaration(pathNode) {
      const source = pathNode.value.source
      if (source && source.value) {
        const next = rewriteImport(file, source.value)
        if (next !== source.value) {
          source.value = next
          changed = true
        }
      }
      this.traverse(pathNode)
    },
    visitExportNamedDeclaration(pathNode) {
      const source = pathNode.value.source
      if (source && source.value) {
        const next = rewriteImport(file, source.value)
        if (next !== source.value) {
          source.value = next
          changed = true
        }
      }
      this.traverse(pathNode)
    },
  })

  if (changed) {
    const output = recast.print(ast).code
    await fs.writeFile(file, output, 'utf8')
    return true
  }
  return false
}

async function main() {
  const patterns = [
    'src/**/*.js',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.tsx',
  ]
  const files = await globby(patterns, { cwd })
  let count = 0
  for (const f of files) {
    const full = path.resolve(cwd, f)
    const changed = await processFile(full)
    if (changed) count++
  }
  console.log(`Converted ${count} files to '${alias}' alias imports.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})