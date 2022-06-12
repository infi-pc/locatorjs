import browser from '../../browser';

export function requestStatusMessage(
  tabId: number,
  setMessage: (msg: string) => void
) {
  browser.tabs.sendMessage(
    tabId,
    { from: 'popup', subject: 'requestStatusMessage' },
    function onStatusMessage(status) {
      if (chrome.runtime.lastError && !status) {
        setMessage("Couldn't connect to the page");
        return;
      }

      setMessage(status || 'loading');
    }
  );
}
