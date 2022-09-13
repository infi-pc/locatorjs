import browser from '../../browser';

export function requestEnable() {
  browser.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.id) {
        browser.tabs.sendMessage(
          currentTab.id,
          { from: 'popup', subject: 'requestEnable' },
          function onStatusMessage() {
            // Nothing here yet
          }
        );
      }
    }
  );
}
