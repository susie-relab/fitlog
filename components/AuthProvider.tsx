'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { rememberSession, forgetAccount } from '@/lib/accountSwitcher';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  /** Forgets a saved account entirely (e.g. "remove from this device"). Signs out
   *  first if it's the currently active account. */
  removeSavedAccount: (userId: string) => Promise<void>;
  /** Switches the active session to a previously-saved account's tokens. */
  switchToAccount: (accessToken: string, refreshToken: string) => Promise<{ error?: string }>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null,
  signOut: async () => {}, removeSavedAccount: async () => {}, switchToAccount: async () => ({}),
});

export function useAuth() {
  return useContext(Ctx);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session) rememberSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Keep every account you've logged into on this device switchable —
      // upserted on every token refresh too, so the saved copy never goes stale.
      if (s) rememberSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && path !== '/login') {
      router.push('/login');
    }
  }, [loading, user, path, router]);

  const signOut = async () => {
    if (user) forgetAccount(user.id);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const removeSavedAccount = async (userId: string) => {
    forgetAccount(userId);
    if (user?.id === userId) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const switchToAccount = async (accessToken: string, refreshToken: string) => {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) return { error: error.message };
    router.push('/dash');
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-[#64748B] text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ user, session, signOut, removeSavedAccount, switchToAccount }}>
      {children}
    </Ctx.Provider>
  );
}
