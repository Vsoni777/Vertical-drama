import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginApi } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await loginApi({ email, password });
      login(response.data.token, response.data.user);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" id="login-form">
      <div className="auth-field">
        <label htmlFor="login-email">Email address</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">✉</span>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Password</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">🔒</span>
          <input
            id="login-password"
            type={showPass ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShowPass((v) => !v)}
            aria-label="Toggle password visibility"
          >
            {showPass ? "🙈" : "👁"}
          </button>
        </div>
        <div className="auth-field-footer">
          <Link to="/forgot-password" className="auth-footer-link">Forgot password?</Link>
        </div>
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="auth-submit-btn"
      >
        {loading ? (
          <span className="auth-spinner" />
        ) : (
          <>Sign In <span className="btn-arrow">→</span></>
        )}
      </button>
    </form>
  );
}
