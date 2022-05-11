import './Popup.css';

const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "⌥ Option" : "Alt";

const Popup = () => {
  return (
    <div class="App">
      <header class="App-header">
      <div>
        This is pre-release version of the LocatorJS extension.
        <br />
        <b>Focus your app</b> (click on any surface) and do one of followings: 
        <br />
        <br />
        <div class="locatorjs-line"><b>Press and hold <span class="locatorjs-key">${altTitle}</span>:</b> make boxes clickable on full surface</div>
        <div class="locatorjs-line"><b><span class="locatorjs-key">${altTitle}</span> + <span class="locatorjs-key">D</span>:</b> hide/show LocatorJS panel</div>
      </div>
        {/* <p>
          Edit <code>src/pages/Popup/Popup.jsx</code> and save cool reload.
        </p>
        <a
          class="App-link"
          href="https://solidjs.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid-JS!
        </a> */}
      </header>
    </div>
  );
};

export default Popup;
