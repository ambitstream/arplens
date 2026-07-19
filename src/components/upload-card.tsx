import { useRef, useState } from 'react';
import { Card } from './chrome';

const ACCEPT = '.mp3,.wav,.m4a,audio/*';

/** Section 2 — Upload, with the Sandbox link below (docs/06_UI_SPEC.md). */
export function UploadCard({
  onFile,
  onSandbox,
}: {
  onFile: (file: File) => void;
  onSandbox: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file !== undefined) {
      onFile(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <Card num="01" title="INPUT" hint="AWAITING SIGNAL" width="max-w-[500px]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pick(event.dataTransfer.files);
          }}
          aria-label="Upload audio: drop a file or click to browse"
          className={`relative flex cursor-pointer flex-col items-center gap-[18px] rounded-md border-[1.5px] border-dashed px-6 pb-10 pt-11 text-center transition-colors ${
            dragging
              ? 'border-accent bg-accent/5'
              : 'border-line hover:border-accent/70 hover:bg-accent/5'
          }`}
        >
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-line bg-bg-2 shadow-[inset_0_0_0_6px_color-mix(in_oklab,var(--color-bg-1)_60%,transparent)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3.5v11M12 3.5 7 8.5M12 3.5l5 5"
                stroke="#f5972a"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 17v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V17"
                stroke="#a99f90"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold tracking-[-0.01em]">
              Drop an audio file here
            </div>
            <div className="mt-1 text-[13px] text-text-mid">or</div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-[10px] font-mono text-[12.5px] font-semibold tracking-[0.02em] text-bg-0 transition-[filter] hover:brightness-110">
            Click to browse
          </span>
          <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.08em] text-text-lo">
            <b className="font-medium text-text-mid">MP3</b>
            <span className="opacity-40">/</span>
            <b className="font-medium text-text-mid">WAV</b>
            <span className="opacity-40">/</span>
            <b className="font-medium text-text-mid">M4A</b>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            aria-label="Audio file"
            onChange={(event) => pick(event.target.files)}
          />
        </div>
      </Card>

      <button
        type="button"
        onClick={onSandbox}
        className="-mt-2 border-b border-dashed border-text-lo pb-px font-mono text-[12px] tracking-[0.02em] text-text-mid hover:border-accent hover:text-accent"
      >
        Go to Arpeggio Sandbox
      </button>
    </div>
  );
}
