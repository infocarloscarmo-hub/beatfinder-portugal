'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { EventPublicRow } from '@/types/database.types';
import { formatEventDate } from '@/lib/dates';

// Ícone neon custom (evita ícones partidos do Leaflet com bundlers)
const neonIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:9999px;
    background:#8b5cf6;border:2px solid #fff;
    box-shadow:0 0 12px 2px rgba(139,92,246,0.8);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
  }, [points, map]);
  return null;
}

export default function EventMap({ events }: { events: EventPublicRow[] }) {
  const located = events.filter(
    (e) => e.latitude != null && e.longitude != null
  );
  const points = located.map((e) => [e.latitude!, e.longitude!] as [number, number]);

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
        {located.map((e) => (
          <Marker key={e.id} position={[e.latitude!, e.longitude!]} icon={neonIcon}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="text-xs text-neon-cyan">{formatEventDate(e.date_start)}</p>
                <p className="font-bold">{e.title}</p>
                <p className="text-xs opacity-70">{[e.venue_name, e.city].filter(Boolean).join(' · ')}</p>
                <Link href={`/eventos/${e.slug}`} className="mt-1 inline-block text-xs font-semibold text-neon-purple">
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
