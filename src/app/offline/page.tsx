export const metadata = { title: 'Offline · Beatfinder Portugal' };

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-5xl">📡</div>
      <h1 className="mb-2 text-2xl font-bold text-white">Estás offline</h1>
      <p className="max-w-sm text-white/60">
        Não foi possível ligar à rede. Os eventos que já viste continuam
        disponíveis — volta a tentar quando tiveres ligação.
      </p>
    </div>
  );
}
