import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook para invalidar múltiplas queries relacionadas de uma vez
 * Útil quando uma operação afeta múltiplas entidades
 */
export function useInvalidateRelated() {
  const queryClient = useQueryClient();

  const invalidateCampaignRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
  }, [queryClient]);

  const invalidatePlayerRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['answers'] });
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
  }, [queryClient]);

  const invalidateQuestionRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['answers'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }, [queryClient]);

  const invalidateTeamRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }, [queryClient]);

  const invalidateProductRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateCampaignRelated,
    invalidatePlayerRelated,
    invalidateQuestionRelated,
    invalidateTeamRelated,
    invalidateProductRelated,
    invalidateAll,
  };
}
