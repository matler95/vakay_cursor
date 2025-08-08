// src/app/page.tsx
// All server-side redirect logic has been removed and is now in middleware.
import LoginForm from './_components/LoginForm';

export default function LoginPage() {
  // This page is now only responsible for displaying the login form.
  return <LoginForm />;
}