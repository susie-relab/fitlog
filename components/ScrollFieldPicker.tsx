'use client';
import { useState } from 'react';
import NumberWheelColumn from './NumberWheelColumn';

interface Props {
  label: string;
  unit?: string;
  value: string; // stored string, e.g. '' | '150' | '12.34'
  onChange: (v: string) => void;
  max: number;
  decimals?: 0 | 2; // 0 = integer (HR, Elevation), 2 = whole + hundredths (Distance)
  suggestion?: number; // seeds the wheel(s) when the field is currently empty
  placeholder?: string;
}

function range(min: number, max: number): number[] {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

/** A pop-out scroll-to-click number picker — replaces a plain number input for
 *  Distance / Elevation / Heart Rate fields. Scrolling or tapping a row both work;
 *  the popup stays open until Done or a backdrop click so multi-column values
 *  (whole + hundredths) can be adjusted without closing early. */
export default function ScrollFieldPicker({ label, unit, value, onChange, max, decimals = 0, suggestion, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [whole, setWhole] = useState(0);
  const [frac, setFrac] = useState(0);

  const openPicker = () => {
    const parsed = value ? parseFloat(value) : (suggestion ?? 0);
    setWhole(Math.floor(parsed));
    setFrac(Math.round((parsed - Math.floor(parsed)) * 100));
    setOpen(true);
  };

  const commitAndClose = () => {
    const final = decimals === 2 ? whole + frac / 100 : whole;
    onChange(final > 0 || value ? String(decimals === 2 ? Math.round(final * 100) / 100 : final) : '');
    setOpen(false);
  };

  const wholeValues = range(0, max);
  const fracValues = range(0, 99);

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="input text-left flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-[#475569]'}>
          {value ? `${value}${unit ? ` ${unit}` : ''}` : (placeholder || 'Tap to set')}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={commitAndClose}
        >
          <div
            className="card w-72 max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-white mb-2 text-center">{label}</p>
            <div className="relative">
              <div
                className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 rounded-lg border border-[#334155] bg-[#1E293B]/60"
              />
              <div className="flex items-center justify-center gap-1">
                <NumberWheelColumn values={wholeValues} value={whole} onChange={setWhole} />
                {decimals === 2 && (
                  <>
                    <span className="text-white text-lg pb-1">.</span>
                    <NumberWheelColumn values={fracValues} value={frac} onChange={setFrac} format={v => String(v).padStart(2, '0')} />
                  </>
                )}
                {unit && <span className="text-[#64748B] text-sm ml-1">{unit}</span>}
              </div>
            </div>
            <button onClick={commitAndClose} className="btn-primary w-full mt-3">Done</button>
          </div>
        </div>
      )}
    </>
  );
}
