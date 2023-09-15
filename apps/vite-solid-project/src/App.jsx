import logo from "./logo.svg";
import styles from "./App.module.css";
import { Inner2 } from "./Inner2";

function Inner() {
  return (
    <div
      style={{
        "background-color": "red",
        padding: "10px",
      }}
    >
      <Inner2 />
    </div>
  );
}
function App() {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <Inner />
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
}

export default App;
