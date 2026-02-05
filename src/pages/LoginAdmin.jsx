import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <LoginForm
          title="Admin Login"
          description="Sign in to access the administrative dashboard"
        />
      </div>
    </div>
  );
}
