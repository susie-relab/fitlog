'use client';
import { useAuth } from '@/components/AuthProvider';
import FeedbackForm from '@/components/FeedbackForm';

export default function HelpPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg lg:max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Help</h1>
      <p className="text-sm text-[#64748B] mb-5">Feedback, feature requests, and bug reports</p>

      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-1">Contact the developer</h2>
        <p className="text-xs text-[#64748B] mb-3">Spotted a bug or have an idea? Send it straight across.</p>
        <FeedbackForm defaultEmail={user?.email ?? undefined} defaultName={user?.user_metadata?.username ?? undefined} />
      </div>
    </div>
  );
}
