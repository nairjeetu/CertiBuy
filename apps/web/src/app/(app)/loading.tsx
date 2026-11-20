export default function AppLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid hsl(var(--border))",
          borderTopColor: "hsl(var(--primary))",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <p
        style={{
          fontSize: "0.875rem",
          color: "hsl(var(--muted))",
          fontWeight: 500,
          margin: 0,
        }}
      >
        Loading...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
