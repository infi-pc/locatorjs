import { HopeProvider, HopeThemeConfig } from '@hope-ui/solid';
import Popup from './Popup';

const config: HopeThemeConfig = {
  lightTheme: {
    colors: {
      primary9: 'salmon',
    },
  },
};

const App = () => {
  return (
    <HopeProvider config={config}>
      <Popup />
    </HopeProvider>
  );
};

export default App;
