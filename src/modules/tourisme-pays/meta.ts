import { lazy } from 'react';

import { registerModule } from '../../registry';

registerModule({
  id: 'tourisme-pays',
  label: 'Tourisme par pays',
  source: '11207.xlsx',
  description: 'Vue annuelle par pays avec sélecteur d’année, volumes et durées de séjour.',
  order: 3,
  component: lazy(() => import('./index')),
});
