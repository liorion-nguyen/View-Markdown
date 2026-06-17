import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BIN_DIR = resolve(ROOT, 'bin');
const PANDOC_BIN = resolve(BIN_DIR, 'pandoc');
const VERSION = process.env.PANDOC_VERSION || '3.10';
const ARCHIVE = `pandoc-${VERSION}-linux-amd64.tar.gz`;
const URL = `https://github.com/jgm/pandoc/releases/download/${VERSION}/${ARCHIVE}`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} thất bại (exit ${result.status})`);
  }
}

if (existsSync(PANDOC_BIN)) {
  // eslint-disable-next-line no-console
  console.log(`Pandoc binary đã tồn tại: ${PANDOC_BIN}`);
  process.exit(0);
}

mkdirSync(BIN_DIR, { recursive: true });

// eslint-disable-next-line no-console
console.log(`Đang tải Pandoc ${VERSION} cho Linux amd64...`);
run('curl', ['-L', URL, '-o', '/tmp/pandoc.tar.gz']);
run('tar', ['-xzf', '/tmp/pandoc.tar.gz', '-C', '/tmp']);
run('cp', [`/tmp/pandoc-${VERSION}/bin/pandoc`, PANDOC_BIN]);
chmodSync(PANDOC_BIN, 0o755);

// eslint-disable-next-line no-console
console.log(`Cài xong Pandoc binary: ${PANDOC_BIN}`);
