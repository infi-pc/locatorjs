import "./App.css";
import { Body, S, StyledTest } from "./Styled";

function App() {
  return (
    <Body>
      <div
        style={{
          fontSize: "1rem",
          color: "#500",
        }}
      >
        Standard div
      </div>
      vs.
      <StyledTest>Styled component</StyledTest>
      vs.
      <S.One>Nested styled</S.One>
      <div>
        <div>
          <div
            style={{ width: "100px", height: "100px", background: "grey" }}
          ></div>
        </div>
      </div>
    </Body>
  );
}

export default App;
