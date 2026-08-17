import { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";
import { requestPasswordReset } from "../api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await requestPasswordReset(email);
      setSent(true);
      toast.success("Password reset instructions sent");
    } catch {
      toast.error("We could not send reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions."
        footerText="Remember your password?"
        footerLinkText="Back to sign in"
        footerLinkTo="/login"
      >
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
          <p style={{ color: "#9d92a8", lineHeight: 1.5 }}>
            If that account exists, we've sent reset instructions to <b style={{color: "#fff"}}>{email}</b>.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We’ll email you a secure reset link."
      footerText="Remember your password?"
      footerLinkText="Back to sign in"
      footerLinkTo="/login"
    >
      <form onSubmit={submit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="reset-email">Email address</label>
          <div className="auth-input-wrap">
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="auth-submit-btn">
          {loading ? "Sending..." : "Send reset instructions"}
        </button>
      </form>
    </AuthLayout>
  );
}
