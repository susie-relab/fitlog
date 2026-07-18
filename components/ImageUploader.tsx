'use client';
import { useRef, useState } from 'react';
import { uploadImages, deleteImage } from '@/lib/images';

interface Props {
  userId: string;
  value: string[];
  thumbValue?: string[]; // parallel to value (same order); falls back to the full-size url per-slot when missing
  onChange: (urls: string[], thumbUrls: string[]) => void;
  label?: string;
}

/** Add/remove multiple photos. Compresses + uploads on pick, returns both full-size and
 *  thumbnail public URLs via onChange. */
export default function ImageUploader({ userId, value, thumbValue, onChange, label = 'Photos (optional)' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const { urls, thumbUrls } = await uploadImages(userId, files);
      // Pad any pre-existing slot that never got a thumbnail (photos added before this
      // feature shipped) with its own full-size url, so the two arrays stay index-aligned.
      const paddedThumbs = value.map((u, i) => thumbValue?.[i] ?? u);
      onChange([...value, ...urls], [...paddedThumbs, ...thumbUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => {
    const idx = value.indexOf(url);
    onChange(value.filter(u => u !== url), (thumbValue ?? value).filter((_, i) => i !== idx));
    deleteImage(url); // best-effort; don't block UI
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#334155]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbValue?.[i] ?? url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-20 h-20 rounded-lg border border-dashed border-[#334155] text-[#64748B] text-xs hover:border-[#475569] flex flex-col items-center justify-center gap-1 disabled:opacity-50"
        >
          {busy ? '…' : <><span className="text-lg leading-none">＋</span><span>Add</span></>}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePick}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
