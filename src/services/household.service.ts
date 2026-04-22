import { supabase } from '../lib/supabase';
import { Household } from '../domain/household';

export type HouseholdInvitation = {
  code: string;
  expiresAt: string;
  householdId: string;
};

function isMissingInvitationRpcError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('create_household_invitation') ||
    message.includes('join_household_by_code') ||
    message.includes('Could not find the function public.create_household_invitation') ||
    message.includes('Could not find the function public.join_household_by_code')
  );
}

export async function getMyHouseholds(): Promise<Household[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, households:households(id, name, created_at, created_by)')
    .eq('user_id', userId);

  if (error) throw error;

  return (
    data?.map((row) => ({
      id: row.households?.id ?? row.household_id,
      name: row.households?.name ?? 'Hogar',
      createdAt: row.households?.created_at ?? undefined,
      createdBy: row.households?.created_by ?? undefined,
      memberCount: undefined,
    })) ?? []
  );
}

export async function renameHousehold(householdId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('rename_household', {
    p_household_id: householdId,
    p_name: name,
  });

  if (error) throw error;
}

export async function getHouseholdMembers(householdId: string): Promise<Array<{ user_id: string; username: string; role: string; created_at: string }>> {
  const { data: membersData, error: membersError } = await supabase
    .from('household_members')
    .select('user_id, role, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (membersError) throw membersError;

  const memberIds = (membersData ?? []).map((member) => member.user_id);
  if (memberIds.length === 0) {
    return [];
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', memberIds);

  if (profilesError) throw profilesError;

  const usernameById = new Map(
    (profilesData ?? []).map((profile) => [profile.id, profile.username?.trim() || 'Miembro'])
  );

  return (membersData ?? []).map((member) => ({
    user_id: member.user_id,
    username: usernameById.get(member.user_id) ?? 'Miembro',
    role: member.role,
    created_at: member.created_at,
  }));
}

export async function createHousehold(name: string, initStores?: string[]): Promise<string> {
  const { data, error } = await supabase.rpc('create_household', {
    p_name: name,
    init_stores: initStores ?? null,
  });
  if (error) throw error;
  const householdId = Array.isArray(data) ? data[0] : data;
  if (!householdId) throw new Error('No se pudo crear el hogar');
  return householdId as string;
}

export async function joinHousehold(householdId: string): Promise<void> {
  const { error } = await supabase.rpc('join_household', {
    p_household_id: householdId,
  });
  if (error) throw error;
}

export async function createHouseholdInvitation(householdId: string): Promise<HouseholdInvitation> {
  const { data, error } = await supabase.rpc('create_household_invitation', {
    p_household_id: householdId,
  });

  if (error) {
    if (isMissingInvitationRpcError(error)) {
      throw new Error('Falta aplicar la migración de invitaciones en Supabase. Ejecuta supabase/schema_v1.sql.');
    }

    throw error;
  }

  const invitation = Array.isArray(data) ? data[0] : data;
  if (!invitation?.code || !invitation?.expires_at || !invitation?.household_id) {
    throw new Error('No se pudo crear el código de invitación');
  }

  return {
    code: invitation.code as string,
    expiresAt: invitation.expires_at as string,
    householdId: invitation.household_id as string,
  };
}

export async function joinHouseholdByCode(code: string): Promise<string> {
  const normalizedCode = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc('join_household_by_code', {
    p_code: normalizedCode,
  });

  if (error) {
    if (isMissingInvitationRpcError(error)) {
      throw new Error('Falta aplicar la migración de invitaciones en Supabase. Ejecuta supabase/schema_v1.sql.');
    }

    throw error;
  }

  const householdId = Array.isArray(data) ? data[0] : data;
  if (!householdId) {
    throw new Error('No se pudo unir al hogar');
  }

  return householdId as string;
}

export async function getHouseholdMemberCount(householdId: string): Promise<number> {
  const { count, error } = await supabase
    .from('household_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('household_id', householdId);

  if (error) throw error;
  return count ?? 0;
}

export async function leaveHouseholdOrDelete(householdId: string): Promise<'left' | 'deleted'> {
  const { data, error } = await supabase.rpc('leave_household_or_delete', {
    p_household_id: householdId,
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  if (result !== 'left' && result !== 'deleted') {
    throw new Error('No se pudo abandonar el hogar');
  }

  return result as 'left' | 'deleted';
}
