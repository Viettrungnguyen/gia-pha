/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/supabase-data-events.ts
 * @description Events data layer
 * @version 1.0.0
 * @updated 2026-07-23
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Event } from '@/types';

export async function getEvents(): Promise<Event[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function getEventsByMonth(year: number, month: number): Promise<Event[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date');

  if (error) throw error;
  return data ?? [];
}

export async function getRecurringEvents(): Promise<Event[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('recurring', true)
    .order('event_lunar');

  if (error) throw error;
  return data ?? [];
}

export type CreateEventInput = Omit<Event, 'id' | 'created_at'>;
export type UpdateEventInput = Partial<CreateEventInput>;

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('events').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('events')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}