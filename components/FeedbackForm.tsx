'use client';
import { useState } from 'react';

/** Feature-request / bug / feedback form → emails the developer via /api/contact. */
export default function FeedbackForm({ defaultEmail, defaultName }: { defaultEmail?: string; defaultName?: string }) {
  const [category, setCategory] = useState('Feature request');
  const [name, setName] = useState(defaultName ?? '');
  const [message, setMessage] = useState('');
  const [fromEmail, setFromEmail] = useState(defaultEmail ?? '');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState(false);

  const nameErr = touched && !name.trim() ? 'Please enter your name.' : '';
  const emailErr = touched && !fromEmail.trim() ? 'Please enter your email.' : '';
  const messageErr = touched && !message.trim() ? 'Please enter a description.' : '';

  const submit = async () => {
    setTouched(true);
    if (!name.trim() || !fromEmail.trim() || !message.trim()) return;
    setState('sending'); setErr('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'feedback', category, name, message, fromEmail }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to send');
      setState('sent'); setMessage('');
    } catch (e) {
      setState('error'); setErr(e instanceof Error ? e.message : 'Failed to send');
    }
  };

  if (state === 'sent') {
    return (
      <div className="text-sm text-green-300">
        Thanks! Your message has been sent. 🙌
        <button onClick={() => { setState('idle'); setTouched(false); }} className="block text-xs text-[#64748B] hover:text-white mt-2">Send another</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {['Feature request', 'Bug', 'Other'].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${category === c ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#334155] text-[#94A3B8] hover:border-[#475569]'}`}>
            {c}
          </button>
        ))}
      </div>
      <div>
        <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        {nameErr && <p className="text-xs text-red-400 mt-1">{nameErr}</p>}
      </div>
      <div>
        <input className="input" type="email" placeholder="Your email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
        {emailErr && <p className="text-xs text-red-400 mt-1">{emailErr}</p>}
      </div>
      <div>
        <textarea className="input" rows={4} placeholder="What's your idea, or what went wrong?" value={message} onChange={e => setMessage(e.target.value)} style={{ resize: 'vertical' }} />
        {messageErr && <p className="text-xs text-red-400 mt-1">{messageErr}</p>}
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <button onClick={submit} disabled={state === 'sending'} className="btn-primary w-full">
        {state === 'sending' ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
