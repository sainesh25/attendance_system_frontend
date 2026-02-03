import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserCog, GraduationCap } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Attendance System</CardTitle>
          <CardDescription>Select your role to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Link to="/login/teacher" className="group">
            <Button
              variant="outline"
              className="h-32 w-full flex-col gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <GraduationCap className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-semibold">Teacher</div>
                <div className="text-xs text-muted-foreground">
                  Class management
                </div>
              </div>
            </Button>
          </Link>

          <Link to="/login/admin" className="group">
            <Button
              variant="outline"
              className="h-32 w-full flex-col gap-4 border-2 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <UserCog className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="font-semibold">Admin</div>
                <div className="text-xs text-muted-foreground">
                  System administration
                </div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
