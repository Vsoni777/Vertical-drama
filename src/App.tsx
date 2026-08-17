import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import PublicRoute from "./routes/PublicRoute";
import SeriesList from "./pages/SeriesList";
import SeriesDetails from "./pages/SeriesDetails";
import PlayerPage from "./pages/PlayerPage";
import AdminPage from "./pages/AdminPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MembershipPage from "./pages/MembershipPage";
import RewardsPage from "./pages/RewardsPage";
import CoinSuccessPage from "./pages/CoinSuccessPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoutes><DashboardPage /></ProtectedRoutes>}>
          <Route path="dashboard" element={<SeriesList />} />
          <Route path="library"   element={<SeriesList />} />
          <Route path="series/:id" element={<SeriesDetails />} />
          <Route path="watch/:seriesId/:episodeId" element={<PlayerPage />} />
          <Route path="membership"  element={<MembershipPage />} />
          <Route path="rewards"     element={<RewardsPage />} />
          <Route path="coins/success" element={<CoinSuccessPage />} />
          <Route path="admin" element={<ProtectedRoutes roles={["admin"]}><AdminPage /></ProtectedRoutes>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
