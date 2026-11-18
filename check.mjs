import fs from 'node:fs/promises';
import path from 'node:path';
import {root, figures, downloads, getReleaseUrl, getBeaconToken} from './release.mjs';
import {views} from './src/refinements.mjs';
import {projects} from './src/projects.mjs';

const review = process.argv.includes('--release-review');
const dist = path.join(root, review ? 'dist-release-review' : 'dist');
const pages = [
  'index.html', 'research.html', 'projects.html', 'publications.html', 'about.html', 'cv.html',
  'privacy.html', '404.html', ...projects.map(project => project.slug + '.html'),
];
const assets = figures.map(file => 'assets/' + file);
const files = [
  ...pages, ...assets, ...downloads.map(file => 'downloads/' + file),
  'app.js', 'style.css', '.nojekyll', 'robots.txt',
];
const expected = new Set(files);
const problems = [];
let links = 0;

async function inventory(dir = '') {
  for (const entry of await fs.readdir(path.join(dist, dir), {withFileTypes:true})) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory() && ['assets','downloads'].includes(relative)) {
      await inventory(relative);
    } else if (!entry.isFile() || !expected.delete(relative)
      || (await fs.lstat(path.join(dist,relative))).nlink !== 1) {
      problems.push('Unexpected output: ' + relative);
    }
  }
}
await inventory();
for (const file of expected) problems.push('Missing output: ' + file);
if (problems.length) throw new Error(problems.join('\n'));

const html = new Map(await Promise.all(pages.map(async file => [
  file, await fs.readFile(path.join(dist,file),'utf8'),
])));
const home = html.get('index.html');
const publicBuild = home.includes('content="index,follow"');
const siteUrl = publicBuild || review ? getReleaseUrl() : null;
const beaconUrl = 'https://static.cloudflareinsights.com/beacon.min.js';
const token = publicBuild ? getBeaconToken() : '';
const beaconCount = token ? 1 : 0;
const credentialPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[a-zA-Z0-9]{24,}|github_pat_[a-zA-Z0-9_]{24,}|(?:AKIA|ASIA)[A-Z0-9]{16}/;
const localPathPattern = /(?:127\.0\.0\.1|localhost|\/Users\/|codex-file-citation)/i;
const base = siteUrl?.pathname || '/';

for (const [file, markup] of html) {
  for (const [,url] of markup.matchAll(/\b(?:href|src|data-original)="([^"]+)"/g)) {
    if (/^(https:|mailto:|data:)/.test(url)) continue;
    const [route,anchor] = url.split('#');
    const target = route.startsWith(base) ? (route.slice(base.length) || 'index.html') : (route || file);
    if (!files.includes(target)) problems.push(`${file}: missing or disallowed path ${url}`);
    if (anchor && !html.get(target)?.includes(`id="${anchor}"`)) problems.push(`${file}: missing anchor ${url}`);
    links++;
  }
  if (!markup.includes('lang="en"') || !markup.includes('name="viewport"')) problems.push(`${file}: metadata`);
  if (/lorem ipsum|YOUR-USERNAME|\[specific research/i.test(markup)) problems.push(`${file}: placeholder`);
  const remoteScripts = [...markup.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match=>match[1]).filter(url=>url!=='app.js');
  const count = file==='404.html' ? 0 : beaconCount;
  if (credentialPattern.test(markup) || localPathPattern.test(markup)) problems.push(`${file}: sensitive text pattern`);
  const beacons = [...markup.matchAll(/data-cf-beacon="([^"]*)"/g)].map(match => match[1]);
  if (beacons.length !== count || (count && beacons[0] !== `{&quot;token&quot;:&quot;${token}&quot;}`)) {
    problems.push(`${file}: incorrect Beacon configuration`);
  }
  if (remoteScripts.length !== count || remoteScripts.some(url=>url!==beaconUrl)) problems.push(`${file}: incorrect analytics script`);
  if (siteUrl && file!=='404.html') {
    const canonical = new URL(file==='index.html'?'':file,siteUrl);
    if (!markup.includes(`rel="canonical" href="${canonical.href}"`)) problems.push(`${file}: canonical URL`);
  }
}

const script = await fs.readFile(path.join(dist,'app.js'),'utf8');
if (credentialPattern.test(script) || localPathPattern.test(script)) problems.push('app.js: sensitive text pattern');
for (const [key,[asset]] of Object.entries(views)) {
  if (!home.includes(`data-view="${key}"`) || !script.includes(JSON.stringify(asset)) || !assets.includes('assets/'+asset)) {
    problems.push(`Unwired figure selector: ${key}`);
  }
  links++;
}
for (const file of [...assets,...downloads.map(name=>'downloads/'+name)]) {
  const source = file.replace(/^downloads\//,'local-downloads/');
  const [out,input] = await Promise.all([fs.readFile(path.join(dist,file)),fs.readFile(path.join(root,source))]);
  if (!out.equals(input)) problems.push('Mismatched public asset: ' + file);
}
const robots = await fs.readFile(path.join(dist,'robots.txt'),'utf8');
if (!robots.includes(publicBuild ? 'Allow: /' : 'Disallow: /')) problems.push('Incorrect robots policy');
if (problems.length) throw new Error(problems.join('\n'));
console.log(`Passed: ${pages.length} HTML files, ${links} local links/anchors and ${files.length} allowlisted output files. Analytics ${beaconCount ? 'configured' : 'off'}.`);
