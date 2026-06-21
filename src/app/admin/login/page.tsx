import { Suspense } from 'react';
import LoginForm from './LoginForm';
import Logo from '@/components/layout/Logo';

export const metadata = { title: 'Admin · Login' };
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="mb-1 text-center font-display text-xl font-bold text-white">Painel de administração</h1>
        <p className="mb-6 text-center text-sm text-white/50">Acesso restrito à equipa.</p>
        <Suspense fallback={<p className="text-center text-sm text-white/40">A carregar…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
