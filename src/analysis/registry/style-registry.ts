import { generateDown, generateDownUp, generateUp, generateUpDown } from './generators';
import type { Style } from './types';

/**
 * The Style Registry: single source of truth for arpeggiator styles.
 *
 * Registry order is significant — it is the final deterministic
 * tie-break in style matching (D-202). Changing the order changes
 * deterministic behavior and is a breaking change.
 */
export const STYLE_REGISTRY: readonly Style[] = [
  {
    id: 'up',
    displayName: 'Up',
    sinceVersion: '2.0',
    polyphonic: false,
    endpointRepeat: false,
    generate: generateUp,
  },
  {
    id: 'down',
    displayName: 'Down',
    sinceVersion: '2.0',
    polyphonic: false,
    endpointRepeat: false,
    generate: generateDown,
  },
  {
    id: 'up-down',
    displayName: 'UpDown',
    sinceVersion: '2.0',
    polyphonic: false,
    endpointRepeat: false,
    generate: generateUpDown,
  },
  {
    id: 'down-up',
    displayName: 'DownUp',
    sinceVersion: '2.0',
    polyphonic: false,
    endpointRepeat: false,
    generate: generateDownUp,
  },
];

/**
 * Registry version, recorded in every analysis result for
 * reproducibility. Bump whenever registry behavior changes.
 */
export const REGISTRY_VERSION = '2.1.0';

export function getStyleById(id: string): Style | undefined {
  return STYLE_REGISTRY.find((style) => style.id === id);
}
