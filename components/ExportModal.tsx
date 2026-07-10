'use client';
import { useState } from 'react';
import type { Activity } from '@/types';
import { activitiesToCsv, downloadCsv } from '@/lib/exportCsv';

export interface ExportTypeOption {
  key: string;
  label: string;
}

interface Props {
  activities: Activity[];
  filenamePrefix: string; // e.g. "sportlog-runs" or "sportlog-activities"
  typeOptions: ExportTypeOption[];
  matchType: (a: Activity, key: string) => boolean;
  onClose: () => void;
}

export default function ExportModal({ activities, filenamePrefix, typeOptions, matchType, onClose }: Props) {
  const [step, setStep] = useState<'confirm' | 'filter'>('confirm');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(typeOptions.map(t => t.key)));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const doExport = (list: Activity[]) => {
    const csv = activitiesToCsv(list);
    downloadCsv(csv, `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
    onClose();
  };

  const toggleType = (key: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const exportFiltered = () => {
    const filtered = activities.filter(a =>
      typeOptions.some(t => selectedTypes.has(t.key) && matchType(a, t.key)) &&
      (!startDate || a.date >= startDate) &&
      (!endDate || a.date <= endDate)
    );
    doExport(filtered);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-sm bg-[#1E293B] border border-[#334155] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Export</h3>
          <button onClick={onClose} className="text-[#64748B] hover:text-white text-lg leading-none">✕</button>
        </div>

        {step === 'confirm' ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#64748B] mb-1">Export as a CSV file.</p>
            <button onClick={() => doExport(activities)} disabled={activities.length === 0} className="btn-primary w-full disabled:opacity-40">
              Export All ({activities.length})
            </button>
            <button onClick={() => setStep('filter')} disabled={activities.length === 0} className="btn-secondary w-full disabled:opacity-40">
              Export Some…
            </button>
            <button onClick={onClose} className="w-full py-2 text-sm text-[#64748B] hover:text-white">Cancel</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Types to include</p>
              <div className="flex flex-wrap gap-1.5">
                {typeOptions.map(t => (
                  <button
                    key={t.key}
                    onClick={() => toggleType(t.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedTypes.has(t.key) ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-[#334155] text-[#64748B]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Date range (optional)</p>
              <div className="flex items-center gap-2">
                <input type="date" className="input flex-1 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-[#64748B] text-xs">to</span>
                <input type="date" className="input flex-1 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={exportFiltered} disabled={selectedTypes.size === 0} className="btn-primary flex-1 disabled:opacity-40">Export</button>
              <button onClick={() => setStep('confirm')} className="btn-secondary px-4">Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
