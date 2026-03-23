import { lazy } from 'react';

import { registerModule } from '../../registry';

registerModule({
  id: 'entreprises',
  label: 'Entreprises',
  source: 'exportrte.xlsx',
  description: 'Exploration agrégée du RNTE par commune, NAF, forme juridique, effectifs et dynamique.',
  order: 5,
  component: lazy(() => import('./index')),
});
