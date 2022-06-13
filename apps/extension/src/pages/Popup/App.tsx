import { HopeProvider, HopeThemeConfig } from '@hope-ui/solid';
import Popup from './Popup';
import { SyncedStateProvider } from './syncedState';

const config: HopeThemeConfig = {
  initialColorMode: 'system',
  lightTheme: {
    colors: {
      primary1: 'hsl(292, 90.0%, 99.4%)',
      primary2: 'hsl(300, 100%, 98.6%)',
      primary3: 'hsl(299, 71.2%, 96.4%)',
      primary4: 'hsl(299, 62.0%, 93.8%)',
      primary5: 'hsl(298, 56.1%, 90.5%)',
      primary6: 'hsl(296, 51.3%, 85.8%)',
      primary7: 'hsl(295, 48.2%, 78.9%)',
      primary8: 'hsl(292, 47.7%, 70.8%)',
      primary9: 'hsl(292, 45.0%, 51.0%)',
      primary10: 'hsl(292, 50.2%, 46.9%)',
      primary11: 'hsl(292, 60.0%, 42.5%)',
      primary12: 'hsl(291, 66.0%, 14.0%)',
    },
  },
};

const App = () => {
  return (
    <HopeProvider config={config}>
      <SyncedStateProvider>
        <Popup />
      </SyncedStateProvider>
    </HopeProvider>
  );
};

export default App;
