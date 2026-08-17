import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="auth-screen">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", padding: "40px", background: "linear-gradient(160deg, #1f1030 0%, #120b1e 100%)", border: "1px solid #3d2550", borderRadius: "16px", maxWidth: "420px", width: "100%" }}>
          <h1 style={{ fontSize: "72px", color: "#f473b5", margin: "0 0 16px", lineHeight: 1 }}>404</h1>
          <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "16px" }}>Page Not Found</h2>
          <p style={{ color: "#a193b5", marginBottom: "32px", lineHeight: 1.6 }}>
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="auth-submit-btn" style={{ textDecoration: "none", width: "auto", display: "inline-block", padding: "12px 32px" }}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
