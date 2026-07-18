import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SUPPORTED_RATES, type SupportedRate } from '../config/rates';
import { STYLE_REGISTRY } from '../analysis/registry/style-registry';
import { PITCH_CLASSES, type PitchClass } from '../utils/note-names';

/** A single labelled parameter tile (design: .param). */
export function ParamTile({
  label,
  action,
  wide,
  children,
}: {
  label: string;
  action?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-md border border-line bg-bg-2 px-[14px] py-[13px] ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-[6px] font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
        <span>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  label,
  wide,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex ${wide ? 'h-[22px] w-auto px-[7px]' : 'h-[26px] w-[26px]'} flex-none items-center justify-center rounded-[5px] border border-line bg-bg-1 font-mono text-[13px] text-text-mid hover:border-text-lo hover:text-text-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
    </button>
  );
}

const paramValue = 'font-mono text-[22px] font-medium text-text-hi';

export function BpmEditor({
  bpm,
  canDouble,
  canHalve,
  onScale,
  onStep,
}: {
  bpm: number;
  canDouble: boolean;
  canHalve: boolean;
  onScale: (direction: 'double' | 'half') => void;
  onStep: (delta: number) => void;
}) {
  return (
    <ParamTile
      label="BPM"
      action={
        <div className="flex items-center gap-[6px]">
          <IconButton wide label="Halve BPM" disabled={!canHalve} onClick={() => onScale('half')}>
            ÷2
          </IconButton>
          <IconButton
            wide
            label="Double BPM"
            disabled={!canDouble}
            onClick={() => onScale('double')}
          >
            ×2
          </IconButton>
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <div className={paramValue}>{Math.round(bpm)}</div>
        <div className="flex items-center gap-2">
          <IconButton label="Decrease BPM" onClick={() => onStep(-1)}>
            −
          </IconButton>
          <IconButton label="Increase BPM" onClick={() => onStep(1)}>
            +
          </IconButton>
        </div>
      </div>
    </ParamTile>
  );
}

export function OctavesEditor({
  octaves,
  onChange,
}: {
  octaves: number;
  onChange: (octaves: number) => void;
}) {
  return (
    <ParamTile label="Octaves">
      <div className="flex items-center gap-2">
        <div className={paramValue}>{octaves}</div>
        <div className="flex items-center gap-2">
          <IconButton
            label="Decrease octaves"
            disabled={octaves <= 1}
            onClick={() => onChange(octaves - 1)}
          >
            −
          </IconButton>
          <IconButton
            label="Increase octaves"
            disabled={octaves >= 4}
            onClick={() => onChange(octaves + 1)}
          >
            +
          </IconButton>
        </div>
      </div>
    </ParamTile>
  );
}

function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current !== null && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return ref;
}

const menu =
  'absolute z-20 left-0 top-full mt-1.5 flex flex-col rounded-sm border border-line bg-bg-2 p-1 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5)]';
const menuItem =
  'rounded px-[9px] py-[7px] text-left font-mono text-[12.5px] text-text-hi hover:bg-accent/15 hover:text-accent';

export function StyleEditor({
  styleId,
  onChange,
}: {
  styleId: string | null;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));
  const current = STYLE_REGISTRY.find((s) => s.id === styleId);

  return (
    <ParamTile label="Style">
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          aria-haspopup="menu"
          aria-label="Style"
          onClick={() => setOpen((v) => !v)}
          className={`${styleId === null ? 'text-[14px] font-normal text-text-lo' : `${paramValue} text-accent`} cursor-pointer hover:text-accent`}
        >
          {current?.displayName ?? 'Not detected'}
        </button>
        {open && (
          <div role="menu" className={`${menu} min-w-[108px]`}>
            {STYLE_REGISTRY.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  onChange(style.id);
                  setOpen(false);
                }}
                className={`${menuItem} ${style.id === styleId ? 'text-accent' : ''}`}
              >
                {style.displayName}
              </button>
            ))}
          </div>
        )}
      </div>
    </ParamTile>
  );
}

export function RateEditor({
  rate,
  onChange,
}: {
  rate: SupportedRate | null;
  onChange: (rate: SupportedRate) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));

  return (
    <ParamTile label="Rate">
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          aria-haspopup="menu"
          aria-label="Rate"
          onClick={() => setOpen((v) => !v)}
          className={`${rate === null ? 'text-[14px] font-normal text-text-lo' : `${paramValue} text-accent`} cursor-pointer hover:text-accent`}
        >
          {rate ?? 'Not detected'}
        </button>
        {open && (
          <div role="menu" className={`${menu} min-w-[108px]`}>
            {SUPPORTED_RATES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}
                className={`${menuItem} ${value === rate ? 'text-accent' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>
    </ParamTile>
  );
}

export function NotesEditor({
  notes,
  onChange,
}: {
  notes: readonly PitchClass[];
  onChange: (notes: readonly PitchClass[]) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useDismiss(() => setOpenIndex(null));

  const setNote = (index: number, value: PitchClass) => {
    onChange(notes.map((n, i) => (i === index ? value : n)));
    setOpenIndex(null);
  };
  const remove = (index: number) => {
    onChange(notes.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  return (
    <ParamTile label="Input Notes" wide>
      <div ref={ref} className="flex flex-wrap items-center gap-1.5">
        {notes.map((note, index) => (
          <div key={index} className="relative">
            <button
              type="button"
              aria-label={`Input note ${index + 1}: ${note}`}
              onClick={() => setOpenIndex((v) => (v === index ? null : index))}
              className="rounded-sm border border-accent/35 bg-accent/15 px-[11px] py-[5px] font-mono text-[14px] font-medium text-accent hover:brightness-115"
            >
              {note}
            </button>
            {openIndex === index && (
              <div className="absolute left-0 top-full z-20 mt-1.5 w-[168px] rounded-sm border border-line bg-bg-2 p-1.5 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-4 gap-1">
                  {PITCH_CLASSES.map((pc) => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => setNote(index, pc)}
                      className="rounded border border-line bg-bg-1 py-1.5 font-mono text-xs text-text-hi hover:border-accent hover:text-accent"
                    >
                      {pc}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-1.5 w-full border-t border-line py-[7px] text-center font-mono text-[11.5px] text-sem-red hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          aria-label="Add note"
          onClick={() => onChange([...notes, 'C'])}
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-dashed border-line bg-bg-1 text-[15px] text-text-mid hover:border-accent/50 hover:text-accent"
        >
          +
        </button>
      </div>
    </ParamTile>
  );
}

export function SequenceView({ sequence }: { sequence: readonly string[] }) {
  return (
    <ParamTile label="Detected Sequence" wide>
      <div className="flex flex-wrap gap-1.5">
        {sequence.map((note, index) => (
          <span
            key={index}
            className="rounded-sm border border-line bg-bg-1 px-2.5 py-[6px] font-mono text-[13px] font-medium text-text-hi"
          >
            {index === 0 ? <b className="font-semibold text-accent">{note}</b> : note}
          </span>
        ))}
      </div>
    </ParamTile>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const color =
    confidence === 'high'
      ? 'var(--color-sem-green)'
      : confidence === 'medium'
        ? 'var(--color-sem-yellow)'
        : 'var(--color-sem-red)';
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border px-3 py-[7px] text-[12px] font-medium"
      style={{
        borderColor: `color-mix(in oklab, ${color} 45%, var(--color-line))`,
        color,
        background: `color-mix(in oklab, ${color} 8%, transparent)`,
      }}
    >
      <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />
      <span className="font-mono capitalize tracking-[0.02em]">{confidence} confidence</span>
    </span>
  );
}
