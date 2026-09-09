import Popup from './Popup';
import { SyncedStateProvider } from './syncedState';

const App = () => {
  return (
    <SyncedStateProvider>
      <Popup />
    </SyncedStateProvider>
  );
};

export default App;
