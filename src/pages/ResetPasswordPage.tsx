import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../api/auth";
import AuthLayout from "../components/auth/AuthLayout";

export default function ResetPasswordPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get("reset_password_token") || "";

  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPwd,      setShowPwd]      = useState(false);
  const [strength,     setStrength]     = useState(0);

  const calcStrength = (v: string) => {
    let s = 0;
    if (v.length >= 8)        s++;
    if (/[A-Z]/.test(v))      s++;
    if (/[0-9]/.test(v))      s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    setStrength(s);
  };

  const handlePwd = (v: string) => { setPassword(v); calcStrength(v); };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="This password reset link is invalid or has expired."
        footerText="Need help?"
        footerLinkText="Request a new link"
        footerLinkTo="/forgot-password"
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Link to="/forgot-password" className="auth-submit-btn" style={{ textDecoration: "none" }}>
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 8)  { toast.error("Password must be at least 8 characters"); return; }

    setLoading(true);
    try {
      const res = await resetPassword({
        reset_password_token: token,
        password,
        password_confirmation: confirm,
      });
      // Auto-login if token returned
      const jwt = (res.data as { token?: string }).token;
      if (jwt) { sessionStorage.setItem("token", jwt); }
      toast.success("Password updated! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors;
      toast.error(errors?.[0] ?? "Could not reset password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ff6b6b", "#ffcf71", "#7ec8a4", "#4cd68c"][strength];

  return (
    <AuthLayout
      title="New password"
      subtitle="Must be at least 8 characters."
      footerText="Remember your password?"
      footerLinkText="Back to sign in"
      footerLinkTo="/login"
    >
      <form onSubmit={submit} className="auth-form" noValidate>
        <div className="auth-field">
          <label htmlFor="reset-pwd">New password</label>
          <div className="auth-input-wrap">
            <input
              id="reset-pwd"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => handlePwd(e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" className="auth-eye" onClick={() => setShowPwd((s) => !s)}>
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>
          {password && (
            <div className="pw-strength">
              <div className="pw-strength-bar">
                {[1,2,3,4].map((i) => (
                  <div
                    key={i}
                    className="pw-seg"
                    style={{ background: i <= strength ? strengthColor : undefined }}
                  />
                ))}
              </div>
              <span className="pw-label" style={{ color: strengthColor }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="reset-confirm">Confirm password</label>
          <div className="auth-input-wrap">
            <input
              id="reset-confirm"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {confirm && password !== confirm && (
            <p style={{ fontSize: 11, color: "#ff8a8a", marginTop: 4, marginBottom: 0 }}>Passwords do not match</p>
          )}
        </div>

        <button
          id="reset-submit"
          type="submit"
          disabled={loading || password !== confirm || password.length < 8}
          className="auth-submit-btn"
          style={{ marginTop: "12px" }}
        >
          {loading ? "Updating…" : "Set new password"}
        </button>
      </form>
    </AuthLayout>
  );
}
