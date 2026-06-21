import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, Clock, CheckSquare, LogOut } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import { signOut } from './actions';

export const metadata = { title: 'Admin' };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // A página de login tem o seu próprio render; só protegemos o resto.
  // (O middleware já redireciona, isto é defesa em profundidade.)
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile && !['admin', 'moderator'].includes(profile.role)) {
      redirect('/');
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-dvh md:mx-0">
      <div className="flex flex-col gap-6 md:flex-row">
        {user && (
          <aside className="border-b border-white/5 px-4 py-4 md:w-56 md:border-b-0 md:border-r md:py-6">
            <div className="mb-6"><Logo /></div>
            <nav className="flex gap-1 md:flex-col">
              <Link href="/admin" className="btn-ghost justify-start"><LayoutDashboard size={16} /> Dashboard</Link>
              <Link href="/admin?tab=pending" className="btn-ghost justify-start"><Clock size={16} /> Pendentes</Link>
              <Link href="/admin?tab=approved" className="btn-ghost justify-start"><CheckSquare size={16} /> Aprovados</Link>
            </nav>
            <form action={signOut} className="mt-6">
              <button className="btn-ghost w-full justify-start text-red-300"><LogOut size={16} /> Sair</button>
            </form>
          </aside>
        )}
        <div className="flex-1 px-4 py-2 md:py-6">{children}</div>
      </div>
    </div>
  );
}
