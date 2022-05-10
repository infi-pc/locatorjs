import { render } from 'solid-js/web';

import Newtab from './Newtab';
import './index.css';

render(Newtab, window.document.querySelector('#app-container'));

if (module.hot) module.hot.accept();
