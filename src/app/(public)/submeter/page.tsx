import { getGenres } from '@/lib/queries';
import SubmitForm from './SubmitForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Submeter evento' };

export default async function SubmeterPage() {
  const genres = await getGenres();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Submeter evento</h1>
      <p className="mb-6 text-white/50">
        Conheces uma festa que falta? Envia — depois de revista pela equipa,
        fica visível para todos.
      </p>
      <SubmitForm genres={genres} />
    </div>
  );
}
