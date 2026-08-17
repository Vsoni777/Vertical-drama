import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logout as logoutApi } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { useViewer } from "../hooks/useViewer";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const viewer = useViewer();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      toast("Signed out locally");
    } finally {
      logout();
      toast("Signed out");
      navigate("/login");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Payment successful! Your subscription is now active.");
      viewer.refresh();
      // Remove query params from URL without refreshing
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("canceled") === "true") {
      toast.error("Payment was canceled. You have not been charged.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [viewer]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark">V</span>
          <span>Vivid</span>
        </Link>

        <nav>
          <NavLink end to="/dashboard">Discover</NavLink>
          <NavLink to="/membership">Membership</NavLink>
          <NavLink to="/rewards">Rewards</NavLink>
          {viewer.isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="header-actions">
          <span className="coin-pill">◉ {viewer.coins}</span>
          <span className="user-email-pill">{user?.email}</span>
          <button className="logout-btn" onClick={handleLogout} id="logout-button">
            Logout
          </button>
        </div>
      </header>

      <Outlet />

      <nav className="mobile-nav">
        <NavLink end to="/dashboard"><span>⌂</span>Home</NavLink>
        <NavLink to="/membership"><span>◉</span>Plans</NavLink>
        <NavLink to="/rewards"><span>✦</span>Rewards</NavLink>
        {viewer.isAdmin && <NavLink to="/admin"><span>⚙</span>Admin</NavLink>}
      </nav>
    </div>
  );
}
