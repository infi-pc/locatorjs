import browser from '../../browser';
import { requestStatusMessage } from './requestStatusMessage';
import { StatusMessageFromClient } from './types';

export function requestStatus(
  setMessage: (message: StatusMessageFromClient) => void
) {
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
