import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  activateNomineeAccess,
  claimNomineeAccess,
  getNomineeStatus,
  listNomineeClaims,
  registerNominee,
  revokeNominee,
  type NomineeCondition,
  type NomineeStatusPayload
} from './nominee.service';

export const NOMINEE_STATUS_KEY = ['nominee', 'status'] as const;
export const NOMINEE_CLAIMS_KEY = ['nominee', 'claims'] as const;

const nomineeQueryDefaults = {
  refetchOnMount: 'always' as const,
  staleTime: 0
};

export function useNomineeStatus() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: NOMINEE_STATUS_KEY,
    queryFn: () => getNomineeStatus(token),
    enabled: Boolean(token),
    select: (response) => response.data,
    ...nomineeQueryDefaults
  });
}

export function useNomineeClaims(enabled = true) {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: NOMINEE_CLAIMS_KEY,
    queryFn: () => listNomineeClaims(token),
    enabled: Boolean(token) && enabled,
    select: (response) => response.data ?? [],
    ...nomineeQueryDefaults
  });
}

function invalidateNomineeQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: NOMINEE_STATUS_KEY }),
    queryClient.invalidateQueries({ queryKey: NOMINEE_CLAIMS_KEY })
  ]);
}

export function useRegisterNominee() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      relationship: string;
      condition: NomineeCondition;
    }) => registerNominee(token, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData<NomineeStatusPayload>(NOMINEE_STATUS_KEY, (current) => ({
        nominee: response.data,
        nominatedBy: current?.nominatedBy ?? []
      }));
      await invalidateNomineeQueries(queryClient);
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not save nominee');
    }
  });
}

export function useRevokeNominee() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeNominee(token),
    onSuccess: async (response) => {
      queryClient.setQueryData<NomineeStatusPayload>(NOMINEE_STATUS_KEY, (current) => ({
        nominee: response.data,
        nominatedBy: current?.nominatedBy ?? []
      }));
      await invalidateNomineeQueries(queryClient);
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not revoke nominee');
    }
  });
}

export function useClaimNomineeAccess() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      ownerEmail: string;
      proofType: string;
      proofNotes: string;
      proofDocument: File | null;
    }) => claimNomineeAccess(token, payload),
    onSuccess: async (response) => {
      await invalidateNomineeQueries(queryClient);
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not submit claim');
    }
  });
}

export function useActivateNomineeAccess() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { ownerEmail?: string; ownerId?: string; verificationNotes: string }) =>
      activateNomineeAccess(token, payload),
    onSuccess: async (response) => {
      await invalidateNomineeQueries(queryClient);
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not activate nominee access');
    }
  });
}
