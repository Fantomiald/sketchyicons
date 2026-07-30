// The tuning sheets: two sliders, the catalogue redrawn while they move, and a
// button that writes packages/data/overrides.json.
//
//   node tools/build-tuner.mjs                one icon at a time, for a long pass
//   node tools/build-tuner.mjs --mode grid    all of them at once, for a look
//
// The roughener is inlined rather than reimplemented, so what the sliders show
// is what `pnpm generate` writes, to the byte. tests/browser.test.mjs draws the
// whole catalogue both ways and compares.
//
// Nothing here ships. The output is for review.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { ROOT } from './lib/icons.mjs';
import { browserRoughener } from './lib/browser.mjs';
import { focusPage } from './lib/tuner-page.mjs';
import { HAND } from './lib/roughen.mjs';

const arg = (flag, fallback = null) => {
  const at = process.argv.indexOf(flag);
  return at > -1 ? process.argv[at + 1] : fallback;
};

const MODE = arg('--mode', 'focus');
const OUT = resolve(ROOT, arg('--out', 'preview/tuner'));
// One page by default. A card is only drawn once it is near the viewport, so the
// whole catalogue on one page stays responsive and the search reaches all of it.
const SPLIT = Number(arg('--split', '0'));
const LINKS = arg('--links')
  ? JSON.parse(readFileSync(resolve(ROOT, arg('--links')), 'utf8'))
  : null;

const LUCIDE = join(ROOT, 'node_modules/lucide-static');
const nodes = JSON.parse(readFileSync(join(LUCIDE, 'icon-nodes.json'), 'utf8'));
const version = JSON.parse(readFileSync(join(LUCIDE, 'package.json'), 'utf8')).version;
const names = Object.keys(nodes).sort();

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(chunk, { index, total }) {
  const pager =
    total > 1
      ? `<nav class="pager">${Array.from({ length: total }, (_, n) =>
          n === index
            ? `<span class="here">${n + 1}</span>`
            : `<a href="${LINKS?.[n] ?? `./${n === 0 ? 'index' : `page-${n + 1}`}.html`}">${n + 1}</a>`,
        ).join('')}</nav>`
      : '';

  const cards = chunk
    .map(
      (name) => `<article class="card" data-name="${name}">
  <div class="art"><svg class="drawn" width="44" height="44" viewBox="0 0 24 24" aria-hidden="true"></svg></div>
  <div class="sizes"><svg class="drawn" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"></svg><svg class="drawn" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"></svg><svg class="drawn" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"></svg><svg class="source" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"></svg></div>
  <div class="foot"><span class="name">${escape(name)}</span><button class="open" aria-expanded="false">régler</button></div>
</article>`,
    )
    .join('\n');

  return `<title>sketchyicons, réglage${total > 1 ? `, page ${index + 1} sur ${total}` : ''}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --paper:#F1F3F0; --card:#FFF; --sunk:#F7F8F6; --ink:#191C1B; --muted:#6B7270;
    --rule:#DBDEDA; --accent:#2F5D9E; --flag:#A2521A; --faint:.24;
    --sans: ui-sans-serif,-apple-system,"Segoe UI",system-ui,sans-serif;
    --mono: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  }
  @media (prefers-color-scheme: dark){:root{--paper:#131617;--card:#1B1F20;--sunk:#171A1B;--ink:#E7EAE8;--muted:#8B9391;--rule:#292E2F;--accent:#86ACE0;--flag:#DB9257;--faint:.3}}
  :root[data-theme="dark"]{--paper:#131617;--card:#1B1F20;--sunk:#171A1B;--ink:#E7EAE8;--muted:#8B9391;--rule:#292E2F;--accent:#86ACE0;--flag:#DB9257;--faint:.3}
  :root[data-theme="light"]{--paper:#F1F3F0;--card:#FFF;--sunk:#F7F8F6;--ink:#191C1B;--muted:#6B7270;--rule:#DBDEDA;--accent:#2F5D9E;--flag:#A2521A;--faint:.24}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1500px;margin:0 auto;padding:clamp(22px,4vw,48px) clamp(14px,3vw,36px) 64px}
  .eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin:0 0 13px}
  h1{font-size:clamp(1.6rem,3.4vw,2.2rem);font-weight:640;letter-spacing:-.022em;line-height:1.12;margin:0 0 14px;max-width:24ch;text-wrap:balance}
  .lede{max-width:66ch;color:var(--muted);margin:0 0 9px}
  .lede strong{color:var(--ink);font-weight:560}
  code{font-family:var(--mono);font-size:12.5px;background:var(--card);border:1px solid var(--rule);border-radius:3px;padding:.5px 4px;color:var(--ink)}

  .bar{position:sticky;top:0;z-index:6;margin:26px 0 18px;padding:12px 0;background:color-mix(in srgb,var(--paper) 93%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--rule);display:flex;flex-direction:column;gap:10px}
  .knobs{display:flex;flex-wrap:wrap;gap:18px;align-items:center}
  .knob{display:flex;align-items:center;gap:9px}
  .knob label{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);min-width:44px}
  .knob output{font-family:var(--mono);font-size:12px;font-variant-numeric:tabular-nums;min-width:38px;text-align:right}
  input[type=range]{accent-color:var(--accent);width:180px}
  .row2{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  input[type=search],input[type=text]{font:inherit;font-family:var(--mono);font-size:12.5px;color:var(--ink);background:var(--card);border:1px solid var(--rule);border-radius:5px;padding:6px 10px}
  input[type=search]{width:200px}
  button{font:inherit;font-family:var(--mono);font-size:12px;color:var(--ink);background:var(--card);border:1px solid var(--rule);border-radius:5px;padding:6px 11px;cursor:pointer}
  button:hover{border-color:var(--muted)}
  button[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  button.primary{background:var(--accent);color:#fff;border-color:var(--accent)}
  button.primary:hover{filter:brightness(1.08)}
  :is(button,input,a):focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .spacer{flex:1 1 auto}
  .count{font-family:var(--mono);font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(184px,1fr));gap:10px;align-items:start}
  .card{background:var(--card);border:1px solid var(--rule);border-radius:6px;overflow:hidden}
  .card[hidden]{display:none}
  .card.tuned{border-color:var(--flag)}
  .card.tuned .name{color:var(--flag)}
  .art{display:grid;place-items:center;padding:16px 4px 10px;background:var(--sunk);border-bottom:1px solid var(--rule)}
  .sizes{display:flex;align-items:flex-end;justify-content:center;gap:9px;padding:9px 6px;border-bottom:1px solid var(--rule);min-height:40px}
  .source{opacity:var(--faint)}
  .foot{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:7px 9px}
  .name{font-family:var(--mono);font-size:11px;word-break:break-word}
  .open{font-size:10px;padding:3px 7px;flex:0 0 auto}
  .panel{border-top:1px solid var(--rule);background:var(--sunk);padding:9px;display:flex;flex-direction:column;gap:7px}
  .panel .knob label{min-width:34px;font-size:10px}
  .panel input[type=range]{width:100%}
  .panel output{font-size:11px}
  .panel .acts{display:flex;gap:5px}
  .panel .acts button{flex:1 1 0;font-size:10px;padding:4px 2px}
  .panel input[type=text]{width:100%;font-size:10.5px;padding:4px 6px}

  .empty{display:none;font-family:var(--mono);font-size:13px;color:var(--muted);padding:36px 0}
  body.nothing .empty{display:block}
  .pager{display:flex;flex-wrap:wrap;gap:6px;margin:26px 0 0}
  .pager a,.pager .here{font-family:var(--mono);font-size:12px;text-decoration:none;padding:6px 11px;border-radius:5px;border:1px solid var(--rule);color:var(--ink);background:var(--card)}
  .pager .here{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  footer.page{margin-top:40px;padding-top:20px;border-top:1px solid var(--rule);color:var(--muted);font-size:13px;max-width:72ch}
  footer.page a{color:var(--accent)}
  footer.page p{margin:0 0 8px}
</style>

<div class="wrap">
<header>
  <p class="eyebrow">réglage · lucide ${version}${total > 1 ? ` · page ${index + 1} sur ${total}` : ''}</p>
  <h1>Les deux boutons, entre tes mains</h1>
  <p class="lede">La <strong>dérive</strong> est de combien chaque coordonnée s'écarte. Le
  <strong>bombé</strong> est de combien un trait se courbe entre ses deux bouts. Les curseurs du
  haut valent pour tout le catalogue, ceux d'une carte ne valent que pour elle.</p>
  <p class="lede">Le dessin est refait dans la page, avec le même code que le générateur, donc ce
  que tu vois est ce que <code>pnpm generate</code> écrira. <strong>Exporter</strong> copie un
  <code>overrides.json</code> complet, amplitude globale et exceptions comprises.</p>
  <p class="lede">La quatrième icône de la rangée du bas, en pâle, est l'original Lucide.
  <strong>Redessiner</strong> garde l'amplitude et retire un autre tirage, pour quand la forme
  est bonne mais le hasard est tombé mal.</p>
</header>

<div class="bar">
  <div class="knobs">
    <div class="knob"><label for="drift">dérive</label><input type="range" id="drift" min="0" max="1.2" step="0.01"><output id="drift-out"></output></div>
    <div class="knob"><label for="bow">bombé</label><input type="range" id="bow" min="0" max="3" step="0.01"><output id="bow-out"></output></div>
    <span class="spacer"></span>
    <span class="count" id="tuned"></span>
    <button id="export" class="primary">exporter</button>
    <button id="download">télécharger</button>
  </div>
  <div class="row2">
    <input type="search" id="q" placeholder="chercher un nom" aria-label="chercher une icône">
    <button data-filter="all" aria-pressed="true">tout</button>
    <button data-filter="tuned" aria-pressed="false">réglées</button>
    <span class="spacer"></span>
    <span class="count" id="found"></span>
    <button id="reset">tout remettre</button>
    <button id="theme">thème</button>
  </div>
</div>

<div class="grid" id="grid">
${cards}
</div>
<p class="empty">Aucune icône ne correspond.</p>
${pager}

<footer class="page">
  <p>Géométrie : <a href="https://lucide.dev">Lucide</a> ${version}, licence ISC,
  (c) Lucide Icons and Contributors. sketchyicons n'est pas affilié à Lucide.</p>
  <p>Les bornes tiennent quel que soit le réglage : une coordonnée ne peut pas s'éloigner plus
  que le plus court des deux segments qui la partagent, et un sous chemin sans aucune courbe
  reste tenu à la règle. Monter les curseurs monte le plafond, pas les bornes.</p>
  <p>Tes réglages restent dans ton navigateur et suivent d'une page à l'autre jusqu'à ce que tu
  exportes.</p>
</footer>
</div>

<script>
${browserRoughener()}

const NODES = ${JSON.stringify(Object.fromEntries(chunk.map((name) => [name, nodes[name]])))};
const DEFAULTS = ${JSON.stringify({ drift: HAND.drift, bow: HAND.bow })};

const KEY = 'sketchyicons-tuning';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || { hand: { ...DEFAULTS }, icons: {} };
  } catch {
    return { hand: { ...DEFAULTS }, icons: {} };
  }
};
let settings = read();
const store = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // the tuning lives in memory for this visit and that is all
  }
};

const grid = document.getElementById('grid');
const cards = [...grid.children];

const paths = (name) => NODES[name].map(elementToPath);

const tags = (list) =>
  list
    .map(
      (path) =>
        '<path d="' + path.d + '" fill="' + (path.fill || 'none') +
        '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    )
    .join('');

const drawnFor = (name) => {
  const source = paths(name);
  const over = settings.icons[name];
  const base = handFor(source);
  const hand = {
    ...base,
    drift: over && over.drift !== undefined ? over.drift : settings.hand.drift,
    bow: over && over.bow !== undefined ? over.bow : settings.hand.bow,
  };
  const frame = frameFor(source);
  const random = makeRandom(over && over.seed ? name + '#' + over.seed : name);
  return source.map((path) => ({ d: roughen(path.d, random, hand, frame), fill: path.fill }));
};

// 1756 icons is more than a slider drag can redraw between two frames, so a
// card is only drawn once it is near the viewport, and a change to the global
// knobs marks the rest as owing a redraw rather than doing it.
const stale = new Set(cards);
const onScreen = new Set();

const render = (card) => {
  const name = card.dataset.name;
  const drawn = tags(drawnFor(name));
  for (const svg of card.querySelectorAll('svg.drawn')) svg.innerHTML = drawn;
  const source = card.querySelector('svg.source');
  if (source && !source.innerHTML) source.innerHTML = tags(paths(name));
  card.classList.toggle('tuned', Boolean(settings.icons[name]));
  stale.delete(card);
};

const renderVisible = () => {
  for (const card of onScreen) if (stale.has(card) && !card.hidden) render(card);
};

const renderAll = () => {
  for (const card of cards) stale.add(card);
  renderVisible();
};

const watcher = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onScreen.add(entry.target);
        if (stale.has(entry.target)) render(entry.target);
      } else {
        onScreen.delete(entry.target);
      }
    }
  },
  { rootMargin: '600px 0px' },
);
for (const card of cards) watcher.observe(card);

// counts and filtering

const foundOut = document.getElementById('found');
const tunedOut = document.getElementById('tuned');
const search = document.getElementById('q');
const filters = [...document.querySelectorAll('[data-filter]')];
let filter = 'all';

const counts = () => {
  const total = Object.keys(settings.icons).length;
  tunedOut.textContent = total ? total + ' réglée' + (total > 1 ? 's' : '') : '';
};

const apply = () => {
  const term = search.value.trim().toLowerCase();
  let shown = 0;
  for (const card of cards) {
    const ok =
      (!term || card.dataset.name.includes(term)) &&
      (filter === 'all' || Boolean(settings.icons[card.dataset.name]));
    card.hidden = !ok;
    if (ok) shown += 1;
  }
  foundOut.textContent = shown + ' / ' + cards.length;
  document.body.classList.toggle('nothing', shown === 0);
  counts();
  renderVisible();
};

search.addEventListener('input', apply);
for (const button of filters) {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    for (const other of filters) other.setAttribute('aria-pressed', String(other === button));
    apply();
  });
}

// the global knobs

const drift = document.getElementById('drift');
const bow = document.getElementById('bow');
const driftOut = document.getElementById('drift-out');
const bowOut = document.getElementById('bow-out');

const showGlobals = () => {
  drift.value = settings.hand.drift;
  bow.value = settings.hand.bow;
  driftOut.textContent = Number(settings.hand.drift).toFixed(2);
  bowOut.textContent = Number(settings.hand.bow).toFixed(2);
};

let pending = 0;
const schedule = () => {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(renderAll);
};

for (const [input, knob, out] of [
  [drift, 'drift', driftOut],
  [bow, 'bow', bowOut],
]) {
  input.addEventListener('input', () => {
    settings.hand[knob] = Number(input.value);
    out.textContent = Number(input.value).toFixed(2);
    store();
    schedule();
  });
}

// the panel on a card

const panelFor = (card) => {
  const name = card.dataset.name;
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML =
    '<div class="knob"><label>dérive</label><input type="range" data-knob="drift" min="0" max="1.2" step="0.01"><output></output></div>' +
    '<div class="knob"><label>bombé</label><input type="range" data-knob="bow" min="0" max="3" step="0.01"><output></output></div>' +
    '<div class="acts"><button data-act="reseed">redessiner</button><button data-act="clear">annuler</button></div>' +
    '<input type="text" data-why placeholder="pourquoi, facultatif">';

  const sync = () => {
    const entry = settings.icons[name] || {};
    for (const input of panel.querySelectorAll('input[type=range]')) {
      const knob = input.dataset.knob;
      const value = entry[knob] !== undefined ? entry[knob] : settings.hand[knob];
      input.value = value;
      input.nextElementSibling.textContent = Number(value).toFixed(2);
    }
    panel.querySelector('[data-why]').value = entry.why || '';
  };

  const set = (change) => {
    const entry = { ...(settings.icons[name] || {}), ...change };
    for (const key of Object.keys(entry)) if (entry[key] === undefined) delete entry[key];
    const knobs = ['drift', 'bow', 'seed'].filter((k) => entry[k] !== undefined);
    if (!knobs.length) delete settings.icons[name];
    else {
      entry.why = (entry.why || '').trim() || 'réglée à la main sur la feuille de réglage';
      settings.icons[name] = entry;
    }
    store();
    render(card);
    counts();
    sync();
  };

  for (const input of panel.querySelectorAll('input[type=range]')) {
    input.addEventListener('input', () => {
      input.nextElementSibling.textContent = Number(input.value).toFixed(2);
      set({ [input.dataset.knob]: Number(input.value) });
    });
  }
  panel.querySelector('[data-act=reseed]').addEventListener('click', () => {
    const entry = settings.icons[name] || {};
    set({ seed: ((entry.seed || 0) % 999) + 1 });
  });
  panel.querySelector('[data-act=clear]').addEventListener('click', () => {
    delete settings.icons[name];
    store();
    render(card);
    counts();
    sync();
  });
  panel.querySelector('[data-why]').addEventListener('input', (event) => {
    if (settings.icons[name]) set({ why: event.target.value });
  });

  sync();
  return panel;
};

for (const card of cards) {
  card.querySelector('.open').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const open = button.getAttribute('aria-expanded') === 'true';
    if (open) {
      card.querySelector('.panel').remove();
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'régler';
    } else {
      card.append(panelFor(card));
      button.setAttribute('aria-expanded', 'true');
      button.textContent = 'fermer';
    }
  });
}

// getting it out

const report = () => {
  const names = Object.keys(settings.icons).sort();
  const icons = {};
  for (const name of names) {
    const entry = settings.icons[name];
    const out = {};
    if (entry.seed !== undefined) out.seed = entry.seed;
    if (entry.drift !== undefined) out.drift = Number(entry.drift.toFixed(2));
    if (entry.bow !== undefined) out.bow = Number(entry.bow.toFixed(2));
    out.why = entry.why;
    icons[name] = out;
  }
  return JSON.stringify(
    {
      hand: {
        drift: Number(Number(settings.hand.drift).toFixed(2)),
        bow: Number(Number(settings.hand.bow).toFixed(2)),
      },
      icons,
    },
    null,
    2,
  ) + '\\n';
};

const exportButton = document.getElementById('export');
exportButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(report());
    exportButton.textContent = 'copié';
  } catch {
    exportButton.textContent = 'refusé, télécharge';
  }
  setTimeout(() => (exportButton.textContent = 'exporter'), 1800);
});

document.getElementById('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([report()], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'overrides.json';
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('reset').addEventListener('click', () => {
  settings = { hand: { ...DEFAULTS }, icons: {} };
  store();
  for (const card of cards) {
    const panel = card.querySelector('.panel');
    if (panel) panel.remove();
    const open = card.querySelector('.open');
    open.setAttribute('aria-expanded', 'false');
    open.textContent = 'régler';
  }
  showGlobals();
  apply();
});

document.getElementById('theme').addEventListener('click', () => {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const current = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
  document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark';
});

addEventListener('storage', (event) => {
  if (event.key !== KEY) return;
  settings = read();
  showGlobals();
  apply();
});

showGlobals();
apply();
</script>
`;
}

mkdirSync(OUT, { recursive: true });

if (MODE === 'focus') {
  const html = focusPage({
    nodes,
    names,
    version,
    roughener: browserRoughener(),
    hand: { drift: HAND.drift, bow: HAND.bow },
  });
  writeFileSync(join(OUT, 'index.html'), html);
  console.log(`index.html  ${names.length} icons  ${(html.length / 1024).toFixed(0)} kB`);
  process.exit(0);
}

if (MODE !== 'grid') {
  console.error(`unknown mode "${MODE}", pick focus or grid`);
  process.exit(1);
}

const chunks = [];
if (SPLIT > 0)
  for (let at = 0; at < names.length; at += SPLIT) chunks.push(names.slice(at, at + SPLIT));
else chunks.push(names);

chunks.forEach((chunk, index) => {
  const file = index === 0 ? 'index.html' : `page-${index + 1}.html`;
  const html = page(chunk, { index, total: chunks.length });
  writeFileSync(join(OUT, file), html);
  console.log(`${file}  ${chunk.length} icons  ${(html.length / 1024).toFixed(0)} kB`);
});
