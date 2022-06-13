import browser from '../../browser';
import { requestStatusMessage } from './requestStatusMessage';

export function requestStatus(setMessage: (message: string) => void) {
  browser.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.id) {
        requestStatusMessage(currentTab.id, setMessage);
      }
    }
  );
}
