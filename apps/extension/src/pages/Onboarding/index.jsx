import { render } from 'solid-js/web';
import { SyncedStateProvider } from '../Popup/syncedState';
import { Onboarding } from './Onboarding';
import './onboarding.css';

render(
  () => (
    <SyncedStateProvider>
      <Onboarding />
    </SyncedStateProvider>
  ),
  document.getElementById('app-container')
);
