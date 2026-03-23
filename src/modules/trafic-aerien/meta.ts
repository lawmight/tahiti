import { lazy } from 'react';

import { registerModule } from '../../registry';

registerModule({
  id: 'trafic-aerien',
  label: 'Trafic aérien',
  source: '11801.xlsx',
  description: 'Série longue sur les passagers, le fret, la capacité et le remplissage.',
  order: 4,
  component: lazy(() => import('./index')),
});
