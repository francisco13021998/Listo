import { useEffect, useState } from 'react';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../lib/supabase';

async function syncUsernameFromAuth(userId: string, username: string | undefined | null) {
  const trimmedUsername = username?.trim();
  if (!trimmedUsername) {
    return;
  }

  const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
  if (error || data?.username?.trim()) {
    return;
  }

  await supabase.from('profiles').update({ username: trimmedUsername, display_name: trimmedUsername }).eq('id', userId);
}

export function useSession() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileUsername = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
    if (error) {
      return;
    }

    setProfileUsername(data?.username?.trim() ?? null);
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      if (data.session?.user) {
        void loadProfileUsername(data.session.user.id);
        void syncUsernameFromAuth(
          data.session.user.id,
          data.session.user.user_metadata?.username ?? data.session.user.user_metadata?.display_name
        );
      }
      setLoading(false);
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        void loadProfileUsername(newSession.user.id);
        void syncUsernameFromAuth(
          newSession.user.id,
          newSession.user.user_metadata?.username ?? newSession.user.user_metadata?.display_name
        );
      } else {
        setProfileUsername(null);
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, profileUsername, loading } as const;
}
