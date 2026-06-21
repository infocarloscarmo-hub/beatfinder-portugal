import FavoritesClient from './FavoritesClient';
export const metadata = { title: 'Favoritos' };

export default function FavoritosPage() {
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Os teus favoritos</h1>
      <p className="mb-6 text-white/50">Eventos que guardaste para não perder.</p>
      <FavoritesClient />
    </div>
  );
}
