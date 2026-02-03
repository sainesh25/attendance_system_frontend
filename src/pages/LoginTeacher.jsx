import LoginForm from "@/components/auth/LoginForm";

export default function TeacherLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm
        title="Teacher Login"
        description="Sign in to manage your classes and attendance"
      />
    </div>
  );
}
