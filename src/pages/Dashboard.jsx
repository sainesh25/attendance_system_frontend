import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminDashboardOverview,
  getAdminClasswiseToday,
  getTeacherDashboardOverview,
  getTeacherAbsentToday,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, GraduationCap, Users, QrCode, UserX } from "lucide-react";

const isAdmin = (user) =>
  user?.role === "ADMIN" || user?.role === "Admin";
const isTeacher = (user) =>
  user?.role === "TEACHER" || user?.role === "Teacher";

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminOverview, setAdminOverview] = useState(null);
  const [classwiseToday, setClasswiseToday] = useState(null);
  const [teacherOverview, setTeacherOverview] = useState(null);
  const [absentToday, setAbsentToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const admin = isAdmin(user);
  const teacher = isTeacher(user);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (admin) {
          const [overviewRes, classwiseRes] = await Promise.all([
            getAdminDashboardOverview().catch(() => null),
            getAdminClasswiseToday().catch(() => null),
          ]);
          if (!cancelled) {
            setAdminOverview(overviewRes ?? null);
            setClasswiseToday(classwiseRes ?? null);
          }
        } else if (teacher) {
          const [overviewRes, absentRes] = await Promise.all([
            getTeacherDashboardOverview().catch(() => null),
            getTeacherAbsentToday().catch(() => null),
          ]);
          if (!cancelled) {
            setTeacherOverview(overviewRes ?? null);
            setAbsentToday(absentRes ?? null);
          }
        }
      } catch {
        if (!cancelled) {
          setAdminOverview(null);
          setClasswiseToday(null);
          setTeacherOverview(null);
          setAbsentToday(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [admin, teacher]);

  const stats = admin && adminOverview
    ? {
        classes: adminOverview.totals?.classes ?? 0,
        students: adminOverview.totals?.students ?? 0,
        teachers: adminOverview.totals?.teachers ?? 0,
        todayMarked: adminOverview.today_attendance?.marked ?? 0,
        todayPresent: adminOverview.today_attendance?.present ?? 0,
        todayAbsent: adminOverview.today_attendance?.absent ?? 0,
        todayPercent: adminOverview.today_attendance?.attendance_percent ?? 0,
      }
    : teacher && teacherOverview
      ? {
          classes: teacherOverview.assigned_classes?.length ?? 0,
          students: teacherOverview.summary?.total_students ?? 0,
          todayMarked: teacherOverview.summary?.marked_today ?? 0,
          todayPresent: teacherOverview.summary?.present_today ?? 0,
          todayAbsent: teacherOverview.summary?.absent_today ?? 0,
        }
      : { classes: 0, students: 0, teachers: 0, todayMarked: 0, todayPresent: 0, todayAbsent: 0, todayPercent: 0 };

  if (loading) {
    const statCount = admin ? 4 : 3;
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className={`grid gap-4 ${admin ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
          {Array.from({ length: statCount }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name || user?.username || "User"}
        </p>
      </div>

      <div className={`grid gap-4 ${admin ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classes}</div>
            <p className="text-xs text-muted-foreground">
              {admin ? "Total classes" : "Assigned classes"}
            </p>
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
            <CardTitle className="text-sm font-medium">Today marked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayMarked}</div>
            <p className="text-xs text-muted-foreground">
              Present: {stats.todayPresent} · Absent: {stats.todayAbsent}
            </p>
          </CardContent>
        </Card>
        {admin && (
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
        )}
      </div>

      {admin && classwiseToday?.classes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today by class</CardTitle>
            <CardDescription>
              Attendance summary for {classwiseToday.date ?? "today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Total marked</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classwiseToday.classes.map((row) => (
                  <TableRow key={row.class_id}>
                    <TableCell>
                      <Link
                        to={`/classes/${row.class_id}`}
                        className="text-primary hover:underline"
                      >
                        {row.class_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{row.present}</TableCell>
                    <TableCell className="text-right">{row.absent}</TableCell>
                    <TableCell className="text-right">{row.total_marked}</TableCell>
                    <TableCell className="text-right">
                      {row.attendance_percent ?? 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {teacher && absentToday?.absent_records?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Absent today
            </CardTitle>
            <CardDescription>
              Students marked absent for {absentToday.date ?? "today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absentToday.absent_records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{rec.student_name ?? "—"}</TableCell>
                    <TableCell>{rec.class_name ?? "—"}</TableCell>
                    <TableCell>{rec.date ?? "—"}</TableCell>
                    <TableCell>{rec.status === "A" ? "Absent" : rec.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-6 ${admin ? "lg:grid-cols-2" : "md:grid-cols-3"}`}>
        <Card>
          <CardHeader>
            <CardTitle>Classes</CardTitle>
            <CardDescription>
              Manage classes.
            </CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scan QR
            </CardTitle>
            <CardDescription>Mark attendance by scanning student QR codes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/scan">Scan QR</Link>
            </Button>
          </CardContent>
        </Card>
        {admin && (
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
        )}
      </div>
    </div>
  );
}
