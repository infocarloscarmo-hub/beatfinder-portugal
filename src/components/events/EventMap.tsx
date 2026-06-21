'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EventPublicRow } from '@/types/database.types';
import { formatEventDate } from '@/lib/dates';
import { coordsForCity } from '@/lib/geo';

// Ícone custom (turquesa da marca) — evita ícones partidos do Leaflet
const neonIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:9999px;
    background:#2dd4bf;border:2px solid #fff;
    box-shadow:0 0 12px 2px rgba(45,212,191,0.85);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type Located = { ev: EventPublicRow; pos: [number, number] };

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
  }, [points, map]);
  return null;
}

export default function EventMap({ events }: { events: EventPublicRow[] }) {
  // Usa coordenadas próprias; se não houver, posiciona pela cidade.
  const located: Located[] = events
    .map((ev) => {
      let pos: [number, number] | null =
        ev.latitude != null && ev.longitude != null
          ? [ev.latitude, ev.longitude]
          : coordsForCity(ev.city);
      return pos ? { ev, pos } : null;
    })
    .filter((x): x is Located => x !== null);

  const points = located.map((l) => l.pos);

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer
        center={[39.5, -8.0]}
        zoom={7}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {located.map(({ ev, pos }) => (
          <Marker key={ev.id} position={pos} icon={neonIcon}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-xs text-neon-cyan">{formatEventDate(ev.date_start)}</p>
                <p className="font-bold">{ev.title}</p>
                <p className="text-xs opacity-70">{[ev.venue_name, ev.city].filter(Boolean).join(' · ')}</p>
                <Link href={`/eventos/${ev.slug}`} className="mt-1 inline-block text-xs font-semibold text-neon-purple">
                  Ver detalhe →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
