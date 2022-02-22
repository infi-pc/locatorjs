import logo from "./logo.svg";
import "./App.css";
import styled from "styled-components";

const StyledTest = styled.div`
  color: red;
`;

const S = {
  One: styled.div`
    color: red;
  `,
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <StyledTest>Styled component test</StyledTest>
        <S.One>Nested styled test</S.One>
      </header>
    </div>
  );
}

export default App;
