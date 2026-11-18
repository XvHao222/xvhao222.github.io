import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projects} from './src/projects.mjs';
import {extraAssets} from './src/refinements.mjs';

export const root = path.dirname(fileURLToPath(import.meta.url));
export const figures = [...new Set([...extraAssets, ...projects.map(project => project.image)])];
export const downloads = ['research-cv.pdf', 'research-portfolio.pdf'];
export const sourceFiles = [
  '.gitignore', '.github/workflows/pages.yml', 'package.json', 'build.mjs', 'check.mjs',
  'release.mjs', 'release-check.mjs', 'release-approval.json',
  'src/projects.mjs', 'src/refinements.mjs', 'src/tokens.css', 'src/style.css',
  ...figures.map(file => 'assets/' + file),
  ...downloads.map(file => 'local-downloads/' + file),
];

export async function requireApproval() {
  const approvals = JSON.parse(await fs.readFile(path.join(root, 'release-approval.json'), 'utf8'));
  if (['summaries', 'figures', 'cv', 'portfolio'].some(name => approvals[name] !== true)
    || projects.some(project => project.publicApproved !== true)) {
    throw new Error('Public release requires approval of all included summaries, figures and downloads. Use npm run pages:review for local review.');
  }
}

export function getReleaseUrl() {
  const url = new URL(process.env.SITE_URL || '');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
    || !/^(\/[\w.-]+)*\/?$/.test(url.pathname)) {
    throw new Error('SITE_URL must be an HTTPS Pages base URL.');
  }
  url.pathname = url.pathname.replace(/\/?$/, '/');
  return url;
}

export function getBeaconToken() {
  const token = process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim() || '';
  if (token && !/^[a-f0-9]{32}$/i.test(token)) {
    throw new Error('Use the Beacon Token from the Cloudflare Web Analytics snippet.');
  }
  return token;
}

export async function copyPublicInput(relative, destination) {
  const source = path.join(root, relative);
  const info = await fs.lstat(source);
  if (!info.isFile() || info.nlink !== 1 || await fs.realpath(source) !== source) {
    throw new Error('Expected a regular local file: ' + relative);
  }
  await fs.copyFile(source, destination);
}
