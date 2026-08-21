import browser from '../../browser';

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install') return;
  browser.tabs.create({
    url: browser.runtime.getURL('onboarding.html'),
  });
});
