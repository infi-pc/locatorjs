import { render } from 'solid-js/web';
import App from './App';
import './index.css';
import setupLocatorUI from '@locator/runtime';

render(App, document.getElementById('app-container'));

// eslint-disable-next-line no-undef
if (module.hot) module.hot.accept();

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV === 'development') {
  setupLocatorUI();
}
