import { render } from 'solid-js/web';
import './analytics';
import App from './App';
import './index.css';

render(App, document.getElementById('app-container'));

if (module.hot) module.hot.accept();
