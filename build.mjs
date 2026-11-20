import fs from 'node:fs/promises';import path from 'node:path';import {projects,profile,lowFrequency,boundaryComparison,researchInterests} from './src/projects.mjs';import {edu,more,technicalContent,heroVisual,views} from './src/refinements.mjs';
import {root, figures, downloads, requireApproval, getReleaseUrl, getBeaconToken, copyPublicInput} from './release.mjs';

const preview = process.argv.includes('--preview');
const review = process.argv.includes('--release-review');
if (preview && review) throw new Error('Select one build mode.');
const production = !preview && !review;
if (production) await requireApproval();
const siteUrl = preview ? null : getReleaseUrl();
const token = production ? getBeaconToken() : '';
const dist = path.join(root, review ? 'dist-release-review' : 'dist');
await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(path.join(dist,'assets'),{recursive:true});
await fs.mkdir(path.join(dist,'downloads'),{recursive:true});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const nav=[['Home','index.html'],['Research','research.html'],['Engineering','ue5.html'],['Publications','publications.html'],['About','about.html'],['CV','cv.html']];
const figure=p=>`<figure><button class="zoom" aria-label="Enlarge ${esc(p.alt)}"><img src="assets/${p.image}" alt="${esc(p.alt)}" loading="lazy" width="1200" height="600"></button><figcaption>${p.caption}</figcaption></figure>`;
const pub=p=>`<article class="publication"><div class="eyebrow">${p.slug==='paper2' ? 'Manuscript under review at Journal of Ocean Engineering and Marine Energy' : p.status}</div><div><h3><a href="${p.slug}.html">${p.formal}</a></h3><p>${p.authors.map(a=>a===profile.name?`<strong>${a}</strong>`:a).join(' · ')} · ${p.year}${p.journalReference ? `<br>${p.journalReference}` : ''}</p><a href="${p.slug}.html">Research summary →</a>${p.links.map(([t,u])=>`<a class="publication-link" href="${u}">${t} ↗</a>`).join('')}</div></article>`;
const head=(label,title,desc='')=>`<div class="page-head"><div class="eyebrow">${label}</div><h1>${title}</h1>${desc?`<p class="lead">${desc}</p>`:''}</div>`;
const [, staticStudy, boundaryStudy, dynamicStudy] = projects;
const papers = [staticStudy, boundaryStudy, dynamicStudy];
const summary = {
  paper1: 'A structured surrogate predicts the full 41-node line shape. Two-stage training gives extra weight to the fairlead, where the line connects to the structure.',
  paper2: 'A reference line joins the prescribed endpoints. The learned correction vanishes at both ends, and a separate vertical clamp keeps the predicted height at or above the seabed.',
  paper3: lowFrequency.findings,
  ue5: 'I integrated simulated data into UE5, implemented interface navigation and tested the runtime. A standard TCP message was received and displayed in a packaged Windows Development build.',
};
const overview = (p, blurb=summary[p.slug]) => `<article class="study-summary">
  <p class="eyebrow">${p.status}</p>
  <h3><a href="${p.slug}.html">${p.title}</a></h3>
  <p>${blurb}</p>
  <a class="read" href="${p.slug}.html">Explore the study →</a>
  ${p.links.map(([label,url])=>`<a class="read" href="${url}">${label} ↗</a>`).join('')}
</article>`;
const email = `<a href="mailto:${profile.email}">Email Xuhao</a>`;
const homeTitle = profile.name;
const degree = 'Master’s candidate in Mechanical Engineering';
const homeIntro = 'I study how physical constraints and reduced-order models affect the accuracy and cost of engineering simulations. Using mooring lines as a test case, I compare when these choices improve estimates of geometry and tension, and when a simpler model performs better.';
const interestsLink = '<a href="research.html#interests">Research interests →</a>';
const pages={};
pages['index.html'] = `<section class="hero"><div class="hero-grid"><div>
  <div class="eyebrow">Scientific machine learning · Computational mechanics</div>
  <h1>${homeTitle}</h1>
  <p class="identity">${degree}<br>${profile.affiliation}</p>
  <p class="phd-intent">Seeking PhD opportunities for 2027</p>
  <p class="lead">${homeIntro}</p>
  <div class="actions"><a class="primary" href="research.html">Explore research →</a><a href="downloads/research-cv.pdf">View research CV (PDF)</a></div>
</div>${heroVisual}</div></section>
<section class="section" id="selected"><div class="section-top"><h2>Selected work</h2>${interestsLink}</div><div class="study-list">${overview(staticStudy, 'Two-stage training focuses the surrogate on the fairlead while retaining predictions of the full 41-node line shape. In a separate global-3D benchmark, it achieved 29.78× same-machine CPU throughput at batch size 1,000.') + overview(dynamicStudy)}</div></section>`;
pages['research.html'] = head('Research','Research and future directions','My work combines computational mechanics and scientific machine learning. I am interested in applying these methods to structural dynamics and marine engineering.') +
  `<section class="section research-section" aria-labelledby="studies-heading">
    <h2 id="studies-heading">From static geometry to dynamic response</h2>
    <p>I began by asking whether a learned model could screen static line shapes efficiently. That led me to two further questions: which geometric conditions can be guaranteed by construction, and when does a quasi-static reference help estimate a moving line’s response?</p>
    <div class="research-list">${papers.map(p=>overview(p)).join('')}</div>
  </section>
  <section class="section research-section" id="interests" aria-labelledby="interests-heading">
    <h2 id="interests-heading">Research interests</h2>
    <p>These are questions I would like to explore during a PhD.</p>
    <div class="interest-list">${researchInterests.map(([title,question,detail])=>`<div><h3>${title}</h3><p>${question}</p>${detail ? `<p>${detail}</p>` : ''}</div>`).join('')}</div>
  </section>
  <section class="section"><h2>Engineering prototype</h2><p>I integrated simulated subsea monitoring data into a UE5 interface and tested the packaged runtime.</p><a href="ue5.html">Explore the UE5 prototype →</a></section>`;
pages['projects.html'] = head('Engineering','From simulated data to a working interface','A locally tested UE5 prototype for subsea cable visualisation.') + '<p><a href="ue5.html">Open the UE5 project →</a></p>';
pages['publications.html'] = head('Research record','Publications & manuscripts') + papers.map(pub).join('');
pages['about.html'] = head('About',profile.name,'I work at the intersection of computational mechanics and scientific machine learning at Harbin Engineering University. My current research focuses on static and dynamic mooring-line response.') + `<p class="about-interests">${interestsLink}</p>` + edu +
  `<section class="section two"><div><h2>Engineering experience</h2><p>My undergraduate robot-head design work involved SolidWorks, D–H kinematics, actuator selection and finite-element structural checks. My graduate professional practice included UE5 integration and runtime testing.</p><a href="research.html">Explore my research →</a></div><div><h2>Methods & tools</h2><p>Python, PyTorch, NumPy, MoorPy, MoorDyn, POD and GRU workflows, Git and LaTeX. Engineering software includes SolidWorks and UE5.</p><p>${email}</p></div></section>`;
pages['cv.html'] = head('Curriculum vitae','Research CV',`${degree} at ${profile.affiliation}. Expected completion in June 2027.`) +
  `<section class="section two"><div><a class="primary file-link" href="downloads/research-cv.pdf">Research CV (PDF, 2 pages)</a><p>Education, publications and engineering experience.</p></div><div><h2>Research portfolio</h2><p>An offline overview with figures from the three numerical studies and a page on the UE5 prototype.</p><a class="file-link" href="downloads/research-portfolio.pdf">Download research portfolio (5-page PDF)</a></div></section>`;
pages['privacy.html'] = head('Privacy','Privacy & analytics') +
  `<section class="section"><p>${token ? 'This site uses Cloudflare Web Analytics for aggregate page views and page performance.' : 'Analytics is currently disabled in this version. The site is configured to support Cloudflare Web Analytics for aggregate page views and page performance.'}</p>
  <p>The analytics beacon uses a site token. The site does not use analytics cookies, browser fingerprinting or personal visitor profiles. The light and dark theme preference is stored locally in your browser.</p>
  <p><a href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</a> · ${email}</p></section>`;
const equation = `<math aria-label="Predicted geometry at output position i equals the reference plus an envelope times the learned correction">
  <mrow><msub><mover><mi>y</mi><mo>^</mo></mover><mi>i</mi></msub><mo>=</mo>
  <mi>b</mi><mo>(</mo><msub><mi>τ</mi><mi>i</mi></msub><mo>)</mo><mo>+</mo>
  <msub><mi>τ</mi><mi>i</mi></msub><mo>(</mo><mn>1</mn><mo>−</mo><msub><mi>τ</mi><mi>i</mi></msub><mo>)</mo>
  <msub><mi>δ</mi><mi>i</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo></mrow>
</math><p>The baseline <i>b</i>(<i>τ</i>) is the straight line between the two prescribed endpoints. The network learns the geometric correction <i>δ</i>.</p><p>At output node <i>i</i>, <i>τ</i><sub>i</sub> gives its normalised position and <i>δ</i><sub>i</sub>(<i>x</i>) is the correction computed from the model inputs. The factor <i>τ</i><sub>i</sub>(1 − <i>τ</i><sub>i</sub>) vanishes at both endpoints.</p>`;
const openingEvidence = {
  paper1: `<ul class="lead-metrics">${[[0,'Accuracy'],[2,'Batch throughput']].map(([index,label])=>`<li><strong>${label}</strong> · ${staticStudy.highlights[index]}</li>`).join('')}</ul>`,
  paper2: equation + `<div class="lead-results"><h2>Test on a held-out interval of the dimensionless parameter χ</h2><p class="figure-context">${boundaryComparison.context}</p>
    <dl class="model-comparison">${boundaryComparison.rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
  </div>`,
  paper3: `<p>Given the recent motion of the upper endpoint, I estimate the line shape and tension at the current time.</p><div class="table-wrap opening-results" tabindex="0" aria-label="Scrollable low-frequency results"><table>
    <caption>${lowFrequency.condition} · ${lowFrequency.source}</caption>
    <thead><tr><th scope="col">Metric</th><th scope="col">QS-only</th><th scope="col">QS-residual</th></tr></thead>
    <tbody>${lowFrequency.rows.map(([metric,qs,residual])=>`<tr><th scope="row">${metric}</th><td>${qs}</td><td>${residual}</td></tr>`).join('')}</tbody>
  </table></div><p class="figure-context">QS-residual values are three-seed means (± population SD where shown). QS-only is deterministic.</p>`,
};
const detailFigure = p => p.slug==='ue5' ? figure({...p,caption:'Original UE5 interface with simulated data. Charts and risk labels are demonstration content.'}) : figure(p);
const decomposition = `<p>Whole-window tension error at 0.05 Hz, from the latest manuscript’s Table 3. Projection is deterministic; coefficient and total RMSE are mean ± population SD across three training seeds.</p><div class="table-wrap" tabindex="0" aria-label="Scrollable error decomposition table"><table><thead><tr><th>Representation</th><th>Projection (N)</th><th>Coefficient RMSE (N)</th><th>Total RMSE (N)</th></tr></thead><tbody><tr><td>Raw-POD</td><td>17.825</td><td>39.41 ± 20.03</td><td>44.31 ± 17.55</td></tr><tr><td>Residual-POD</td><td>0.580</td><td>52.63 ± 9.24</td><td>52.63 ± 9.24</td></tr></tbody></table></div>`;
for (const p of projects) {
  const links = p.links.map(([label,url])=>`<a href="${url}">${label} ↗</a>`).join('');
  const findings = {
    paper1: [staticStudy.highlights[1]],
  }[p.slug] || p.highlights;
  pages[p.slug+'.html'] = `<div class="detail-head">${head(p.category,p.title)}
    <p class="formal-title">${p.formal}</p>
    <p class="status">${p.authors.join(' · ')} · ${p.status}</p>
  </div>
  <section class="study-opening" id="problem" aria-label="Study overview">
    ${p.slug==='ue5' ? detailFigure(p) : ''}
    <div><p class="lead">${summary[p.slug]}</p>${p.slug==='ue5' ? '' : `<p><strong>My contribution:</strong> ${p.contribution}</p>`}${openingEvidence[p.slug] || ''}</div>
    ${p.slug==='ue5' ? '' : detailFigure(p)}
  </section>
  <div class="article"><aside aria-label="On this page">${[
    ['methodology','Methodology'],['findings','Findings'],['limitations','Scope'],['links',p.slug==='ue5' ? 'Project record' : 'Sources & links']
  ].map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</aside><div>
    <section id="methodology"><h2>Methodology</h2><p>${p.method}</p>${more(p.slug==='ue5' ? 'Communication and verification' : 'Detailed method and validation protocol',technicalContent[p.slug])}</section>
    <section id="findings"><h2>Key findings</h2><ul>${findings.map(item=>`<li>${item}</li>`).join('')}</ul><p id="interpretation">${p.interpretation}</p>${p.decomposition?more('0.05 Hz · Projection and coefficient-estimation error',decomposition):''}</section>
    <section id="limitations"><h2>Scope & limitations</h2><p>${p.limitations}</p></section>
    <section id="links"><h2>${p.slug==='ue5' ? 'Project record' : 'Sources & links'}</h2>${p.slug==='ue5' ? '<p><a href="downloads/research-portfolio.pdf">Research portfolio (PDF)</a></p>' : `<p>${p.citations.join('<br>')}</p>${links}`}<p><a href="research.html">← Research overview</a></p>${p.slug==='paper1' ? '<p><a href="paper2.html">Next study: guaranteeing endpoint closure →</a></p>' : p.slug==='paper2' ? '<p><a href="paper3.html">Next study: testing a quasi-static reference in dynamics →</a></p>' : ''}</section>
  </div></div>`;
}
const script=`try{document.documentElement.dataset.theme=localStorage.getItem('theme')|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}addEventListener('DOMContentLoaded',()=>{const m=document.querySelector('#menu'),n=document.querySelector('.links');m.onclick=()=>{const open=n.classList.toggle('open');m.setAttribute('aria-expanded',open)};document.querySelector('#theme').onclick=()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{}};const dialog=document.querySelector('dialog');let origin;document.querySelectorAll('.zoom').forEach(b=>b.onclick=()=>{origin=b;const im=b.querySelector('img');dialog.querySelector('img').src=b.dataset.original||im.src;dialog.querySelector('img').alt=im.alt;dialog.querySelector('.zoom-caption').textContent=b.closest('figure').querySelector('figcaption')?.textContent||im.alt;dialog.showModal()});dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>origin?.focus());const views=${JSON.stringify(views)};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const v=views[b.dataset.view],viewer=b.closest('.research-viewer'),im=viewer.querySelector('img');im.src='assets/'+v[0];im.alt=v[1];viewer.querySelector('figcaption').textContent=v[2];const link=viewer.querySelector('.viewer-link');link.href=b.dataset.view==='static'?'paper1.html':'paper3.html';link.textContent=b.dataset.view==='static'?'Explore the static study →':'Explore the dynamic study →';viewer.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));viewer.querySelector('.zoom').setAttribute('aria-label','Enlarge '+v[1])});addEventListener('keydown',e=>{if(e.key==='Escape'){n.classList.remove('open');m.setAttribute('aria-expanded','false')}})});`;
await fs.writeFile(path.join(dist,'app.js'),script);await fs.writeFile(path.join(dist,'style.css'),await fs.readFile(path.join(root,'src/tokens.css'),'utf8')+await fs.readFile(path.join(root,'src/style.css'),'utf8'));
const descriptions = {
  'index.html': `${profile.name} · Mechanical Engineering master’s candidate · Seeking PhD opportunities for 2027. ${homeIntro}`,
  'research.html': 'Mooring response studies and future research interests in reduced-order modelling, structural dynamics, validation and uncertainty.',
  'publications.html': 'Published research and manuscripts by Xuhao Liu on static and dynamic mooring-line response.',
  'about.html': 'Xuhao Liu studies computational mechanics and scientific machine learning at Harbin Engineering University. Education, coursework and engineering experience.',
  'cv.html': 'Download Xuhao Liu’s research CV and five-page portfolio.',
  'projects.html': 'Explore a UE5 subsea cable visualisation prototype tested with simulated data.',
  'privacy.html': 'Privacy and aggregate analytics information for Xuhao Liu’s academic website.',
};
const beacon = token
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${esc(JSON.stringify({token}))}"></script>`
  : '';
const robots = production ? 'index,follow' : 'noindex,nofollow';
for(const [file,body] of Object.entries(pages)){const group=file.startsWith('paper')?'research.html':file==='projects.html'?'ue5.html':file;const title=file==='index.html'?`${homeTitle} | Computational Mechanics & Scientific Machine Learning`:projects.find(p=>file===p.slug+'.html')?.formal||`${file==='privacy.html'?'Privacy & analytics':nav.find(x=>x[1]===group)?.[0]} | Xuhao Liu`;const description=esc(descriptions[file] || summary[file.replace('.html','')]);const canonical=siteUrl && new URL(file==='index.html'?'':file,siteUrl).href;await fs.writeFile(path.join(dist,file),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="${robots}">${canonical?`<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">`: ''}<title>${esc(title)}</title><meta name="description" content="${description}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><meta property="og:image" content="${siteUrl ? esc(new URL('assets/paper1_fig6_slack_panel.png',siteUrl).href) : 'assets/paper1_fig6_slack_panel.png'}"><link rel="icon" href="data:,"><link rel="stylesheet" href="style.css"><script src="app.js"></script></head><body><a class="skip" href="#main">Skip to content</a><header><div class="wrap nav"><a class="brand" href="index.html">Xuhao Liu<span style="color:var(--teal)">.</span></a><button id="menu" aria-label="Toggle navigation" aria-controls="navigation" aria-expanded="false">Menu</button><nav class="links" id="navigation" aria-label="Main navigation">${nav.map(([t,u])=>`<a href="${u}" ${group===u?'aria-current="page"':''}>${t}</a>`).join('')}</nav><button id="theme" aria-label="Toggle light and dark theme">◐</button></div></header><main class="wrap" id="main">${body}</main><footer><div class="wrap"><div class="footer-top"><div>${email}<br><span>${profile.email}</span></div><div class="footer-links"><a href="${profile.orcid}">ORCID ↗</a><a href="cv.html">CV →</a><a href="privacy.html">Privacy & analytics</a></div></div><p class="fine">Xuhao Liu · Harbin Engineering University · Scientific Machine Learning for Engineering Systems</p></div></footer><dialog aria-label="Enlarged scientific figure" aria-describedby="zoom-caption"><button autofocus>Close figure ×</button><img alt=""><p class="zoom-caption" id="zoom-caption"></p></dialog>${beacon}</body></html>`)}
const basePath = siteUrl?.pathname || '/';
await fs.writeFile(path.join(dist, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Xuhao Liu</title><link rel="stylesheet" href="${basePath}style.css"></head><body><main class="wrap"><section class="page-head"><h1>Page not found</h1><p>The page may have moved.</p><a class="primary" href="${basePath}">Return home</a></section></main></body></html>`);
for (const asset of figures) await copyPublicInput('assets/' + asset, path.join(dist, 'assets', asset));
for (const file of downloads) await copyPublicInput('local-downloads/' + file, path.join(dist, 'downloads', file));
await fs.writeFile(path.join(dist,'.nojekyll'),'');
await fs.writeFile(path.join(dist,'robots.txt'), production ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n');
console.log(`Built ${production ? 'public' : 'local review'} site with ${Object.keys(pages).length} pages and a dedicated 404.`);
