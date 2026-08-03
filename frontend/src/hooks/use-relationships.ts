/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-relationships.ts
 * @description Relationships hook
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { useQuery } from '@tanstack/react-query';
import { getRelationships } from '@/lib/supabase-data-people';

export function useRelationships(id: string | undefined) {
  return useQuery({
    queryKey: ['relationships', id],
    queryFn: () => getRelationships(id!),
    enabled: !!id,
  });
}
