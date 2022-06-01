import { getModifiersMap, getModifiersString } from '@locator/shared';
import { createSignal } from 'solid-js';
import browser from '../../browser';

const [controls, setControls] = createSignal('alt');

export const controlsMap = () => getModifiersMap(controls());

export const changeControls = (control: string, enable: boolean) => {
  const map = controlsMap();
  if (enable) {
    map[control] = true;
  } else {
    delete map[control];
  }
  setControls(getModifiersString(map));
  browser.storage.local.set({ controls: getModifiersString(map) });
};

browser.storage.local
  .get(['controls'])
  .then((result) => {
    if (typeof result?.controls === 'string') {
      setControls(result.controls);
    }
  })
  .catch((e) => {
    console.error(e);
  });
