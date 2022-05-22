import { render } from 'solid-js/web';

import Popup from './Popup';
import './index.css';

render(Popup, document.getElementById('app-container'));

if (module.hot) module.hot.accept();
