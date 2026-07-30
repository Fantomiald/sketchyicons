import json

SP = "/private/tmp/claude-501/-Users-julienmontagne-Futur-shelfmate-mobile/56305aa6-7a56-4c83-a6f0-f517234c3f66/scratchpad"
data = json.load(open(f"{SP}/icons.json"))
data.sort(key=lambda e: e["component"])

HAND_LABEL = {"quiet": "sobre", "some": "moyen", "loose": "libre"}

def svg(paths, size, stroke=2, cls=""):
    body = "".join(
        f'<path d="{d}" fill="none" stroke="currentColor" stroke-width="{stroke}"'
        f' stroke-linecap="round" stroke-linejoin="round"/>'
        for d in paths
    )
    return (f'<svg class="{cls}" width="{size}" height="{size}" viewBox="0 0 24 24"'
            f' aria-hidden="true">{body}</svg>')

cards = []
for e in data:
    name, hand = e["component"], e["hand"]
    cards.append(f"""<article class="card" data-hand="{hand}">
  <div class="pair">
    <div class="cell"><span class="tag">lucide</span>{svg(e["source"], 28, 2, "flat")}</div>
    <div class="cell"><span class="tag">à la main</span>{svg(e["drawn"], 28, 2, "drawn")}</div>
  </div>
  <div class="sizes">
    {svg(e["drawn"], 15, 2)}{svg(e["drawn"], 20, 2)}{svg(e["drawn"], 24, 1.75)}
  </div>
  <h3>{name}</h3>
  <span class="hand">{HAND_LABEL[hand]}</span>
</article>""")

counts = {}
for e in data:
    counts[e["hand"]] = counts.get(e["hand"], 0) + 1

page = f"""<title>Shelfmate — 82 icônes dessinées à la main</title>
<style>
  :root {{
    --page: #FBF9F5;
    --panel: #F3ECE1;
    --ink: #2B2521;
    --muted: #6B6259;
    --line: #E4DBCB;
    --accent: #A5620E;
  }}
  @media (prefers-color-scheme: dark) {{
    :root {{
      --page: #14100C; --panel: #1F1913; --ink: #F6F0E6;
      --muted: #968A7B; --line: #302719; --accent: #E3A64A;
    }}
  }}
  :root[data-theme="dark"] {{
    --page: #14100C; --panel: #1F1913; --ink: #F6F0E6;
    --muted: #968A7B; --line: #302719; --accent: #E3A64A;
  }}
  :root[data-theme="light"] {{
    --page: #FBF9F5; --panel: #F3ECE1; --ink: #2B2521;
    --muted: #6B6259; --line: #E4DBCB; --accent: #A5620E;
  }}

  body {{
    background: var(--page);
    color: var(--ink);
    font-family: ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif;
    line-height: 1.5;
    margin: 0;
    padding: clamp(20px, 5vw, 56px);
  }}
  header {{ max-width: 62ch; }}
  h1 {{
    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
    font-weight: 600;
    font-size: clamp(1.7rem, 4vw, 2.5rem);
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin: 0 0 .5rem;
    text-wrap: balance;
  }}
  header p {{ color: var(--muted); margin: 0 0 .6rem; font-size: .95rem; }}
  code {{
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: .85em;
    background: var(--panel);
    padding: .1em .4em;
    border-radius: 4px;
  }}

  .legend {{
    display: flex; flex-wrap: wrap; gap: .5rem 1.25rem;
    margin: 1.5rem 0 0; padding: 0; list-style: none;
    font-size: .85rem; color: var(--muted);
  }}
  .legend b {{ color: var(--ink); font-weight: 600; }}

  .controls {{
    display: flex; flex-wrap: wrap; gap: .5rem;
    margin: 1.75rem 0 2rem;
  }}
  button {{
    font: inherit; font-size: .85rem;
    color: var(--ink); background: var(--panel);
    border: 1px solid transparent; border-radius: 999px;
    padding: .45rem 1rem; cursor: pointer;
  }}
  button[aria-pressed="true"] {{ background: var(--ink); color: var(--page); }}
  button:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}

  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 14px;
  }}
  .card {{
    background: var(--panel);
    border-radius: 16px;
    padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
  }}
  .pair {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
  .cell {{
    position: relative;
    background: var(--page);
    border-radius: 10px;
    aspect-ratio: 1;
    display: grid; place-items: center;
  }}
  .tag {{
    position: absolute; top: 5px; left: 7px;
    font-size: .58rem; letter-spacing: .04em;
    color: var(--muted);
  }}
  .flat {{ opacity: .45; }}
  .sizes {{
    display: flex; align-items: flex-end; gap: 12px;
    padding: 2px 2px 0;
    min-height: 26px;
  }}
  h3 {{
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: .74rem; font-weight: 500;
    margin: auto 0 0; word-break: break-word;
  }}
  .hand {{ font-size: .68rem; color: var(--muted); }}
  body.only-drawn .flat {{ display: none; }}
  body.only-drawn .cell:first-child {{ display: none; }}
  body.only-drawn .pair {{ grid-template-columns: 1fr; }}
  footer {{
    margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid var(--line);
    color: var(--muted); font-size: .82rem; max-width: 68ch;
  }}
</style>

<header>
  <h1>82 icônes, la géométrie de Lucide et une main</h1>
  <p>Chaque carte montre l’original Lucide en pâle à gauche, la version dessinée à droite,
  puis la même à 15, 20 et 24 pixels — les trois tailles auxquelles l’app les affiche
  réellement. C’est à 15 que ça se joue.</p>
  <p>Les tracés droits se courbent, chaque coordonnée dérive, et la dérive est tirée d’une
  graine calculée sur le nom de l’icône : une régénération redonne exactement le même dessin.</p>
  <ul class="legend">
    <li><b>{counts.get('quiet', 0)}</b> sobres — chrome et symboles connus (croix, chevrons, plus)</li>
    <li><b>{counts.get('some', 0)}</b> moyens — objets et actions</li>
    <li><b>{counts.get('loose', 0)}</b> libres — cœur, flamme, couronne, plume</li>
  </ul>
</header>

<div class="controls">
  <button id="toggle-compare" aria-pressed="false">Masquer Lucide</button>
  <button id="toggle-theme" aria-pressed="false">Inverser le thème</button>
</div>

<div class="grid">
{chr(10).join(cards)}
</div>

<footer>
  <p>Géométrie : <a href="https://lucide.dev" style="color:inherit">Lucide</a>, licence ISC,
  © Lucide Icons and Contributors. Le passage à la main est fait par
  <code>tools/roughen-icons.mjs</code>, qui n’écrit rien dans <code>src/</code> tant qu’on ne
  lui passe pas <code>--out</code>.</p>
</footer>

<script>
  const compare = document.getElementById("toggle-compare");
  compare.addEventListener("click", () => {{
    const on = document.body.classList.toggle("only-drawn");
    compare.setAttribute("aria-pressed", String(on));
    compare.textContent = on ? "Afficher Lucide" : "Masquer Lucide";
  }});

  const theme = document.getElementById("toggle-theme");
  theme.addEventListener("click", () => {{
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const current = document.documentElement.dataset.theme || (dark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    theme.setAttribute("aria-pressed", String(next !== (dark ? "dark" : "light")));
  }});
</script>
"""

open(f"{SP}/icons-preview.html", "w").write(page)
print("page:", len(page), "octets ·", len(data), "icônes")
