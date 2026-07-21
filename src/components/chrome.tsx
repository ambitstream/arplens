import type { ReactNode } from 'react';

/** Persistent top status bar (design: .bar). */
export function TopBar({ onUpload }: { onUpload?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line bg-bg-2 px-[18px] py-[10px]">
      <div className="flex items-center gap-[9px]">
        <ArpMark className="h-[22px] w-[22px]" />
        <span className="font-mono text-[12px] font-semibold tracking-[0.08em]">ARPLENS</span>
      </div>
      <div className="flex items-center gap-4">
        {onUpload !== undefined && (
          <button
            type="button"
            onClick={onUpload}
            className="font-mono text-[11px] tracking-[0.05em] text-text-mid hover:text-accent"
          >
            ↑ Upload File
          </button>
        )}
        <div className="flex items-center gap-[7px] font-mono text-[11px] tracking-[0.05em] text-text-lo">
          <span className="h-[7px] w-[7px] rounded-full bg-sem-green shadow-[0_0_8px_-1px_var(--color-sem-green)]" />
          READY
        </div>
      </div>
    </div>
  );
}

/** Hero header with logo + headline + subtitle; copy varies by mode. */
export function Hero({ headline, subtitle }: { headline: string; subtitle: string }) {
  return (
    <div className="flex max-w-[30rem] flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-[10px]">
        <ArpMark className="h-12 w-12" />
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em]">
          Arp<b className="font-semibold text-accent">Lens</b>
        </h1>
      </div>
      <p className="text-base text-text-hi">{headline}</p>
      <p className="text-[0.8125rem] text-text-mid">{subtitle}</p>
    </div>
  );
}

export function Footer() {
  return (
    <div className="flex w-full items-center justify-center border-t border-line bg-bg-2 px-[18px] py-4 font-mono text-[11px] tracking-[0.03em] text-text-lo">
      © 2026 ArpLens. Open source on&nbsp;
      <a
        href="https://github.com/ambitstream/arplens"
        target="_blank"
        rel="noopener"
        className="text-text-mid no-underline hover:text-accent"
      >
        GitHub
      </a>
      .
    </div>
  );
}

/** Rack-unit card shell with a numbered header strip (design: .card). */
export function Card({
  num,
  title,
  hint,
  width = 'max-w-[640px]',
  children,
}: {
  num: string;
  title: string;
  hint?: ReactNode;
  width?: string;
  children: ReactNode;
}) {
  return (
    <section className={`w-full ${width} overflow-visible rounded-lg border border-line bg-bg-1`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-[11px]">
        <div className="flex items-center gap-[9px]">
          <span className="rounded-[3px] bg-accent px-[6px] py-[2px] font-mono text-[10px] font-semibold tracking-[0.14em] text-bg-0">
            {num}
          </span>
          <span className="font-mono text-[12px] font-semibold tracking-[0.08em] text-text-hi">
            {title}
          </span>
        </div>
        {hint !== undefined && (
          <span className="font-mono text-[10px] tracking-[0.06em] text-text-lo">{hint}</span>
        )}
      </div>
      <div className="p-[18px]">{children}</div>
    </section>
  );
}

/** The lens-and-waveform brand mark (design/assets/logo.svg, simplified). */
export function ArpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g fill="#6c6252">
        <rect x="38" y="212" width="12" height="24" rx="6" />
        <rect x="60" y="196" width="12" height="56" rx="6" />
        <rect x="82" y="176" width="12" height="96" rx="6" />
        <rect x="104" y="190" width="12" height="68" rx="6" />
        <rect x="126" y="206" width="12" height="36" rx="6" />
        <rect x="374" y="206" width="12" height="36" rx="6" />
        <rect x="396" y="190" width="12" height="68" rx="6" />
        <rect x="418" y="176" width="12" height="96" rx="6" />
        <rect x="440" y="196" width="12" height="56" rx="6" />
        <rect x="462" y="212" width="12" height="24" rx="6" />
      </g>
      <defs>
        <clipPath id="arp-lens">
          <circle cx="236" cy="224" r="126" />
        </clipPath>
      </defs>
      <circle cx="236" cy="224" r="126" fill="#15120d" />
      <g clipPath="url(#arp-lens)" fill="#f5972a">
        <rect x="306" y="150" width="34" height="26" rx="5" />
        <rect x="262" y="190" width="34" height="26" rx="5" />
        <rect x="218" y="230" width="34" height="26" rx="5" />
        <rect x="174" y="270" width="34" height="26" rx="5" />
      </g>
      <circle cx="236" cy="224" r="126" fill="none" stroke="#f6f2ec" strokeWidth="16" />
      <line
        x1="328"
        y1="316"
        x2="426"
        y2="414"
        stroke="#f6f2ec"
        strokeWidth="32"
        strokeLinecap="round"
      />
    </svg>
  );
}
