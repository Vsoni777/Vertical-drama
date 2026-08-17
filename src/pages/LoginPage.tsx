import AuthLayout from "../components/auth/AuthLayout";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue watching"
      footerText="New to Vivid?"
      footerLinkText="Create an account"
      footerLinkTo="/register"
    >
      <LoginForm />
    </AuthLayout>
  );
}
