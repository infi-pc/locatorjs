import { createSignal } from 'solid-js';
import browser from '../../browser';

const [clickCount, setClickCount] = createSignal<number | null>(null);

browser.storage.local
  .get(['clickCount'])
  .then((result) => {
    if (typeof result?.clickCount === 'number') {
      setClickCount(result.clickCount);
    }
  })
  .catch((e) => {
    console.error(e);
  });

export default clickCount;
