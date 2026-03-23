import { lazy } from 'react';

import { registerModule } from '../../registry';

registerModule({
  id: 'imports',
  label: 'Imports',
  source: '10202.xlsx',
  description: 'Analyse des partenaires commerciaux, de leur poids relatif et de la valeur unitaire proxy.',
  order: 1,
  component: lazy(() => import('./index')),
});
