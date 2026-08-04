import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('the figma-plugin target', () => {
  it('writes a bundle with a solid stroke and the alias map', () => {
    rmSync('packages/figma-plugin/src/generated', { recursive: true, force: true });
    execFileSync('node', ['tools/build-targets.mjs', '--target', 'figma-plugin'], {
      stdio: 'pipe',
    });

    expect(existsSync('packages/figma-plugin/src/generated/icons.json')).toBe(true);
    const bundle = JSON.parse(
      readFileSync('packages/figma-plugin/src/generated/icons.json', 'utf8'),
    );

    expect(bundle.icons.house).toContain('stroke="#17130e"');
    expect(bundle.icons.house).not.toContain('currentColor');
    expect(bundle.aliases['activity-square']).toBe('square-activity');
  });
});
