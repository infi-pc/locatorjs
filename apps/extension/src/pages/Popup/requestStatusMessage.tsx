import browser from '../../browser';
import { StatusMessageFromClient } from './types';

export function requestStatusMessage(
  tabId: number,
  setMessage: (msg: StatusMessageFromClient) => void
) {
  browser.tabs.sendMessage(
    tabId,
    { from: 'popup', subject: 'requestStatusMessage' },
    function onStatusMessage(status: string) {
      if (chrome.runtime.lastError && !status) {
        setMessage('couldNotConnect');
        return;
      }

      setMessage(
        (status === 'ok' || status === 'disabled'
          ? status
          : `error: ${status}`) || 'loading'
      );
    }
  );
}
