/**
 * Runs every Golden Dataset case (e2e/golden-dataset.ts) against a
 * live server and reports actual vs. expected outcome, plus the
 * confidence band for each recovered case — the tool confidence
 * calibration (M6) is tuned against. Requires a server already
 * running at the URL given by --url (default http://localhost:5173).
 *
 * Usage: tsx scripts/run-golden-dataset.ts [--url http://localhost:5173]
 */
import { chromium, type Page } from '@playwright/test';
import { GOLDEN_DATASET, type ExpectedOutcome } from '../e2e/golden-dataset';

const urlArg = process.argv.find((arg) => arg.startsWith('--url'));
const baseUrl = urlArg?.includes('=') ? urlArg.split('=')[1] : 'http://localhost:5173';

interface Actual {
  readonly kind: 'complete' | 'partial-no-style' | 'error';
  readonly style?: string;
  readonly inputNotes?: readonly string[];
  readonly octaves?: number;
  readonly rate?: string;
  readonly confidence?: string;
  readonly errorTitle?: string;
}

async function readActual(page: Page): Promise<Actual> {
  const alert = page.getByRole('alert');
  const styleButton = page.getByRole('button', { name: 'Style', exact: true });

  // Which one appears first determines the branch — checking the
  // alert synchronously races the "no pitched material" cases, where
  // it only renders after Basic Pitch actually finishes transcribing.
  await Promise.race([
    alert.waitFor({ state: 'visible', timeout: 210_000 }),
    styleButton.waitFor({ state: 'visible', timeout: 210_000 }),
  ]);

  if (await alert.isVisible().catch(() => false)) {
    const text = (await alert.innerText()).trim();
    // ERROR_COPY renders "<Title>. <detail>" inside the alert.
    const errorTitle = text.split('.')[0];
    return { kind: 'error', errorTitle };
  }

  const style = (await styleButton.innerText()).trim();

  if (style === 'Not detected') {
    return { kind: 'partial-no-style' };
  }

  const rate = (await page.getByRole('button', { name: 'Rate', exact: true }).innerText()).trim();
  // Anchor on the Increase-octaves button (stable aria-label): its
  // grandparent is the row holding both the value div and the
  // +/- buttons, and the value is that row's first div.
  const octaveText = await page
    .getByRole('button', { name: 'Increase octaves' })
    .locator('../..')
    .locator('div')
    .first()
    .innerText();
  const octaves = Number.parseInt(octaveText, 10);

  const inputNotes: string[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const button = page.getByRole('button', { name: `Input note ${i}:`, exact: false });
    if (!(await button.isVisible().catch(() => false))) {
      break;
    }
    inputNotes.push((await button.innerText()).trim());
  }

  const confidenceBadge = page.getByText('confidence', { exact: false });
  const confidence = (await confidenceBadge.innerText().catch(() => '')).trim();

  return { kind: 'complete', style, rate, octaves, inputNotes, confidence };
}

function matches(expected: ExpectedOutcome, actual: Actual): boolean {
  if (expected.kind !== actual.kind) {
    return false;
  }
  if (expected.kind === 'complete' && actual.kind === 'complete') {
    return (
      expected.style === actual.style &&
      expected.rate === actual.rate &&
      expected.octaves === actual.octaves &&
      expected.inputNotes.join(',') === (actual.inputNotes ?? []).join(',')
    );
  }
  if (expected.kind === 'error' && actual.kind === 'error') {
    return expected.errorTitle === actual.errorTitle;
  }
  return true; // partial-no-style has no further fields to compare
}

async function main() {
  const browser = await chromium.launch();
  let failures = 0;
  const rows: string[] = [];

  for (const testCase of GOLDEN_DATASET) {
    process.stderr.write(`running ${testCase.file}...\n`);
    const page = await browser.newPage();
    try {
      await page.goto(baseUrl);
      await page.getByLabel('Audio file').setInputFiles(`e2e/fixtures/${testCase.file}`);
      const analyzeBtn = page.getByRole('button', { name: 'Analyze' });
      if (
        await analyzeBtn.waitFor({ state: 'visible', timeout: 5000 }).then(
          () => true,
          () => false,
        )
      ) {
        await analyzeBtn.click();
      }

      const actual = await readActual(page);
      const ok = matches(testCase.expected, actual);
      failures += ok ? 0 : 1;
      rows.push(
        `${ok ? 'PASS' : 'FAIL'}  tier${testCase.tier}  ${testCase.file.padEnd(32)} ${JSON.stringify(actual)}`,
      );
    } catch (err) {
      failures += 1;
      rows.push(
        `FAIL  tier${testCase.tier}  ${testCase.file.padEnd(32)} THREW: ${(err as Error).message}`,
      );
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(rows.join('\n'));
  console.log(`\n${GOLDEN_DATASET.length - failures}/${GOLDEN_DATASET.length} passed`);
  process.exit(failures > 0 ? 1 : 0);
}

void main();
