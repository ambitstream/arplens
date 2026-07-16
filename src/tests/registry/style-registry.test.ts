import { describe, expect, it } from 'vitest';
import {
  REGISTRY_VERSION,
  STYLE_REGISTRY,
  getStyleById,
} from '../../analysis/registry/style-registry';

describe('STYLE_REGISTRY contract', () => {
  it('contains exactly the MVP styles in tie-break order (D-202)', () => {
    expect(STYLE_REGISTRY.map((style) => style.id)).toEqual(['up', 'down', 'up-down', 'down-up']);
    expect(STYLE_REGISTRY.map((style) => style.displayName)).toEqual([
      'Up',
      'Down',
      'UpDown',
      'DownUp',
    ]);
  });

  it('has unique ids', () => {
    const ids = STYLE_REGISTRY.map((style) => style.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares MVP metadata on every entry', () => {
    for (const style of STYLE_REGISTRY) {
      expect(style.sinceVersion).toBe('2.0');
      expect(style.polyphonic).toBe(false);
      expect(style.endpointRepeat).toBe(false);
      expect(typeof style.generate).toBe('function');
    }
  });

  it('generates deterministically through the registry', () => {
    for (const style of STYLE_REGISTRY) {
      const first = style.generate({ noteCount: 3, octaves: 2 });
      const second = style.generate({ noteCount: 3, octaves: 2 });

      expect(second).toEqual(first);
    }
  });

  it('every generated step is monophonic in the MVP', () => {
    for (const style of STYLE_REGISTRY) {
      const cycle = style.generate({ noteCount: 4, octaves: 3 });

      for (const step of cycle) {
        expect(step).toHaveLength(1);
      }
    }
  });
});

describe('REGISTRY_VERSION', () => {
  it('is a semantic version', () => {
    expect(REGISTRY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('getStyleById', () => {
  it('returns the matching entry', () => {
    expect(getStyleById('down-up')?.displayName).toBe('DownUp');
  });

  it('returns undefined for unknown ids', () => {
    expect(getStyleById('random')).toBeUndefined();
  });
});
