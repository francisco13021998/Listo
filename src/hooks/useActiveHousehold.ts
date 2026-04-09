import { useActiveHouseholdStore } from '../state/activeHousehold.store';

export function useActiveHousehold() {
  return useActiveHouseholdStore();
}
