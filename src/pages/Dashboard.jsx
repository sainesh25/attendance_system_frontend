import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getClasses, getStudents, getProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, GraduationCap, Users } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    teachers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [classes, students, profile] = await Promise.all([
          getClasses().catch(() => []),
          getStudents().catch(() => []),
          getProfile().catch(() => []),
        ]);
        if (!cancelled) {
          setStats({
            classes: Array.isArray(classes) ? classes.length : 0,
            students: Array.isArray(students) ? students.length : 0,
            teachers: Array.isArray(profile) ? profile.length : 0,
          });
        }
      } catch {
        if (!cancelled) setStats({ classes: 0, students: 0, teachers: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name || user?.username || "User"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classes}</div>
            <p className="text-xs text-muted-foreground">Total classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
            <p className="text-xs text-muted-foreground">Total students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>Manage classes and sections</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/classes">Manage Classes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage student records</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/students">Manage Students</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
            <CardDescription>Manage teacher accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/teachers">Manage Teachers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
