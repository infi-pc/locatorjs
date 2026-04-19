export function NestingTest() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "blue",
      }}
    >
      <NestingTest1 />
    </div>
  );
}

function NestingTest1() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "red",
      }}
    >
      <NestingTest2 />
    </div>
  );
}

function NestingTest2() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "green",
      }}
    >
      <NestingTest3 />
    </div>
  );
}

function NestingTest3() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "yellow",
      }}
    ></div>
  );
}
