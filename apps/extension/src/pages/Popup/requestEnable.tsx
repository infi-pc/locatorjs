import browser from '../../browser';

export function requestEnable(value: boolean) {
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
          { from: 'popup', subject: 'requestEnable', value },
          function onStatusMessage() {
            // Nothing here yet
          }
        );
      }
    }
  );
}
