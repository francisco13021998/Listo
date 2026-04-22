import { useCallback, useEffect, useState } from 'react';
import { Household } from '../domain/household';
import {
  createHousehold,
  createHouseholdInvitation,
  getHouseholdMembers,
  getHouseholdMemberCount,
  getMyHouseholds,
  leaveHouseholdOrDelete,
  joinHousehold,
  joinHouseholdByCode,
  renameHousehold,
} from '../services/household.service';
import { useSession } from './useSession';

export function useHouseholds() {
  const { user } = useSession();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setHasLoaded(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMyHouseholds();
      setHouseholds(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [user]);

  const create = useCallback(
    async (name: string, initStores?: string[]) => {
      const id = await createHousehold(name, initStores);
      await refresh();
      return id;
    },
    [refresh]
  );

  const join = useCallback(
    async (householdId: string) => {
      await joinHousehold(householdId);
      await refresh();
    },
    [refresh]
  );

  const createInvitation = useCallback(
    async (householdId: string) => {
      const invitation = await createHouseholdInvitation(householdId);
      await refresh();
      return invitation;
    },
    [refresh]
  );

  const joinByCode = useCallback(
    async (code: string) => {
      const householdId = await joinHouseholdByCode(code);
      await refresh();
      return householdId;
    },
    [refresh]
  );

  const leave = useCallback(
    async (householdId: string) => {
      const result = await leaveHouseholdOrDelete(householdId);
      await refresh();
      return result;
    },
    [refresh]
  );

  const rename = useCallback(
    async (householdId: string, name: string) => {
      await renameHousehold(householdId, name);
      await refresh();
    },
    [refresh]
  );

  const members = useCallback(async (householdId: string) => {
    return getHouseholdMembers(householdId);
  }, []);

  const getMemberCount = useCallback(async (householdId: string) => {
    return getHouseholdMemberCount(householdId);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    households,
    loading,
    error,
    hasLoaded,
    refresh,
    createHousehold: create,
    joinHousehold: join,
    createInvitation,
    joinHouseholdByCode: joinByCode,
    leaveHousehold: leave,
    renameHousehold: rename,
    getHouseholdMembers: members,
    getHouseholdMemberCount: getMemberCount,
  } as const;
}
