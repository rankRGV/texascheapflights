type Route = { code: string; destination: string; detail: string };

export const BROWNSVILLE_ROUTES: Route[] = [
  { code: 'DFW', destination: 'Dallas/Fort Worth', detail: 'American Airlines' },
  { code: 'IAH', destination: 'Houston Intercontinental', detail: 'United Airlines' },
  { code: 'MCO', destination: 'Orlando International', detail: 'Breeze Airways' },
  { code: 'MTY', destination: 'Monterrey', detail: 'Aerus' },
];

export const AIRPORT_ROUTE_SEARCH: Record<string, { source: string; routes: Route[] } | undefined> = {
  BRO: { source: 'https://flybrownsville.com/flight-info/airlines/', routes: BROWNSVILLE_ROUTES },
  SAT: {
    source: 'https://flysanantonio.com/home/flights/nonstop-destinations/',
    routes: [
      { code: 'CUN', destination: 'Cancún', detail: 'Seasonal nonstop' },
      { code: 'MEX', destination: 'Mexico City', detail: 'Nonstop' },
      { code: 'LAX', destination: 'Los Angeles', detail: 'Nonstop' },
      { code: 'JFK', destination: 'New York–JFK', detail: 'Nonstop' },
    ],
  },
};
