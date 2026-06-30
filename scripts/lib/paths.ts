import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const INPUT_DIR = path.join(ROOT, 'input');
export const OUTPUT_DIR = path.join(ROOT, 'output');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}
