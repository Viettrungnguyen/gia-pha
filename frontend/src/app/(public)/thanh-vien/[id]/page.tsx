/**
 * @project NguyenDinhHoaNgai
 * @file src/app/(public)/thanh-vien/[id]/page.tsx
 * @description Public member profile page with privacy-safe data access
 * @version 1.1.0
 * @updated 2026-07-24
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PersonDetail } from '@/components/people/person-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const source = authData.user ? 'people' : 'public_people';
  const { data } = await supabase.from(source).select('display_name').eq('id', id).single();
  return {
    title: data?.display_name || 'Thành viên',
  };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const peopleSource = authData.user ? 'people' : 'public_people';

  const [personRes, familiesRes, childrenRes, allPeopleRes] = await Promise.all([
    supabase.from(peopleSource).select('*').eq('id', id).single(),
    supabase.from('families').select('*'),
    supabase.from('children').select('*').order('sort_order'),
    supabase.from(peopleSource).select('*').order('generation').order('birth_year'),
  ]);

  if (personRes.error || !personRes.data) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/thanh-vien">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>

      <PersonDetail
        person={personRes.data}
        families={familiesRes.data ?? []}
        children={childrenRes.data ?? []}
        allPeople={allPeopleRes.data ?? []}
      />
    </main>
  );
}
