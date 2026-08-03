import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { redirect } from 'next/navigation';
import { createClient, IS_LOCAL_MODE } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (IS_LOCAL_MODE) {
      return (
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      );
    }
    redirect('/dang-nhap?next=/admin');
  }

  if (!IS_LOCAL_MODE) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      redirect('/');
    }
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}