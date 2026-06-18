#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportMarkdownToDocx } from './pandoc-export.mjs';
import { preprocessMarkdown } from '../src/preprocess.js';

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  console.error('Cách dùng: npm run export:docx -- <input.md> [output.docx]');
  process.exit(1);
}

const input = resolve(inputPath);
const output = resolve(outputPath || input.replace(/\.md$/i, '.docx'));

const source = readFileSync(input, 'utf8');
const buffer = await exportMarkdownToDocx(preprocessMarkdown(source));

writeFileSync(output, buffer);
console.log(`Đã xuất: ${output}`);
