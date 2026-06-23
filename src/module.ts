import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) =>
  builder.addBooleanSwitch({
    path: 'rewardModal',
    name: 'Render preview with reward modal',
    description:
      'Append rewardOnComplete=true to the rapid preview URL so the reward-on-complete modal is shown over the preview.',
    defaultValue: false,
  })
);
