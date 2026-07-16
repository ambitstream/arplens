/**
 * One step of a generated cycle.
 *
 * Represents a SET of abstract note indices (D-302): sorted ascending,
 * no duplicates. A readonly array is used instead of `Set` so that
 * steps stay deterministic to iterate, structurally comparable and
 * serializable. In the MVP every step contains exactly one index.
 */
export type Step = readonly number[];

/**
 * One complete arpeggio cycle: ordered steps.
 *
 * Generated sequences consist of exactly one cycle. Element order
 * defines rotation 0 (the pattern start), which the matcher's
 * phase-preference tie-break relies on (D-206).
 */
export type Cycle = readonly Step[];

/**
 * Input contract for style generators (D-303).
 *
 * Future styles extend this with OPTIONAL fields (e.g. the performed
 * note order for Play Order) so existing generators never break.
 */
export interface GeneratorContext {
  /** Number of distinct input notes. Integer >= 1. */
  readonly noteCount: number;

  /** Number of octaves the arpeggiator spans. Integer >= 1. */
  readonly octaves: number;
}

/**
 * One Style Registry entry.
 *
 * The registry is the single source of truth for style behavior:
 * matcher, preview, editor and tests all consume these entries.
 */
export interface Style {
  /** Unique identifier, e.g. "up". */
  readonly id: string;

  /** Human-readable name, e.g. "Up". */
  readonly displayName: string;

  /** Documentation version in which the style became available. */
  readonly sinceVersion: string;

  /** Whether the style generates multiple notes per step. */
  readonly polyphonic: boolean;

  /** Turnaround behavior: whether endpoints repeat at direction changes. */
  readonly endpointRepeat: boolean;

  /** Pure generator: identical context always yields an identical cycle. */
  readonly generate: (context: GeneratorContext) => Cycle;
}
