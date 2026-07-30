// The contact sheet: every icon with Lucide's original faint beside the drawn
// version, and the drawn version at the three sizes an application actually
// uses. 15 is the one that matters.
//
//   node tools/build-preview.mjs                       every icon, one page
//   node tools/build-preview.mjs --split 440             four pages
//   node tools/build-preview.mjs --split 440 --links urls.json
//   node tools/build-preview.mjs --against before.json --changed
//
// Nothing here ships. The output is for review.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { ROOT, readIcons, readAliases, attributesOf } from './lib/icons.mjs';

const arg = (flag, fallback = null) => {
  const at = process.argv.indexOf(flag);
  return at > -1 ? process.argv[at + 1] : fallback;
};

// resolve rather than join, so an absolute --out is honoured instead of being
// pasted under the repository root.
const OUT = resolve(ROOT, arg('--out', 'preview'));
const SPLIT = Number(arg('--split', '0'));
// Split pages sit next to each other on disk, but once published each one has
// its own address. Pass the published URLs, in page order, and the pager points
// at those instead of at the neighbouring file.
const LINKS = arg('--links')
  ? JSON.parse(readFileSync(resolve(ROOT, arg('--links')), 'utf8'))
  : null;

// A dump from an earlier run, so a change to the heuristic can be judged rather
// than described. --changed drops everything the change did not touch.
const AGAINST = arg('--against')
  ? new Map(
      JSON.parse(readFileSync(resolve(ROOT, arg('--against')), 'utf8')).map((icon) => [
        icon.name,
        icon.paths,
      ]),
    )
  : null;
const CHANGED_ONLY = process.argv.includes('--changed');
const ONLY = arg('--only');

let icons = readIcons();
if (ONLY) {
  const wanted = new Set(JSON.parse(readFileSync(resolve(ROOT, ONLY), 'utf8')));
  icons = icons.filter((icon) => wanted.has(icon.name));
}
const key = (paths) => paths.map((path) => path.d).join('|');
if (AGAINST && CHANGED_ONLY) {
  icons = icons.filter((icon) => key(AGAINST.get(icon.name) ?? []) !== key(icon.paths));
}
if (!icons.length) throw new Error('nothing to draw');
const aliases = readAliases(icons);
const renames = new Map();
for (const alias of aliases) {
  if (!renames.has(alias.target)) renames.set(alias.target, []);
  renames.get(alias.target).push(alias.component);
}

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pathTags = (paths) =>
  paths
    .map((path) => {
      const attributes = Object.entries(attributesOf(path))
        .map(([key, value]) => `${key}="${escape(value)}"`)
        .join(' ');
      return `<path ${attributes} fill="${path.fill ?? 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');

const glyph = (id, size, className = '') =>
  `<svg class="g ${className}" width="${size}" height="${size}" aria-hidden="true"><use href="#${id}"/></svg>`;

function page(chunk, { index, total, count }) {
  // Each drawing is written once as a symbol and referenced everywhere else.
  // Five instances per icon would otherwise repeat the path data five times.
  const symbols = chunk
    .flatMap((icon) => [
      `<symbol id="src-${icon.name}" viewBox="0 0 24 24">${pathTags(icon.source)}</symbol>`,
      `<symbol id="new-${icon.name}" viewBox="0 0 24 24">${pathTags(icon.paths)}</symbol>`,
      ...(AGAINST?.has(icon.name)
        ? [
            `<symbol id="old-${icon.name}" viewBox="0 0 24 24">${pathTags(AGAINST.get(icon.name))}</symbol>`,
          ]
        : []),
    ])
    .join('\n');

  const cards = chunk
    .map((icon) => {
      const also = renames.get(icon.name) ?? [];
      return `<article class="card" data-name="${icon.name}" data-hand="${icon.hand}" data-search="${escape([icon.name, icon.component, ...also].join(' ').toLowerCase())}">
  <div class="row ${AGAINST ? 'triple' : 'pair'}">
    <div class="cell"><span class="tag">lucide</span>${glyph(`src-${icon.name}`, 32, 'faint')}</div>
    ${
      AGAINST
        ? `<div class="cell"><span class="tag">avant</span>${
            AGAINST.has(icon.name)
              ? glyph(`old-${icon.name}`, 32)
              : '<span class="none">absente</span>'
          }</div>`
        : ''
    }
    <div class="cell"><span class="tag">${AGAINST ? 'après' : 'dessiné'}</span>${glyph(`new-${icon.name}`, 32)}</div>
  </div>
  <div class="row sizes"><span class="tag">15 · 20 · 24</span><div class="line">${[15, 20, 24]
    .map((size) => glyph(`new-${icon.name}`, size))
    .join('')}</div></div>
  <footer class="meta">
    <div class="line1"><span class="name">${escape(icon.name)}</span>${
      icon.hand === 'ruler' ? '<span class="pill">règle</span>' : ''
    }</div>
    <div class="line2">${escape(icon.component)}${
      also.length ? `<span class="also">aussi ${escape(also.join(', '))}</span>` : ''
    }</div>
  </footer>
  <div class="verdict">
    <div class="tags">
      <button class="tag-btn" data-verdict="calmer" title="trop de main">calmer</button>
      <button class="tag-btn" data-verdict="liberer" title="pas assez de main">libérer</button>
      <button class="tag-btn" data-verdict="redessiner" title="la forme est bonne, le tirage est raté">redessiner</button>
    </div>
    <input class="note" type="text" placeholder="pourquoi, en quelques mots" aria-label="note sur ${escape(icon.name)}">
  </div>
</article>`;
    })
    .join('\n');

  const pager =
    total > 1
      ? `<nav class="pager">${Array.from({ length: total }, (_, n) =>
          n === index
            ? `<span class="here">${n + 1}</span>`
            : `<a href="${LINKS?.[n] ?? `./${n === 0 ? 'index' : `page-${n + 1}`}.html`}">${n + 1}</a>`,
        ).join('')}</nav>`
      : '';

  return `<title>sketchyicons, ${count} icônes${total > 1 ? `, page ${index + 1} sur ${total}` : ''}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --paper: #F1F3F0; --card: #FFFFFF; --sunk: #F7F8F6;
    --ink: #191C1B; --muted: #6B7270; --rule: #DBDEDA;
    --accent: #2F5D9E; --flag: #A2521A; --faint: 0.26;
    --sans: ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif;
    --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --paper: #131617; --card: #1B1F20; --sunk: #171A1B;
      --ink: #E7EAE8; --muted: #8B9391; --rule: #292E2F;
      --accent: #86ACE0; --flag: #DB9257; --faint: 0.32;
    }
  }
  :root[data-theme="dark"] {
    --paper: #131617; --card: #1B1F20; --sunk: #171A1B;
    --ink: #E7EAE8; --muted: #8B9391; --rule: #292E2F;
    --accent: #86ACE0; --flag: #DB9257; --faint: 0.32;
  }
  :root[data-theme="light"] {
    --paper: #F1F3F0; --card: #FFFFFF; --sunk: #F7F8F6;
    --ink: #191C1B; --muted: #6B7270; --rule: #DBDEDA;
    --accent: #2F5D9E; --flag: #A2521A; --faint: 0.26;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--paper); color: var(--ink);
    font-family: var(--sans); font-size: 15px; line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1500px; margin: 0 auto; padding: clamp(24px, 4vw, 52px) clamp(16px, 3vw, 40px) 64px; }
  .eyebrow {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.13em;
    text-transform: uppercase; color: var(--accent); margin: 0 0 14px;
  }
  h1 {
    font-size: clamp(1.6rem, 3.4vw, 2.3rem); font-weight: 640;
    letter-spacing: -0.022em; line-height: 1.12; margin: 0 0 16px;
    max-width: 24ch; text-wrap: balance;
  }
  .lede { max-width: 66ch; color: var(--muted); margin: 0 0 10px; }
  .lede strong { color: var(--ink); font-weight: 560; }
  code {
    font-family: var(--mono); font-size: 12.5px; background: var(--sunk);
    border: 1px solid var(--rule); border-radius: 3px; padding: 0.5px 4px; color: var(--ink);
  }

  .bar {
    position: sticky; top: 0; z-index: 5;
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    margin: 32px 0 20px; padding: 12px 0;
    background: color-mix(in srgb, var(--paper) 92%, transparent);
    backdrop-filter: blur(8px); border-bottom: 1px solid var(--rule);
  }
  input[type="search"] {
    font: inherit; font-family: var(--mono); font-size: 13px;
    color: var(--ink); background: var(--card);
    border: 1px solid var(--rule); border-radius: 5px;
    padding: 7px 11px; width: 230px;
  }
  input[type="search"]::placeholder { color: var(--muted); }
  button {
    font: inherit; font-family: var(--mono); font-size: 12px;
    color: var(--ink); background: var(--card);
    border: 1px solid var(--rule); border-radius: 5px;
    padding: 7px 12px; cursor: pointer;
  }
  button[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  button:hover { border-color: var(--muted); }
  :is(button, input, a):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .spacer { flex: 1 1 auto; }
  .found { font-family: var(--mono); font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(196px, 1fr)); gap: 11px; }
  .card {
    background: var(--card); border: 1px solid var(--rule); border-radius: 6px;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .card[hidden] { display: none; }
  .row { display: grid; border-bottom: 1px solid var(--rule); }
  .pair { grid-template-columns: 1fr 1fr; }
  .triple { grid-template-columns: repeat(3, 1fr); }
  .none { font-family: var(--mono); font-size: 9px; color: var(--muted); }
  .cell {
    position: relative; display: grid; place-items: center;
    padding: 20px 4px 11px; background: var(--sunk);
    border-right: 1px solid var(--rule); min-height: 62px;
  }
  .cell:last-child { border-right: 0; }
  .faint { opacity: var(--faint); }
  .tag {
    position: absolute; top: 5px; left: 7px;
    font-family: var(--mono); font-size: 8.5px; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
  }
  .sizes { position: relative; padding: 19px 8px 9px; }
  .line { display: flex; align-items: flex-end; justify-content: center; gap: 9px; min-height: 26px; }
  .meta { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 2px; }
  .line1 { display: flex; align-items: baseline; gap: 6px; justify-content: space-between; }
  .name { font-family: var(--mono); font-size: 11.5px; font-weight: 500; word-break: break-word; }
  .pill {
    flex: 0 0 auto; font-family: var(--mono); font-size: 9px;
    letter-spacing: 0.06em; padding: 1px 5px; border-radius: 3px;
    border: 1px solid var(--rule); color: var(--muted);
  }
  .line2 {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    display: flex; flex-direction: column; gap: 1px; word-break: break-word;
  }
  .also { font-size: 9.5px; opacity: 0.85; }

  .verdict {
    border-top: 1px solid var(--rule); padding: 7px 8px 8px;
    display: flex; flex-direction: column; gap: 5px; background: var(--sunk);
  }
  .tags { display: flex; gap: 4px; }
  .tag-btn {
    flex: 1 1 0; padding: 4px 2px; font-size: 10px; letter-spacing: 0.01em;
    border-radius: 4px;
  }
  .tag-btn[aria-pressed="true"] { background: var(--flag); color: var(--paper); border-color: var(--flag); }
  .note {
    font: inherit; font-family: var(--mono); font-size: 10.5px;
    color: var(--ink); background: var(--card);
    border: 1px solid var(--rule); border-radius: 4px; padding: 4px 6px; width: 100%;
  }
  .note::placeholder { color: var(--muted); }
  .card.flagged { border-color: var(--flag); }
  .card.flagged .name { color: var(--flag); }

  .empty { display: none; font-family: var(--mono); font-size: 13px; color: var(--muted); padding: 40px 0; }
  body.nothing .empty { display: block; }

  .pager { display: flex; flex-wrap: wrap; gap: 6px; margin: 28px 0 0; }
  .pager a, .pager .here {
    font-family: var(--mono); font-size: 12px; text-decoration: none;
    padding: 6px 11px; border-radius: 5px; border: 1px solid var(--rule);
    color: var(--ink); background: var(--card);
  }
  .pager .here { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  footer.page {
    margin-top: 44px; padding-top: 20px; border-top: 1px solid var(--rule);
    color: var(--muted); font-size: 13px; max-width: 72ch;
  }
  footer.page a { color: var(--accent); }
  footer.page p { margin: 0 0 8px; }
</style>

<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
${symbols}
</svg>

<div class="wrap">
<header>
  <p class="eyebrow">catalogue · lucide ${icons[0].lucide}${total > 1 ? ` · page ${index + 1} sur ${total}` : ''}</p>
  <h1>${count} icônes, la géométrie de Lucide et une main</h1>
  <p class="lede">Chaque carte montre l'original Lucide en pâle à gauche, la version dessinée
  à droite, puis la même à 15, 20 et 24 pixels. <strong>C'est à 15 que ça se joue</strong>,
  c'est la taille à laquelle une app affiche une icône dans un contrôle.</p>
  <p class="lede">Les tracés droits se courbent, chaque coordonnée dérive, et la dérive est
  tirée d'une graine calculée sur le nom : une régénération redonne exactement le même dessin.
  Combien de main une forme peut prendre est mesuré sur sa propre géométrie, jamais trié à la
  main. Les icônes marquées <code>règle</code> ne contiennent aucune courbe et gardent une
  amplitude basse.</p>
  <p class="lede"><strong>Marque ce qui ne va pas.</strong> Sous chaque icône, dis quoi en faire :
  <code>calmer</code> si elle a trop de main, <code>libérer</code> si elle n'en a pas assez,
  <code>redessiner</code> si la forme est bonne mais le tirage raté. La note est facultative.
  Puis <code>copier le retour</code> en haut, et colle. Les marques tiennent d'une page à
  l'autre et survivent à un rechargement.</p>
</header>

<div class="bar">
  <input type="search" id="q" placeholder="chercher, ancien nom compris" aria-label="chercher une icône">
  <button data-filter="all" aria-pressed="true">tout</button>
  <button data-filter="ruler" aria-pressed="false">règle</button>
  <button data-filter="hand" aria-pressed="false">main</button>
  <button data-filter="flagged" aria-pressed="false" id="only-flagged">marquées</button>
  <span class="spacer"></span>
  <button id="copy">copier le retour</button>
  <button id="download">télécharger</button>
  <span class="found" id="marked"></span>
  <span class="found" id="found"></span>
  <button id="theme" aria-pressed="false">thème</button>
</div>

<div class="grid" id="grid">
${cards}
</div>
<p class="empty">Aucune icône ne correspond.</p>
${pager}

<footer class="page">
  <p>Géométrie : <a href="https://lucide.dev">Lucide</a> ${icons[0].lucide}, licence ISC,
  (c) Lucide Icons and Contributors. Une partie de Lucide dérive elle même de Feather, licence
  MIT. sketchyicons n'est pas affilié à Lucide.</p>
  <p>La recherche accepte aussi les ${aliases.length} noms que Lucide a renommés depuis, donc
  <code>home</code> trouve <code>house</code>.</p>
  <p>Ce que tu marques ne part nulle part : tout reste dans ton navigateur jusqu'à ce que tu
  copies ou télécharges. Chaque verdict correspond à un bouton du générateur, donc le retour
  se transpose directement dans <code>packages/data/overrides.json</code>.</p>
</footer>
</div>

<script>
  const grid = document.getElementById('grid');
  const cards = [...grid.children];
  const found = document.getElementById('found');
  const marked = document.getElementById('marked');
  const search = document.getElementById('q');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const PAGE = '${index + 1}';
  const TOTAL = '${total}';
  const LUCIDE = '${icons[0].lucide}';
  let filter = 'all';

  // The review survives a reload and a jump to another page of the catalogue.
  // Without storage the marks still work, they do not come back.
  const KEY = 'sketchyicons-review';
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  };
  let review = load();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(review));
    } catch {
      // nothing to do, the marks live in memory for this visit
    }
  };

  const flagged = (card) => Boolean(review[card.dataset.name]);

  const paint = (card) => {
    const entry = review[card.dataset.name];
    card.classList.toggle('flagged', Boolean(entry));
    for (const button of card.querySelectorAll('.tag-btn')) {
      button.setAttribute('aria-pressed', String(entry?.verdict === button.dataset.verdict));
    }
    const note = card.querySelector('.note');
    if (note.value !== (entry?.note ?? '')) note.value = entry?.note ?? '';
  };

  const counts = () => {
    const here = cards.filter(flagged).length;
    const everywhere = Object.keys(review).length;
    marked.textContent =
      everywhere === 0
        ? ''
        : here === everywhere
          ? here + ' marquée' + (here > 1 ? 's' : '')
          : here + ' ici, ' + everywhere + ' au total';
  };

  const apply = () => {
    const term = search.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const ok =
        (!term || card.dataset.search.includes(term)) &&
        (filter === 'all' ||
          (filter === 'flagged' ? flagged(card) : card.dataset.hand === filter));
      card.hidden = !ok;
      if (ok) shown += 1;
    }
    found.textContent = shown + ' / ' + cards.length;
    document.body.classList.toggle('nothing', shown === 0);
    counts();
  };

  const mark = (name, change) => {
    const entry = { ...(review[name] ?? {}), ...change };
    if (!entry.verdict && !(entry.note ?? '').trim()) delete review[name];
    else review[name] = entry;
    save();
  };

  for (const card of cards) {
    paint(card);
    const name = card.dataset.name;
    for (const button of card.querySelectorAll('.tag-btn')) {
      button.addEventListener('click', () => {
        const already = review[name]?.verdict === button.dataset.verdict;
        mark(name, { verdict: already ? undefined : button.dataset.verdict });
        paint(card);
        if (filter === 'flagged') apply();
        else counts();
      });
    }
    card.querySelector('.note').addEventListener('input', (event) => {
      mark(name, { note: event.target.value });
      card.classList.toggle('flagged', Boolean(review[name]));
      counts();
    });
  }

  search.addEventListener('input', apply);
  for (const button of filters) {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      for (const other of filters) other.setAttribute('aria-pressed', String(other === button));
      apply();
    });
  }

  // What lands in the clipboard is what the generator needs: a name, what to do
  // about it, and why.
  const report = () => {
    const names = Object.keys(review).sort();
    if (!names.length) return '';
    const width = Math.max(...names.map((n) => n.length));
    const lines = names.map((name) => {
      const entry = review[name];
      return (
        name.padEnd(width) +
        ' | ' +
        (entry.verdict ?? 'à revoir').padEnd(10) +
        ' | ' +
        (entry.note ?? '').trim()
      );
    });
    return (
      '# sketchyicons, retour de relecture\\n' +
      '# lucide ' + LUCIDE + ', page ' + PAGE + ' sur ' + TOTAL + ', ' + names.length + ' marquées\\n' +
      '# calmer = trop de main, liberer = pas assez, redessiner = le tirage est raté\\n\\n' +
      lines.join('\\n') +
      '\\n'
    );
  };

  const copy = document.getElementById('copy');
  copy.addEventListener('click', async () => {
    const text = report();
    if (!text) {
      copy.textContent = 'rien de marqué';
      setTimeout(() => (copy.textContent = 'copier le retour'), 1400);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = 'copié';
    } catch {
      copy.textContent = 'copie refusée, utilise télécharger';
    }
    setTimeout(() => (copy.textContent = 'copier le retour'), 1800);
  });

  document.getElementById('download').addEventListener('click', () => {
    const text = report();
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sketchyicons-retour.txt';
    link.click();
    URL.revokeObjectURL(url);
  });

  const theme = document.getElementById('theme');
  theme.addEventListener('click', () => {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const current = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    theme.setAttribute('aria-pressed', String(next !== (dark ? 'dark' : 'light')));
  });

  // Another tab of the catalogue marked something.
  addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    review = load();
    for (const card of cards) paint(card);
    apply();
  });

  apply();
</script>
`;
}

mkdirSync(OUT, { recursive: true });

const chunks = [];
if (SPLIT > 0) {
  for (let at = 0; at < icons.length; at += SPLIT) chunks.push(icons.slice(at, at + SPLIT));
} else {
  chunks.push(icons);
}

chunks.forEach((chunk, index) => {
  const file = index === 0 ? 'index.html' : `page-${index + 1}.html`;
  const html = page(chunk, { index, total: chunks.length, count: chunk.length });
  writeFileSync(join(OUT, file), html);
  console.log(`${file}  ${chunk.length} icons  ${(html.length / 1024).toFixed(0)} kB`);
});
