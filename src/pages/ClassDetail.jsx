import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  getClass,
  updateClass,
  getTeachers,
  getTodayAttendanceByClass,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function todayYYYYMMDD() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "Admin";
  const reportsCardRef = useRef(null);

  const [cls, setCls] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    class_name: "",
    section: "",
    class_teacher: "",
  });
  const [editing, setEditing] = useState(false);
  const [todayRecords, setTodayRecords] = useState([]);
  const [reportType, setReportType] = useState("daily");
  const [reportDate, setReportDate] = useState(() => todayYYYYMMDD());
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (!id || !isAdmin) return;
    let cancelled = false;
    async function load() {
      try {
        const [classData, teachersData] = await Promise.all([
          getClass(id),
          getTeachers().catch(() => []),
        ]);
        if (!cancelled) {
          setCls(classData);
          setForm({
            class_name: classData.class_name || "",
            section: classData.section || "",
            class_teacher: classData.class_teacher
              ? String(classData.class_teacher)
              : "",
          });
          setTeachers(Array.isArray(teachersData) ? teachersData : []);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Class not found");
          navigate("/classes", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isAdmin, navigate]);

  useEffect(() => {
    if (!id || !isAdmin) return;
    let cancelled = false;
    getTodayAttendanceByClass(id)
      .then((data) => {
        if (!cancelled) setTodayRecords(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTodayRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAdmin]);

  useEffect(() => {
    if (!id || !isAdmin) return;
    let cancelled = false;
    setReportLoading(true);
    const fetchReport = () => {
      if (reportType === "daily") return getDailyReport(id, reportDate);
      if (reportType === "weekly") return getWeeklyReport(id, reportDate);
      return getMonthlyReport(id, reportDate);
    };
    fetchReport()
      .then((data) => {
        if (!cancelled) setReportData(data);
      })
      .catch(() => {
        if (!cancelled) setReportData(null);
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAdmin, reportType, reportDate]);

  useEffect(() => {
    if (!cls || location.hash !== "#reports") return;
    reportsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cls, location.hash]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id || !form.class_name.trim()) return;
    setSubmitting(true);
    try {
      await updateClass(id, {
        class_name: form.class_name.trim(),
        section: form.section.trim() || null,
        class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
      });
      toast.success("Class updated");
      setCls((prev) =>
        prev
          ? {
              ...prev,
              class_name: form.class_name.trim(),
              section: form.section.trim() || null,
              class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
              class_teacher_name: form.class_teacher
                ? teachers.find((t) => String(t.id) === form.class_teacher)
                    ?.username
                : null,
            }
          : null
      );
      setEditing(false);
    } catch (err) {
      toast.error(
        err.response?.data?.class_name?.[0] ||
          err.response?.data?.detail ||
          "Failed to update"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !cls) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/classes">← Classes</Link>
        </Button>
        <Link
          to="#reports"
          className="text-sm text-primary hover:underline"
          onClick={(e) => {
            e.preventDefault();
            reportsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Jump to Attendance reports (daily / weekly / monthly)
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {cls.class_name}
            {cls.section ? ` ${cls.section}` : ""}
          </CardTitle>
          <CardDescription>
            Class teacher: {cls.class_teacher_name || "None"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="class_name">Class name</Label>
                <Input
                  id="class_name"
                  value={form.class_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, class_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={form.section}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, section: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Class teacher</Label>
                <Select
                  value={form.class_teacher || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      class_teacher: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <p>
                <span className="text-muted-foreground">Class name:</span>{" "}
                {cls.class_name}
              </p>
              <p>
                <span className="text-muted-foreground">Section:</span>{" "}
                {cls.section || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Class teacher:</span>{" "}
                {cls.class_teacher_name || "—"}
              </p>
              <Button onClick={() => setEditing(true)} className="mt-4">
                Edit class
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s attendance</CardTitle>
          <CardDescription>
            Records marked for today ({todayYYYYMMDD()})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance marked today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Marked at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{rec.student_name ?? "—"}</TableCell>
                    <TableCell>{rec.status === "P" ? "Present" : rec.status === "A" ? "Absent" : rec.status}</TableCell>
                    <TableCell>{rec.date ?? "—"}</TableCell>
                    <TableCell>
                      {rec.marked_at
                        ? new Date(rec.marked_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card id="reports" ref={reportsCardRef}>
        <CardHeader>
          <CardTitle>Attendance reports</CardTitle>
          <CardDescription>
            Daily, weekly, or monthly summary for this class. Choose type and date below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="report-type" className="whitespace-nowrap">Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="report-date" className="whitespace-nowrap">Date</Label>
              <Input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>
          {reportLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : reportData ? (
            <div className="space-y-4">
              {reportType === "daily" && (
                <>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong>Date:</strong> {reportData.date}</span>
                    <span><strong>Present:</strong> {reportData.total_present}</span>
                    <span><strong>Absent:</strong> {reportData.total_absent}</span>
                    <span><strong>Total marked:</strong> {reportData.total_marked}</span>
                  </div>
                  {reportData.records?.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.records.map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell>{rec.student_name ?? "—"}</TableCell>
                            <TableCell>{rec.status === "P" ? "Present" : rec.status === "A" ? "Absent" : rec.status}</TableCell>
                            <TableCell>{rec.date ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
              {reportType === "weekly" && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Weekly summary</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong>Week:</strong> {reportData.week_start} to {reportData.week_end}</span>
                    <span><strong>Present:</strong> {reportData.present_count}</span>
                    <span><strong>Absent:</strong> {reportData.absent_count}</span>
                    <span><strong>Total marked:</strong> {reportData.total_marked}</span>
                  </div>
                </div>
              )}
              {reportType === "monthly" && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Monthly summary</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong>Month:</strong> {reportData.month_start} to {reportData.month_end}</span>
                    <span><strong>Present:</strong> {reportData.present_count}</span>
                    <span><strong>Absent:</strong> {reportData.absent_count}</span>
                    <span><strong>Total marked:</strong> {reportData.total_marked}</span>
                    <span><strong>Attendance %:</strong> {reportData.attendance_percent ?? 0}%</span>
                  </div>
                </div>
              )}
            </div>
          ) : !reportLoading && (
            <p className="text-muted-foreground text-sm">No report data for this period.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students in this class</CardTitle>
          <CardDescription>
            <Link
              to={`/students?class=${cls.id}`}
              className="text-primary hover:underline"
            >
              View students →
            </Link>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
