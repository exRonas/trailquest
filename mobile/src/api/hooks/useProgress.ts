import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeRoute,
  deleteProgress,
  fetchMyLevel,
  fetchMyLevels,
  fetchMyProgress,
  setProgressVisibility,
  startRoute,
} from '../progress.api';
import { queryKeys } from '../queryClient';

export function useMyProgress() {
  return useQuery({
    queryKey: queryKeys.myProgress(),
    queryFn: fetchMyProgress,
  });
}

export function useMyLevels() {
  return useQuery({
    queryKey: queryKeys.myLevels(),
    queryFn: fetchMyLevels,
  });
}

export function useMyLevel() {
  return useQuery({
    queryKey: queryKeys.myLevel(),
    queryFn: fetchMyLevel,
  });
}

export function useStartRoute() {
  return useMutation({
    mutationFn: (routeId: string) => startRoute(routeId),
  });
}

export function useCompleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { progressId: string }) =>
      completeRoute(vars.progressId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProgress() });
    },
  });
}

export function useSetProgressVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { progressId: string; hidden: boolean }) =>
      setProgressVisibility(vars.progressId, vars.hidden),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProgress() });
    },
  });
}

export function useDeleteProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { progressId: string }) =>
      deleteProgress(vars.progressId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProgress() });
    },
  });
}
