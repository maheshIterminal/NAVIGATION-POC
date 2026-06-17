import type { MockDriver, OrderTemplate } from './types.js';

export const MOCK_DRIVERS: MockDriver[] = [
  { id: 'drv-001', email: 'driver@kotuwa.com', password: 'driver123', name: 'Kasun Perera' },
  { id: 'drv-002', email: 'driver2@kotuwa.com', password: 'driver123', name: 'Nimal Silva' },
];

/** Darwin CBD and inner suburbs — typical AUD driver payouts. */
export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    id: 'tpl-nandos-cbd',
    label: "Nando's Darwin CBD → Cullen Bay (1.4 km)",
    merchantName: "Nando's Darwin CBD",
    pickup: {
      lat: -12.4615,
      lng: 130.844,
      address: "Nando's, 48 Smith St, Darwin City NT 0800",
    },
    dropoff: {
      lat: -12.4485,
      lng: 130.8335,
      address: '26 Myilly Point Rd, Cullen Bay NT 0820',
    },
    earnings: 8.6,
  },
  {
    id: 'tpl-woolworths-cbd',
    label: 'Woolworths Darwin City → Stuart Park (1.2 km)',
    merchantName: 'Woolworths Darwin City',
    pickup: {
      lat: -12.4608,
      lng: 130.8425,
      address: 'Woolworths, 25 Cavenagh St, Darwin City NT 0800',
    },
    dropoff: {
      lat: -12.451,
      lng: 130.837,
      address: '18 Stuart Park Rd, Stuart Park NT 0820',
    },
    earnings: 8.2,
  },
  {
    id: 'tpl-maccas-casuarina',
    label: "McDonald's Casuarina → Nightcliff (3.4 km)",
    merchantName: "McDonald's Casuarina",
    pickup: {
      lat: -12.3745,
      lng: 130.881,
      address: "McDonald's, 247 Trower Rd, Casuarina NT 0810",
    },
    dropoff: {
      lat: -12.384,
      lng: 130.852,
      address: '88 Progress Dr, Nightcliff NT 0810',
    },
    earnings: 12.4,
  },
  {
    id: 'tpl-sushi-parap',
    label: 'Sushi Hub Darwin → Parap (1.8 km)',
    merchantName: 'Sushi Hub Darwin',
    pickup: {
      lat: -12.462,
      lng: 130.8435,
      address: 'Sushi Hub, 31 Knuckey St, Darwin City NT 0800',
    },
    dropoff: {
      lat: -12.432,
      lng: 130.8435,
      address: '12 Parap Rd, Parap NT 0820',
    },
    earnings: 9.75,
  },
  {
    id: 'tpl-grilld-waterfront',
    label: "Grill'd Darwin Waterfront → Fannie Bay (2.1 km)",
    merchantName: "Grill'd Darwin Waterfront",
    pickup: {
      lat: -12.441,
      lng: 130.832,
      address: "Grill'd, Kitchener Dr, Darwin Waterfront NT 0800",
    },
    dropoff: {
      lat: -12.428,
      lng: 130.841,
      address: '8 East Point Rd, Fannie Bay NT 0820',
    },
    earnings: 11.2,
  },
  {
    id: 'tpl-guzman-mitchell',
    label: 'Guzman y Gomez Mitchell St → The Gardens (1.5 km)',
    merchantName: 'Guzman y Gomez Mitchell St',
    pickup: {
      lat: -12.4595,
      lng: 130.8418,
      address: 'Guzman y Gomez, 80 Mitchell St, Darwin City NT 0800',
    },
    dropoff: {
      lat: -12.4475,
      lng: 130.8295,
      address: '5 Gardens Hill Cres, The Gardens NT 0820',
    },
    earnings: 9.4,
  },
];

export const OFFER_TTL_MS = 30_000;
