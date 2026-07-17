import { AnalysisDebug } from '../components/analysis-debug';
import { AudioDebug } from '../components/audio-debug';
import { RegistryDebug } from '../components/registry-debug';

export function App() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 px-6 py-16 text-center text-neutral-100">
      <header className="flex flex-col items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">ArpLens</h1>
        <p className="text-lg text-neutral-300">Recreate standard arpeggios from audio.</p>
        <p className="max-w-sm text-sm text-neutral-400">
          Get ready-to-use arpeggiator settings for your favorite synth, plugin or DAW.
        </p>
      </header>

      <RegistryDebug />
      <AnalysisDebug />
      <AudioDebug />
    </main>
  );
}
