'use client';
import { useRouter } from 'next/navigation';

interface Props {
  reasons: string[];
  onClose: () => void;
  // Lets the caller cancel any pending auto-navigation (e.g. the Dash-initiated
  // auto-return timeout) before sending the user somewhere else themselves.
  onNavigate?: (path: string) => void;
}

/** Congrats popup shown after logging an activity that's a new PB — either
 *  manually marked, or auto-detected (fastest at a distance, longest
 *  session, best pace for the type, etc). */
export default function PbCelebrationModal({ reasons, onClose, onNavigate }: Props) {
  const router = useRouter();
  const go = (path: string) => (onNavigate ? onNavigate(path) : router.push(path));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#1E293B] border border-yellow-500/40 rounded-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>New Personal Best!</h2>
        {reasons.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-sm text-yellow-300 font-medium">⭐ {r}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 mt-5">
          <button onClick={onClose} className="btn-primary w-full">YAY! 🎊</button>
          <div className="flex gap-2">
            <button onClick={() => { onClose(); go('/pbs'); }} className="btn-secondary flex-1">View PBs</button>
            <button onClick={() => { onClose(); go('/activity-log'); }} className="btn-secondary flex-1">View in Activity Log</button>
          </div>
        </div>
      </div>
    </div>
  );
}
