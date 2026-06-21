import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

/**
 * Renova a sessão Supabase e protege /admin/*.
 * À prova de falhas: se algo correr mal (env vars em falta, limitações do
 * Edge runtime, etc.), deixa o pedido passar em vez de deitar o site abaixo.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // sem credenciais → não bloquear o site

  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isAdminArea = path.startsWith('/admin') && path !== '/admin/login';

    if (isAdminArea && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (err) {
    // Não interromper o site se a verificação de sessão falhar.
    console.error('middleware updateSession falhou:', (err as Error)?.message);
    return response;
  }
}
