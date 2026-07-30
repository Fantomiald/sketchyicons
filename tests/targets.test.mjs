// Every target renders the same geometry through its own framework. A drawing
// that differs between packages would mean one of them reads the data wrong.

import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { describe, expect, it } from 'vitest';

const icon = (name) => JSON.parse(readFileSync(`packages/data/icons/${name}.json`, 'utf8'));

/** The paths the generator wrote for an icon, in order. */
const geometry = (name) => icon(name).paths.map((path) => path.d);

describe('the vue target', () => {
  it('carries the geometry the generator wrote', async () => {
    const { createSSRApp, h } = await import('vue');
    const { renderToString } = await import('vue/server-renderer');
    const { House } = await import('../packages/vue/dist/esm/index.js');
    const html = await renderToString(createSSRApp({ render: () => h(House) }));
    for (const d of geometry('house')) expect(html).toContain(d);
  });

  it('takes the same props as the react target', async () => {
    const { createSSRApp, h } = await import('vue');
    const { renderToString } = await import('vue/server-renderer');
    const { House } = await import('../packages/vue/dist/esm/index.js');
    const html = await renderToString(
      createSSRApp({ render: () => h(House, { size: 15, color: '#2B2521', strokeWidth: 1.5 }) }),
    );
    expect(html).toContain('width="15"');
    expect(html).toContain('stroke="#2B2521"');
    expect(html).toContain('stroke-width="1.5"');
  });

  it('scales the stroke on absoluteStrokeWidth', async () => {
    const { createSSRApp, h } = await import('vue');
    const { renderToString } = await import('vue/server-renderer');
    const { House } = await import('../packages/vue/dist/esm/index.js');
    const html = await renderToString(
      createSSRApp({ render: () => h(House, { size: 12, absoluteStrokeWidth: true }) }),
    );
    expect(html).toContain('stroke-width="4"');
  });
});

describe('the dom target', () => {
  const inWindow = async (run) => {
    const window = new Window({ url: 'https://sketchyicons.test/' });
    const before = globalThis.document;
    globalThis.document = window.document;
    try {
      return await run(window);
    } finally {
      globalThis.document = before;
    }
  };

  it('builds an svg element carrying the geometry', async () => {
    const { createElement, House } = await import('../packages/vanilla/dist/esm/index.js');
    await inWindow(() => {
      const svg = createElement(House);
      expect(svg.tagName).toBe('svg');
      const drawn = [...svg.querySelectorAll('path')].map((p) => p.getAttribute('d'));
      expect(drawn).toEqual(geometry('house'));
    });
  });

  it('lets an attribute on the element win over the shared ones', async () => {
    const { createIcons, House } = await import('../packages/vanilla/dist/esm/index.js');
    await inWindow((window) => {
      window.document.body.innerHTML = '<i data-sketchy="house" width="15"></i>';
      createIcons({ icons: { House }, attrs: { width: 32 } });
      expect(window.document.querySelector('svg').getAttribute('width')).toBe('15');
    });
  });

  it('leaves an icon it was not given alone', async () => {
    const { createIcons, House } = await import('../packages/vanilla/dist/esm/index.js');
    await inWindow((window) => {
      window.document.body.innerHTML = '<i data-sketchy="house"></i><i data-sketchy="rabbit"></i>';
      createIcons({ icons: { House } });
      expect(window.document.querySelectorAll('svg')).toHaveLength(1);
      expect(window.document.querySelectorAll('[data-sketchy]')).toHaveLength(1);
    });
  });

  it('refuses an empty list rather than doing nothing quietly', async () => {
    const { createIcons } = await import('../packages/vanilla/dist/esm/index.js');
    await inWindow(() => {
      expect(() => createIcons({ icons: {} })).toThrow(/none were given/);
    });
  });
});

describe('every target agrees', () => {
  it('exports the same names', async () => {
    const [react, vue, dom] = await Promise.all([
      import('../packages/react/dist/esm/index.js'),
      import('../packages/vue/dist/esm/index.js'),
      import('../packages/vanilla/dist/esm/index.js'),
    ]);
    const icons = (m) =>
      Object.keys(m)
        .filter((k) => /^[A-Z]/.test(k))
        .sort();
    expect(icons(vue)).toEqual(icons(react));
    // The DOM package exports geometry and two helpers rather than components,
    // so its extra names are the helpers.
    expect(icons(dom)).toEqual(icons(react));
  });
});
