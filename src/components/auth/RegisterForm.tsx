import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth";
import toast from "react-hot-toast";

export default function RegisterForm() {
  const [form, setForm] = useState({ email: "", password: "", password_confirmation: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };
  const pwStrength = strength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthClass = ["", "weak", "fair", "good", "strong"][pwStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await register(form);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch {
      toast.error("Could not create your account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" id="register-form">
      <div className="auth-field">
        <label htmlFor="reg-email">Email address</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">✉</span>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="reg-password">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="reg-password"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShowPass((v) => !v)}
            aria-label="Toggle password"
          >
            {showPass ? "🙈" : "👁"}
          </button>
        </div>
        {form.password && (
          <div className="pw-strength">
            <div className="pw-strength-bar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`pw-seg ${i <= pwStrength ? strengthClass : ""}`} />
              ))}
            </div>
            <span className={`pw-label ${strengthClass}`}>{strengthLabel}</span>
          </div>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="reg-confirm">Confirm password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            {form.password_confirmation && form.password === form.password_confirmation ? "✓" : "🔒"}
          </span>
          <input
            id="reg-confirm"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Re-enter password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          />
        </div>
      </div>

      <button
        id="register-submit"
        type="submit"
        disabled={loading}
        className="auth-submit-btn"
      >
        {loading ? (
          <span className="auth-spinner" />
        ) : (
          <>Create Account <span className="btn-arrow">→</span></>
        )}
      </button>
    </form>
  );
}
