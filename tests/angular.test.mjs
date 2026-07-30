// The angular package ships one component and the icons as data, so what has to
// be asserted is that the data reaches the template and the inputs land on the
// svg. Rendering it needs the angular compiler, which needs a compiled app, so
// this drives the built bundle rather than the source.

// Importing the bundle makes angular compile the component just in time, which
// needs the compiler present, exactly as a browser app does.
import '@angular/compiler';
import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const BUNDLE = 'packages/angular/dist/fesm2022/sketchyicons-angular.mjs';
const built = existsSync(BUNDLE);

const icon = (name) => JSON.parse(readFileSync(`packages/data/icons/${name}.json`, 'utf8'));

describe.skipIf(!built)('the angular bundle', () => {
  it('carries the geometry the generator wrote', async () => {
    const { House } = await import(`../${BUNDLE}`);
    expect(House.map(([, attributes]) => attributes.d)).toEqual(
      icon('house').paths.map((path) => path.d),
    );
  });

  it('exports the same icon names as the other targets', async () => {
    const [angular, react] = await Promise.all([
      import(`../${BUNDLE}`),
      import('../packages/react/dist/esm/index.js'),
    ]);
    const names = (module) =>
      Object.keys(module)
        .filter((key) => /^[A-Z]/.test(key))
        .sort();
    // The component is the one export angular has and the others do not.
    expect(names(angular).filter((n) => n !== 'SketchyIconComponent')).toEqual(names(react));
  });

  it('ships one component, not 1756', async () => {
    const module = await import(`../${BUNDLE}`);
    const components = Object.entries(module).filter(
      ([, value]) => typeof value === 'function' && 'ɵcmp' in value,
    );
    expect(components.map(([name]) => name)).toEqual(['SketchyIconComponent']);
  });

  it('is compiled in partial mode, as the angular package format requires', () => {
    const source = readFileSync(BUNDLE, 'utf8');
    expect(source).toContain('ɵɵngDeclareComponent');
  });

  it('carries no source map pointing at sources it does not ship', () => {
    expect(existsSync(`${BUNDLE}.map`)).toBe(false);
  });
});
