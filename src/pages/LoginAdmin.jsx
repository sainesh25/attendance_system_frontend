import LoginForm from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm
        title="Admin Login"
        description="Sign in to access the administrative dashboard"
      />
    </div>
  );
}
