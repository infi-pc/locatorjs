import { render } from 'solid-js/web';

import Panel from './Panel';
import './index.css';

render(Panel, window.document.querySelector('#app-container'));

if (module.hot) module.hot.accept();
