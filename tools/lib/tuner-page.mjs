// The focused tuning sheet: one icon, two sliders, and a progress bar.
//
// Built for a long pass over 1756 icons rather than for a look at the set, so
// everything is one keystroke away and nothing is ever lost: the settings are
// written to the browser on every change, not on leaving an icon.
//
// A page cannot write into packages/data. It offers to hold a real file open
// where the browser allows it, and falls back to copy and download where it does
// not.

/** @param {{ nodes: object, names: string[], version: string, roughener: string, hand: { drift: number, bow: number } }} input */
export function focusPage({ nodes, names, version, roughener, hand }) {
  return `<title>sketchyicons, réglage icône par icône</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --paper:#F1F3F0; --card:#FFF; --sunk:#F7F8F6; --ink:#191C1B; --muted:#6B7270;
    --rule:#DBDEDA; --accent:#2F5D9E; --flag:#A2521A; --good:#2F6C66; --faint:.22;
    --sans: ui-sans-serif,-apple-system,"Segoe UI",system-ui,sans-serif;
    --mono: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  }
  @media (prefers-color-scheme: dark){:root{--paper:#131617;--card:#1B1F20;--sunk:#171A1B;--ink:#E7EAE8;--muted:#8B9391;--rule:#292E2F;--accent:#86ACE0;--flag:#DB9257;--good:#5FA69C;--faint:.28}}
  :root[data-theme="dark"]{--paper:#131617;--card:#1B1F20;--sunk:#171A1B;--ink:#E7EAE8;--muted:#8B9391;--rule:#292E2F;--accent:#86ACE0;--flag:#DB9257;--good:#5FA69C;--faint:.28}
  :root[data-theme="light"]{--paper:#F1F3F0;--card:#FFF;--sunk:#F7F8F6;--ink:#191C1B;--muted:#6B7270;--rule:#DBDEDA;--accent:#2F5D9E;--flag:#A2521A;--good:#2F6C66;--faint:.22}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
  .wrap{max-width:900px;margin:0 auto;padding:0 clamp(14px,3vw,28px) 48px}

  /* the bar that never moves */
  .top{position:sticky;top:0;z-index:8;background:color-mix(in srgb,var(--paper) 94%,transparent);backdrop-filter:blur(10px);padding:14px 0 12px;border-bottom:1px solid var(--rule)}
  .track{height:5px;border-radius:3px;background:var(--rule);overflow:hidden}
  .fill{height:100%;width:0;background:var(--accent);transition:width .18s ease}
  @media (prefers-reduced-motion: reduce){.fill{transition:none}}
  .meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;margin-top:9px;font-family:var(--mono);font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}
  .meta b{color:var(--ink);font-weight:500}
  .meta .tuned{color:var(--flag)}
  .meta .spacer{flex:1 1 auto}

  /* the icon */
  .stage{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}
  .big{background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:18px 12px 12px;position:relative;display:flex;flex-direction:column;align-items:center;gap:12px}
  .big.now{border-color:var(--accent)}
  .tag{position:absolute;top:7px;left:10px;font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  .big svg.hero{display:block}
  .strip{display:flex;align-items:flex-end;justify-content:center;gap:14px;min-height:26px;padding-top:4px;border-top:1px solid var(--rule);width:100%}
  .strip span{display:flex;flex-direction:column;align-items:center;gap:3px}
  .strip small{font-family:var(--mono);font-size:8.5px;color:var(--muted)}
  .faint{opacity:var(--faint)}

  .name{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:16px;flex-wrap:wrap}
  .name h1{font-family:var(--mono);font-size:1.15rem;font-weight:500;margin:0;letter-spacing:-.01em;word-break:break-word}
  .pill{font-family:var(--mono);font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:3px;border:1px solid var(--rule);color:var(--muted)}
  .pill.on{color:var(--flag);border-color:color-mix(in srgb,var(--flag) 45%,transparent)}
  .pill.rule{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}

  /* the knobs */
  .knobs{margin-top:18px;background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:14px 16px 16px}
  .knob{display:flex;align-items:center;gap:12px;padding:5px 0}
  .knob label{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);width:58px;flex:0 0 auto}
  .knob input[type=range]{flex:1 1 auto;accent-color:var(--accent);min-width:0}
  .knob output{font-family:var(--mono);font-size:13px;font-variant-numeric:tabular-nums;width:46px;text-align:right;flex:0 0 auto}
  .knob .off{color:var(--muted);font-size:10px;font-family:var(--mono);width:52px;text-align:right;flex:0 0 auto}
  .acts{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
  .why{width:100%;margin-top:9px}

  input[type=text],input[type=search]{font:inherit;font-family:var(--mono);font-size:12.5px;color:var(--ink);background:var(--sunk);border:1px solid var(--rule);border-radius:5px;padding:7px 10px;width:100%}
  input::placeholder{color:var(--muted)}
  button{font:inherit;font-family:var(--mono);font-size:12px;color:var(--ink);background:var(--card);border:1px solid var(--rule);border-radius:5px;padding:7px 12px;cursor:pointer}
  button:hover{border-color:var(--muted)}
  button.primary{background:var(--accent);color:#fff;border-color:var(--accent)}
  button.primary:hover{filter:brightness(1.08)}
  button[disabled]{opacity:.4;cursor:default}
  button[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  :is(button,input,a,summary):focus-visible{outline:2px solid var(--accent);outline-offset:2px}

  .move{display:flex;gap:8px;align-items:center;margin-top:16px;flex-wrap:wrap}
  .move .spacer{flex:1 1 auto}
  .jump{position:relative;flex:1 1 190px;min-width:150px}
  .hits{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:9;background:var(--card);border:1px solid var(--rule);border-radius:6px;overflow:hidden;display:none}
  .hits.open{display:block}
  .hits button{display:block;width:100%;text-align:left;border:0;border-radius:0;background:transparent;padding:6px 10px;font-size:11.5px}
  .hits button:hover,.hits button.on{background:var(--sunk)}

  details{margin-top:16px;background:var(--card);border:1px solid var(--rule);border-radius:8px}
  summary{cursor:pointer;padding:11px 15px;font-family:var(--mono);font-size:11.5px;color:var(--muted);list-style:none}
  summary::-webkit-details-marker{display:none}
  summary::before{content:"▸ ";color:var(--accent)}
  details[open] summary::before{content:"▾ "}
  .inner{padding:2px 15px 15px}
  pre{margin:0;background:var(--sunk);border:1px solid var(--rule);border-radius:6px;padding:11px;font-family:var(--mono);font-size:11px;line-height:1.45;max-height:280px;overflow:auto}
  .keys{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:5px 18px;font-size:12.5px;color:var(--muted)}
  .keys kbd{font-family:var(--mono);font-size:10.5px;background:var(--sunk);border:1px solid var(--rule);border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:var(--ink)}
  .note{color:var(--muted);font-size:12.5px;margin:10px 0 0}

  footer{margin-top:34px;padding-top:18px;border-top:1px solid var(--rule);color:var(--muted);font-size:12.5px}
  footer a{color:var(--accent)}
  @media (max-width:620px){.stage{grid-template-columns:1fr}}
</style>

<div class="wrap">
<div class="top">
  <div class="track"><div class="fill" id="fill"></div></div>
  <div class="meta">
    <span><b id="at">1</b> / ${names.length}</span>
    <span><b id="seen">0</b> vues</span>
    <span class="tuned"><b id="count">0</b> réglées</span>
    <span class="spacer"></span>
    <button id="export" class="primary">copier le json</button>
    <button id="link">lier un fichier</button>
    <button id="theme">thème</button>
  </div>
</div>

<div class="stage">
  <div class="big"><span class="tag">lucide</span>
    <svg class="hero faint" id="hero-src" width="168" height="168" viewBox="0 0 24 24" aria-hidden="true"></svg>
    <div class="strip" id="strip-src"></div>
  </div>
  <div class="big now"><span class="tag">dessiné</span>
    <svg class="hero" id="hero-new" width="168" height="168" viewBox="0 0 24 24" aria-hidden="true"></svg>
    <div class="strip" id="strip-new"></div>
  </div>
</div>

<div class="name"><h1 id="name"></h1><span class="pill" id="badge" hidden>réglée</span><span class="pill rule" id="ruled" hidden>règle</span></div>

<div class="knobs">
  <div class="knob">
    <label for="drift">dérive</label>
    <input type="range" id="drift" min="0" max="1.2" step="0.01">
    <output id="drift-out"></output><span class="off" id="drift-off"></span>
  </div>
  <div class="knob">
    <label for="bow">bombé</label>
    <input type="range" id="bow" min="0" max="3" step="0.01">
    <output id="bow-out"></output><span class="off" id="bow-off"></span>
  </div>
  <div class="acts">
    <button id="reseed">redessiner</button>
    <button id="clear">remettre au global</button>
    <button id="ok" class="primary">c'est bon, suivante</button>
  </div>
  <input class="why" type="text" id="why" placeholder="pourquoi, facultatif">
</div>

<div class="move">
  <button id="prev">précédente</button>
  <button id="next">suivante</button>
  <button id="unseen">prochaine non vue</button>
  <span class="spacer"></span>
  <div class="jump">
    <input type="search" id="q" placeholder="aller à une icône" aria-label="aller à une icône" autocomplete="off">
    <div class="hits" id="hits"></div>
  </div>
</div>

<details>
  <summary>réglage global, pour tout le catalogue</summary>
  <div class="inner">
    <div class="knob">
      <label for="gdrift">dérive</label>
      <input type="range" id="gdrift" min="0" max="1.2" step="0.01"><output id="gdrift-out"></output><span class="off"></span>
    </div>
    <div class="knob">
      <label for="gbow">bombé</label>
      <input type="range" id="gbow" min="0" max="3" step="0.01"><output id="gbow-out"></output><span class="off"></span>
    </div>
    <p class="note">Vaut pour toutes les icônes que tu n'as pas réglées une par une. Une icône
    réglée garde son propre chiffre.</p>
    <div class="acts"><button id="wipe">tout effacer, réglages et progression</button></div>
  </div>
</details>

<details>
  <summary>le fichier, en direct</summary>
  <div class="inner">
    <pre id="json"></pre>
    <div class="acts">
      <button id="copy2">copier</button>
      <button id="download">télécharger</button>
      <button id="select">tout sélectionner</button>
    </div>
    <p class="note">Si le presse papier et le téléchargement sont refusés par le cadre de la
    page, <b>tout sélectionner</b> puis la copie du clavier marchent toujours. Le texte
    ci dessus est le fichier entier, il n'est jamais tronqué.</p>
    <p class="note" id="linkstate">Rien n'est envoyé nulle part. Tout tient dans ton navigateur
    et survit à un rechargement, à une fermeture ou à un plantage, jusqu'à ce que tu exportes.</p>
    <p class="note" id="room"></p>
  </div>
</details>

<details>
  <summary>raccourcis clavier</summary>
  <div class="inner"><div class="keys">
    <div><kbd>←</kbd> <kbd>→</kbd> icône précédente, suivante</div>
    <div><kbd>Espace</kbd> vue, et on passe</div>
    <div><kbd>↑</kbd> <kbd>↓</kbd> dérive</div>
    <div><kbd>Maj</kbd> <kbd>↑</kbd> <kbd>↓</kbd> bombé</div>
    <div><kbd>R</kbd> redessiner</div>
    <div><kbd>0</kbd> remettre au global</div>
    <div><kbd>U</kbd> prochaine non vue</div>
    <div><kbd>/</kbd> aller à</div>
  </div></div>
</details>

<footer>
  <p>Géométrie : <a href="https://lucide.dev">Lucide</a> ${version}, licence ISC,
  (c) Lucide Icons and Contributors. Le dessin est refait ici avec le code du générateur, donc
  ce que tu vois est ce que <code>pnpm generate</code> écrira.</p>
</footer>
</div>

<script>
${roughener}

const NODES = ${JSON.stringify(nodes)};
const NAMES = ${JSON.stringify(names)};
const DEFAULTS = ${JSON.stringify(hand)};

const KEY = 'sketchyicons-tuning';
const SEEN = 'sketchyicons-seen';
const AT = 'sketchyicons-at';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // the session keeps going, it will not come back
  }
};

let settings = readJSON(KEY, null) || { hand: { ...DEFAULTS }, icons: {} };
if (!settings.hand) settings.hand = { ...DEFAULTS };
if (!settings.icons) settings.icons = {};
let seen = new Set(readJSON(SEEN, []));
let at = Math.min(Math.max(0, readJSON(AT, 0)), NAMES.length - 1);

const el = (id) => document.getElementById(id);
const name = () => NAMES[at];

// drawing

const sourceOf = (n) => NODES[n].map(elementToPath);
const tags = (list) =>
  list
    .map(
      (p) =>
        '<path d="' + p.d + '" fill="' + (p.fill || 'none') +
        '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    )
    .join('');

const effective = (n) => {
  const over = settings.icons[n];
  return {
    drift: over && over.drift !== undefined ? over.drift : settings.hand.drift,
    bow: over && over.bow !== undefined ? over.bow : settings.hand.bow,
    seed: over && over.seed !== undefined ? over.seed : 0,
  };
};

const drawnOf = (n) => {
  const source = sourceOf(n);
  const base = handFor(source);
  const now = effective(n);
  const amplitude = { ...base, drift: now.drift, bow: now.bow };
  const frame = frameFor(source);
  const random = makeRandom(now.seed ? n + '#' + now.seed : n);
  return source.map((p) => ({ d: roughen(p.d, random, amplitude, frame), fill: p.fill }));
};

const strip = (node, list) => {
  node.innerHTML = [15, 20, 24]
    .map(
      (size) =>
        '<span><svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' +
        list + '</svg><small>' + size + '</small></span>',
    )
    .join('');
};

// the whole screen for the icon we are on

const paint = () => {
  const n = name();
  const source = tags(sourceOf(n));
  const drawn = tags(drawnOf(n));
  el('hero-src').innerHTML = source;
  el('hero-new').innerHTML = drawn;
  strip(el('strip-src'), source);
  el('strip-src').classList.add('faint');
  strip(el('strip-new'), drawn);
  el('name').textContent = n;

  const over = settings.icons[n];
  el('badge').hidden = !over;
  el('ruled').hidden = !handFor(sourceOf(n)).straight;
  el('clear').disabled = !over;

  const now = effective(n);
  el('drift').value = now.drift;
  el('bow').value = now.bow;
  el('drift-out').textContent = Number(now.drift).toFixed(2);
  el('bow-out').textContent = Number(now.bow).toFixed(2);
  el('drift-off').textContent =
    over && over.drift !== undefined ? 'propre' : 'global';
  el('bow-off').textContent = over && over.bow !== undefined ? 'propre' : 'global';
  el('why').value = (over && over.why) || '';

  el('at').textContent = String(at + 1);
  el('seen').textContent = String(seen.size);
  el('count').textContent = String(Object.keys(settings.icons).length);
  el('fill').style.width = ((100 * seen.size) / NAMES.length).toFixed(2) + '%';
  el('prev').disabled = at === 0;
  el('next').disabled = at === NAMES.length - 1;
  showJSON();
};

// changing something

const save = () => {
  write(KEY, settings);
  toFile();
  showJSON();
};

const set = (change) => {
  const n = name();
  const entry = { ...(settings.icons[n] || {}), ...change };
  for (const key of Object.keys(entry)) if (entry[key] === undefined) delete entry[key];
  const knobs = ['drift', 'bow', 'seed'].filter((k) => entry[k] !== undefined);
  if (!knobs.length) delete settings.icons[n];
  else {
    entry.why = (entry.why || '').trim() || 'réglée à la main';
    settings.icons[n] = entry;
  }
  save();
  paint();
};

const go = (to) => {
  if (to === at || to < 0 || to >= NAMES.length) return;
  // Leaving an icon is what counts as having looked at it.
  seen.add(name());
  write(SEEN, [...seen]);
  at = to;
  write(AT, at);
  paint();
};

// the knobs

for (const [id, knob] of [
  ['drift', 'drift'],
  ['bow', 'bow'],
]) {
  el(id).addEventListener('input', () => {
    el(id + '-out').textContent = Number(el(id).value).toFixed(2);
    set({ [knob]: Number(el(id).value) });
  });
}
el('why').addEventListener('input', () => {
  if (settings.icons[name()]) set({ why: el('why').value });
});
el('reseed').addEventListener('click', () => {
  const over = settings.icons[name()] || {};
  set({ seed: ((over.seed || 0) % 999) + 1 });
});
el('clear').addEventListener('click', () => {
  delete settings.icons[name()];
  save();
  paint();
});
el('ok').addEventListener('click', () => go(at + 1));
el('prev').addEventListener('click', () => go(at - 1));
el('next').addEventListener('click', () => go(at + 1));
el('unseen').addEventListener('click', () => {
  for (let step = 1; step <= NAMES.length; step += 1) {
    const to = (at + step) % NAMES.length;
    if (!seen.has(NAMES[to])) return go(to);
  }
});

for (const [id, knob] of [
  ['gdrift', 'drift'],
  ['gbow', 'bow'],
]) {
  el(id).addEventListener('input', () => {
    settings.hand[knob] = Number(el(id).value);
    el(id + '-out').textContent = Number(el(id).value).toFixed(2);
    save();
    paint();
  });
}
el('wipe').addEventListener('click', () => {
  settings = { hand: { ...DEFAULTS }, icons: {} };
  seen = new Set();
  at = 0;
  write(KEY, settings);
  write(SEEN, []);
  write(AT, 0);
  showGlobals();
  save();
  paint();
});

const showGlobals = () => {
  el('gdrift').value = settings.hand.drift;
  el('gbow').value = settings.hand.bow;
  el('gdrift-out').textContent = Number(settings.hand.drift).toFixed(2);
  el('gbow-out').textContent = Number(settings.hand.bow).toFixed(2);
};

// jumping to a name

const q = el('q');
const hits = el('hits');
let hitList = [];
let hitAt = -1;

const paintHits = () => {
  hits.innerHTML = hitList
    .map((n, i) => '<button data-go="' + n + '" class="' + (i === hitAt ? 'on' : '') + '">' + n + '</button>')
    .join('');
  hits.classList.toggle('open', hitList.length > 0);
};
q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  hitList = term ? NAMES.filter((n) => n.includes(term)).slice(0, 8) : [];
  hitAt = hitList.length ? 0 : -1;
  paintHits();
});
q.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!hitList.length) return;
    hitAt = (hitAt + (event.key === 'ArrowDown' ? 1 : hitList.length - 1)) % hitList.length;
    paintHits();
  } else if (event.key === 'Enter' && hitAt > -1) {
    event.preventDefault();
    go(NAMES.indexOf(hitList[hitAt]));
    q.value = '';
    hitList = [];
    paintHits();
    q.blur();
  } else if (event.key === 'Escape') {
    q.value = '';
    hitList = [];
    paintHits();
    q.blur();
  }
});
hits.addEventListener('click', (event) => {
  const target = event.target.closest('[data-go]');
  if (!target) return;
  go(NAMES.indexOf(target.dataset.go));
  q.value = '';
  hitList = [];
  paintHits();
});

// keys

addEventListener('keydown', (event) => {
  const typing = /^(INPUT|TEXTAREA)$/.test(event.target.tagName);
  if (event.key === '/' && !typing) {
    event.preventDefault();
    q.focus();
    return;
  }
  if (typing) return;
  const step = (knob, by) => {
    const now = effective(name());
    const max = knob === 'drift' ? 1.2 : 3;
    set({ [knob]: Math.min(max, Math.max(0, Number((now[knob] + by).toFixed(2)))) });
  };
  if (event.key === 'ArrowRight') go(at + 1);
  else if (event.key === 'ArrowLeft') go(at - 1);
  else if (event.key === 'ArrowUp') step(event.shiftKey ? 'bow' : 'drift', event.shiftKey ? 0.05 : 0.02);
  else if (event.key === 'ArrowDown') step(event.shiftKey ? 'bow' : 'drift', event.shiftKey ? -0.05 : -0.02);
  else if (event.key === ' ') go(at + 1);
  else if (event.key === 'r' || event.key === 'R') el('reseed').click();
  else if (event.key === '0') el('clear').click();
  else if (event.key === 'u' || event.key === 'U') el('unseen').click();
  else return;
  event.preventDefault();
});

// getting it out

const report = () => {
  const list = Object.keys(settings.icons).sort();
  const icons = {};
  for (const n of list) {
    const entry = settings.icons[n];
    const out = {};
    if (entry.seed !== undefined) out.seed = entry.seed;
    if (entry.drift !== undefined) out.drift = Number(Number(entry.drift).toFixed(2));
    if (entry.bow !== undefined) out.bow = Number(Number(entry.bow).toFixed(2));
    out.why = entry.why;
    icons[n] = out;
  }
  return (
    JSON.stringify(
      {
        hand: {
          drift: Number(Number(settings.hand.drift).toFixed(2)),
          bow: Number(Number(settings.hand.bow).toFixed(2)),
        },
        icons,
      },
      null,
      2,
    ) + '\\n'
  );
};

const showJSON = () => {
  const text = report();
  el('json').textContent = text;
  // A quota that filled up silently would be the one way to lose a long pass, so
  // what it costs and what it can hold are both on screen.
  const kb = (n) => (n / 1024).toFixed(0) + ' kB';
  el('room').textContent =
    'Le fichier pèse ' + kb(text.length) + ' pour ' + Object.keys(settings.icons).length +
    ' icônes réglées. Le navigateur en accepte plusieurs milliers.';
};

const flash = (button, text, back) => {
  button.textContent = text;
  setTimeout(() => (button.textContent = back), 1600);
};

for (const id of ['export', 'copy2']) {
  el(id).addEventListener('click', async () => {
    const back = el(id).textContent;
    try {
      await navigator.clipboard.writeText(report());
      flash(el(id), 'copié', back);
    } catch {
      flash(el(id), 'refusé, télécharge', back);
    }
  });
}

// The last resort, and the one nothing can take away: the file is on screen, so
// it can always be selected and copied by hand. A frame may refuse the clipboard
// and it may refuse a download, so neither is the only way out.
el('select').addEventListener('click', () => {
  const pre = el('json');
  const range = document.createRange();
  range.selectNodeContents(pre);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  pre.scrollIntoView({ block: 'nearest' });
  flash(el('select'), 'sélectionné, copie au clavier', 'tout sélectionner');
});

el('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([report()], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'overrides.json';
  link.click();
  URL.revokeObjectURL(url);
});

// A real file, where the browser allows one. Chrome and Edge do, Firefox and
// Safari do not, and a page inside a frame may be refused either way. So it is
// offered, and what happens is reported rather than assumed.
let handle = null;
const linkState = el('linkstate');
const linkButton = el('link');

if (typeof window.showSaveFilePicker !== 'function') {
  linkButton.disabled = true;
  linkButton.title = "ce navigateur ne sait pas écrire dans un fichier depuis une page";
}

linkButton.addEventListener('click', async () => {
  try {
    handle = await window.showSaveFilePicker({
      suggestedName: 'overrides.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    await toFile();
    linkButton.textContent = 'fichier lié';
    linkState.textContent =
      'Chaque changement est écrit dans le fichier que tu as choisi, en plus du navigateur.';
  } catch (error) {
    handle = null;
    linkState.textContent =
      'Le navigateur a refusé le lien vers un fichier (' +
      (error && error.name ? error.name : 'inconnu') +
      '). Tout reste enregistré dans le navigateur, utilise copier ou télécharger.';
  }
});

let writing = false;
async function toFile() {
  if (!handle || writing) return;
  writing = true;
  try {
    const stream = await handle.createWritable();
    await stream.write(report());
    await stream.close();
  } catch {
    handle = null;
    linkState.textContent = 'Le fichier lié n\\'est plus accessible. Utilise copier ou télécharger.';
  } finally {
    writing = false;
  }
}

el('theme').addEventListener('click', () => {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const current = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
  document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark';
});

addEventListener('storage', (event) => {
  if (event.key !== KEY && event.key !== SEEN) return;
  settings = readJSON(KEY, settings);
  seen = new Set(readJSON(SEEN, [...seen]));
  showGlobals();
  paint();
});

showGlobals();
paint();
</script>
`;
}
