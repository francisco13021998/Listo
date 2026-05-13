import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../lib/supabase';

export type ComparisonMode = 'unit_price' | 'total_price';

async function syncUsernameFromAuth(userId: string, username: string | undefined | null) {
  const trimmedUsername = username?.trim();
  if (!trimmedUsername) {
    return;
  }

  const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
  if (error) {
    throw error;
  }

  if (data?.username?.trim()) {
    return;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ username: trimmedUsername, display_name: trimmedUsername })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }
}

export function useSession() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [profileComparisonMode, setProfileComparisonMode] = useState<ComparisonMode>('unit_price');
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, comparison_mode')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      throw error;
    }

    setProfileUsername(data?.username?.trim() ?? null);
    setProfileComparisonMode((data?.comparison_mode as ComparisonMode | null) ?? 'unit_price');
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        if (data.session?.user) {
          void loadProfile(data.session.user.id).catch(() => undefined);
          void syncUsernameFromAuth(
            data.session.user.id,
            data.session.user.user_metadata?.username ?? data.session.user.user_metadata?.display_name
          ).catch(() => undefined);
        }
      } finally {
        setLoading(false);
      }
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        void loadProfile(newSession.user.id).catch(() => undefined);
        void syncUsernameFromAuth(
          newSession.user.id,
          newSession.user.user_metadata?.username ?? newSession.user.user_metadata?.display_name
        ).catch(() => undefined);
      } else {
        setProfileUsername(null);
        setProfileComparisonMode('unit_price');
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('username, comparison_mode')
      .eq('id', session.user.id)
      .maybeSingle();
    if (!error && data) {
      setProfileUsername(data.username?.trim() ?? null);
      setProfileComparisonMode((data.comparison_mode as ComparisonMode | null) ?? 'unit_price');
    }
  }, [session?.user?.id]);

  const updateComparisonMode = useCallback(async (mode: ComparisonMode) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ comparison_mode: mode })
      .eq('id', session.user.id);
    if (error) throw error;
    setProfileComparisonMode(mode);
  }, [session?.user?.id]);

  return { session, user: session?.user ?? null, profileUsername, profileComparisonMode, loading, refreshProfile, updateComparisonMode } as const;
}
