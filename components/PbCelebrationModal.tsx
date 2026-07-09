'use client';
import { useRouter } from 'next/navigation';

interface Props {
  reasons: string[];
  onClose: () => void;
}

/** Congrats popup shown after logging an activity that's a new PB — either
 *  manually marked, or auto-detected (fastest at a distance, longest
 *  session, best pace for the type, etc). */
export default function PbCelebrationModal({ reasons, onClose }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-sm bg-[#1E293B] border border-yellow-500/40 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>New Personal Best!</h2>
        {reasons.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-sm text-yellow-300 font-medium">⭐ {r}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-primary flex-1">YAY! 🎊</button>
          <button onClick={() => { onClose(); router.push('/pbs'); }} className="btn-secondary flex-1">View PBs</button>
        </div>
      </div>
    </div>
  );
}
