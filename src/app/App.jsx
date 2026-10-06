export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#160812",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <main>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>
          ⚔️
        </div>

        <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>
          Хроніки Згаслого Світанку
        </h1>

        <p style={{ opacity: 0.8 }}>
          Гра успішно запущена!
        </p>

        <p style={{ marginTop: "20px", color: "#e84c82" }}>
          React працює ✅
        </p>
      </main>
    </div>
  );
}
