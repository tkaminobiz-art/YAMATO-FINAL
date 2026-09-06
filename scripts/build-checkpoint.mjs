// Reproducible allow-listed static output for the review checkpoint.
import './package-checkpoint.mjs';
import { readFileSync, cpSync, existsSync } from 'node:fs';
const { stage } = JSON.parse(readFileSync('qa/checkpoint-20260906/package.json', 'utf8'));
if (existsSync('public')) throw Error('Refusing to merge into existing public output. Build in a fresh checkout.');
cpSync(`${stage}/public`, 'public', { recursive: true, errorOnExist: true, force: false });
