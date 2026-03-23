import { lazy } from 'react';

import { registerModule } from '../../registry';

registerModule({
  id: 'tourisme-mensuel',
  label: 'Tourisme mensuel',
  source: '11201.xlsx',
  description: 'Série mensuelle longue par région d’origine avec tendance, structure et saisonnalité.',
  order: 2,
  component: lazy(() => import('./index')),
});
