export const SITE = {
  name: 'Beatfinder Portugal',
  shortName: 'Beatfinder',
  description:
    'Radar automático de festas e festivais de música eletrónica em Portugal.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

// Cidades principais para filtros rápidos
export const CITIES = [
  'Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro',
  'Setúbal', 'Funchal', 'Cascais', 'Guimarães',
];

export const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'club', label: 'Club' },
  { value: 'festival', label: 'Festival' },
  { value: 'open_air', label: 'Open Air' },
  { value: 'rave', label: 'Rave' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'boat', label: 'Boat Party' },
  { value: 'other', label: 'Outro' },
];

export const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/hoje', label: 'Hoje' },
  { href: '/fim-de-semana', label: 'Fim de semana' },
  { href: '/festivais', label: 'Festivais' },
  { href: '/mapa', label: 'Mapa' },
];
