/**
 * @project NguyenDinhHoaNgai
 * @file src/hooks/use-events.ts
 * @description Events React Query hooks
 * @version 1.1.0
 * @updated 2026-07-24
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvents,
  getEventsByMonth,
  getRecurringEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CreateEventInput,
  type UpdateEventInput,
} from '@/lib/supabase-data-events';
import type { Event } from '@/types';

export function useEvents() {
  return useQuery<Event[]>({ queryKey: ['events'], queryFn: getEvents });
}

export function useEventsByMonth(year: number, month: number) {
  return useQuery<Event[]>({
    queryKey: ['events', year, month],
    queryFn: () => getEventsByMonth(year, month),
  });
}

export function useRecurringEvents() {
  return useQuery<Event[]>({ queryKey: ['events-recurring'], queryFn: getRecurringEvents });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events-recurring'] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      updateEvent(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events-recurring'] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events-recurring'] });
    },
  });
}