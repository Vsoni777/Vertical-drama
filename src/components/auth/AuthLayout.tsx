import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export default function AuthLayout({ title, subtitle, children, footerText, footerLinkText, footerLinkTo }: Props) {
  return (
    <div className="auth-screen">
      {/* Animated background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-wrapper">
        {/* Left panel — brand */}
        <div className="auth-brand-panel">
          <Link to="/" className="auth-brand">
            <span className="brand-mark">V</span>
            <span>Vivid</span>
          </Link>
          <div className="auth-brand-tagline">
            <h2>Stories that fit in your hand.</h2>
            <p>Binge vertical drama series, unlock premium episodes with coins, or go unlimited with a subscription.</p>
          </div>
          <div className="auth-features">
            {[
              { icon: "▶", label: "Vertical video" },
              { icon: "◉", label: "Coin system" },
              { icon: "✦", label: "Daily rewards" },
              { icon: "♾", label: "Unlimited plans" },
            ].map((f) => (
              <div className="auth-feature" key={f.label}>
                <span>{f.icon}</span>
                <small>{f.label}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>

            {children}

            <p className="auth-footer-text">
              {footerText}{" "}
              <Link to={footerLinkTo} className="auth-footer-link">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
