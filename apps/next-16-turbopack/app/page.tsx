import Card from "./components/Card";
import Counter from "./components/Counter";

export default function Home() {
  return (
    <main>
      <h1 style={{ marginBottom: "1.5rem" }}>
        React 19 + Turbopack (no webpack-loader)
      </h1>

      <Card title="Counter Component">
        <Counter />
      </Card>

      <Card title="Static Content">
        <p>This is a paragraph inside a Card component.</p>
        <ul>
          <li>List item one</li>
          <li>List item two</li>
          <li>List item three</li>
        </ul>
      </Card>

      <Card title="Nested Elements">
        <div id="test-div" className="test-class">
          <span>Nested span inside a div with className and id</span>
        </div>
      </Card>
    </main>
  );
}
