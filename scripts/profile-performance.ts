/**
 * Performance profiling (docs/08_TEST_STRATEGY.md, M6 deliverable):
 * Analysis Time, Memory Usage, Worker Responsiveness, and Preview
 * Generation Time, measured against a live server. No hardcoded
 * targets (the test strategy says these are benchmark-driven, not
 * fixed in the MVP) — this records a baseline to compare future runs
 * against.
 *
 * Usage: tsx scripts/profile-performance.ts [--url http://localhost:5173]
 *
 * Baseline (M6, Chromium via Playwright, dev server, one machine —
 * absolute numbers are hardware-specific, use them only for spotting
 * regressions on the SAME machine):
 *
 *   file                             analysisMs  heapDeltaMb  maxFrameGapMs  previewStartMs
 *   up-c-major-3n-2o-120bpm-16th        ~900        ~0           ~50            ~210
 *   up-down-a-minor-3n-1o-124bpm-8th    ~850        ~0           ~18            ~105
 *   tier2-dense-mix                     ~850        ~0           ~20            ~100
 *
 * Reading: analysis is sub-second; the worker keeps the main thread
 * responsive (frame gaps stay far below the ~1s+ that a main-thread
 * analysis would cause); steady-state heap growth is negligible
 * (D-108); preview starts within ~100-210ms of the click.
 */
import { chromium, type Page } from '@playwright/test';

const urlArg = process.argv.find((arg) => arg.startsWith('--url'));
const baseUrl = urlArg?.includes('=') ? urlArg.split('=')[1] : 'http://localhost:5173';

const FIXTURES = [
  'up-c-major-3n-2o-120bpm-16th.wav',
  'up-down-a-minor-3n-1o-124bpm-8th.wav',
  'tier2-dense-mix.wav', // the heaviest committed fixture (pad + reverb tail + noise)
];

interface Metrics {
  readonly file: string;
  readonly analysisMs: number;
  readonly heapBeforeMb: number;
  readonly heapAfterMb: number;
  readonly heapDeltaMb: number;
  readonly maxFrameGapMs: number;
  readonly previewStartMs: number;
}

// Passed to page.evaluate() as plain strings, not compiled TS
// closures: tsx/esbuild's __name() helper-injection for named
// function expressions doesn't survive being extracted into
// Playwright's isolated browser-side eval sandbox.
const HEAP_MB_SCRIPT = `
  (performance.memory ? performance.memory.usedJSHeapSize : 0) / (1024 * 1024)
`;

const START_FRAME_WATCH_SCRIPT = `
  window.__frameGaps = [];
  window.__frameWatch = true;
  let last = performance.now();
  function tick() {
    const now = performance.now();
    window.__frameGaps.push(now - last);
    last = now;
    if (window.__frameWatch) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
`;

const STOP_FRAME_WATCH_SCRIPT = `
  window.__frameWatch = false;
  Math.max(...window.__frameGaps)
`;

async function heapMb(page: Page): Promise<number> {
  return page.evaluate(HEAP_MB_SCRIPT);
}

/** Starts sampling requestAnimationFrame gaps on the main thread; call the returned function to stop and read the max gap. */
async function startFrameGapWatch(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(START_FRAME_WATCH_SCRIPT);
  return () => page.evaluate(STOP_FRAME_WATCH_SCRIPT);
}

async function profile(page: Page, file: string): Promise<Metrics> {
  await page.goto(baseUrl);
  await page.getByLabel('Audio file').setInputFiles(`e2e/fixtures/${file}`);

  const heapBeforeMb = await heapMb(page);
  const stopWatch = await startFrameGapWatch(page);

  const analyzeStart = Date.now();
  await page.getByRole('button', { name: 'Analyze' }).click();
  await Promise.race([
    page.getByRole('alert').waitFor({ state: 'visible', timeout: 210_000 }),
    page.getByRole('button', { name: 'Style', exact: true }).waitFor({
      state: 'visible',
      timeout: 210_000,
    }),
  ]);
  const analysisMs = Date.now() - analyzeStart;

  const maxFrameGapMs = await stopWatch();
  const heapAfterMb = await heapMb(page);

  let previewStartMs = -1;
  const playButton = page.getByRole('button', { name: 'Play Modulation' });
  if (await playButton.isVisible().catch(() => false)) {
    const previewStart = Date.now();
    await playButton.click();
    await page.getByRole('button', { name: 'Play Modulation', pressed: true }).waitFor({
      timeout: 15_000,
    });
    previewStartMs = Date.now() - previewStart;
  }

  return {
    file,
    analysisMs,
    heapBeforeMb,
    heapAfterMb,
    heapDeltaMb: heapAfterMb - heapBeforeMb,
    maxFrameGapMs,
    previewStartMs,
  };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const rows: Metrics[] = [];

  for (const file of FIXTURES) {
    process.stderr.write(`profiling ${file}...\n`);
    rows.push(await profile(page, file));
  }

  await browser.close();

  console.log(
    'file'.padEnd(34),
    'analysisMs'.padStart(11),
    'heapDeltaMb'.padStart(12),
    'maxFrameGapMs'.padStart(14),
    'previewStartMs'.padStart(15),
  );
  for (const row of rows) {
    console.log(
      row.file.padEnd(34),
      row.analysisMs.toString().padStart(11),
      row.heapDeltaMb.toFixed(1).padStart(12),
      row.maxFrameGapMs.toFixed(1).padStart(14),
      row.previewStartMs.toString().padStart(15),
    );
  }
}

void main();
