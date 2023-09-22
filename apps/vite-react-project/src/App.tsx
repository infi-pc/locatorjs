import { useState } from "react";
import "./App.css";
import ShadowDomTest from "./ShadowDomTest";
import { NestingTest } from "./NestingTest";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <NestingTest />
      <ShadowDomTest />
      <div
        style={{
          width: "100px",
          height: "100px",
          backgroundColor: "red",
        }}
      >
        <a
          href="https://google.com"
          target="_blank"
          onMouseDown={() => {
            alert("boo");
          }}
          onMouseUp={() => {
            alert("boo");
          }}
        >
          Click catch
        </a>
      </div>

      <header
        className="App-header"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          className=""
          style={{
            padding: "20px",
            margin: "20px",
            display: "flex",
            gap: "10px",
            width: "400px",
            height: "400px",
            border: "1px solid blue",
            flexDirection: "row",
          }}
        >
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "red",
              margin: "auto",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
        </div>

        <div
          className=""
          style={{
            padding: "20px",
            margin: "20px",
            display: "flex",
            gap: "10px",
            width: "400px",
            height: "400px",
            border: "1px solid blue",
            flexDirection: "row",
          }}
        >
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
        </div>

        <div
          className=""
          style={{
            padding: "20px",
            margin: "20px",
            display: "flex",
            gap: "10px",
            width: "400px",
            height: "400px",
            border: "1px solid blue",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
        </div>

        <div
          className=""
          style={{
            padding: "20px",
            margin: "20px",
            display: "flex",
            gap: "10px",
            width: "400px",
            height: "400px",
            border: "1px solid blue",
            flexDirection: "row-reverse",
          }}
        >
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
        </div>

        <div
          className=""
          style={{
            padding: "20px",
            margin: "20px",
            display: "flex",
            gap: "10px",
            width: "400px",
            height: "400px",
            border: "1px solid blue",
            flexDirection: "column",
          }}
        >
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
        </div>
        <div
          className=""
          style={{
            padding: "20px",
            margin: "20px",
            display: "flex",
            gap: "10px",
            width: "400px",
            height: "400px",
            border: "1px solid blue",
            flexDirection: "column-reverse",
          }}
        >
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "50px",
              height: "50px",
              backgroundColor: "red",
            }}
          ></div>
          <div
            className=""
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "red",
            }}
          ></div>
        </div>
      </header>
    </div>
  );
}

export default App;
