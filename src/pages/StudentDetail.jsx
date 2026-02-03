import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getStudent, updateStudent, getClasses, getStudentAttendanceHistory } from "@/lib/api";
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

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "Admin";

  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    roll_no: "",
    student_class: "",
    guardian_mobile: "",
  });
  const [editing, setEditing] = useState(false);
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

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
        const [studentData, classesData] = await Promise.all([
          getStudent(id),
          getClasses().catch(() => []),
        ]);
        if (!cancelled) {
          setStudent(studentData);
          setForm({
            full_name: studentData.full_name || "",
            roll_no: String(studentData.roll_no ?? ""),
            student_class: studentData.student_class
              ? String(studentData.student_class)
              : "",
            guardian_mobile: studentData.guardian_mobile || "",
          });
          setClasses(Array.isArray(classesData) ? classesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Student not found");
          navigate("/students", { replace: true });
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
    setHistoryLoading(true);
    getStudentAttendanceHistory(
      id,
      historyFrom || undefined,
      historyTo || undefined
    )
      .then((data) => {
        if (!cancelled) setHistoryData(data);
      })
      .catch(() => {
        if (!cancelled) setHistoryData(null);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAdmin, historyFrom, historyTo]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id || !form.full_name.trim() || !form.student_class) return;
    const rollNo = parseInt(form.roll_no, 10);
    if (isNaN(rollNo) || rollNo < 0) {
      toast.error("Valid roll number is required");
      return;
    }
    setSubmitting(true);
    try {
      await updateStudent(id, {
        full_name: form.full_name.trim(),
        roll_no: rollNo,
        student_class: Number(form.student_class),
        guardian_mobile: form.guardian_mobile.trim() || null,
      });
      toast.success("Student updated");
      setStudent((prev) =>
        prev
          ? {
              ...prev,
              full_name: form.full_name.trim(),
              roll_no: rollNo,
              student_class: Number(form.student_class),
              class_name:
                classes.find((c) => String(c.id) === form.student_class)
                  ?.class_name +
                  (classes.find((c) => String(c.id) === form.student_class)
                    ?.section
                    ? ` ${classes.find((c) => String(c.id) === form.student_class).section}`
                    : "") || prev.class_name,
              guardian_mobile: form.guardian_mobile.trim() || null,
            }
          : null
      );
      setEditing(false);
    } catch (err) {
      toast.error(
        err.response?.data?.full_name?.[0] ||
          err.response?.data?.detail ||
          "Failed to update"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !student) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/students">← Students</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{student.full_name}</CardTitle>
          <CardDescription>
            Roll no: {student.roll_no} · {student.class_name || student.student_class}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="roll_no">Roll number</Label>
                <Input
                  id="roll_no"
                  type="number"
                  min={0}
                  value={form.roll_no}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, roll_no: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select
                  value={form.student_class || ""}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, student_class: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.class_name}
                        {c.section ? ` ${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guardian_mobile">Guardian mobile</Label>
                <Input
                  id="guardian_mobile"
                  value={form.guardian_mobile}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guardian_mobile: e.target.value }))
                  }
                />
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
                <span className="text-muted-foreground">Full name:</span>{" "}
                {student.full_name}
              </p>
              <p>
                <span className="text-muted-foreground">Roll no:</span>{" "}
                {student.roll_no}
              </p>
              <p>
                <span className="text-muted-foreground">Class:</span>{" "}
                {student.class_name || student.student_class}
              </p>
              <p>
                <span className="text-muted-foreground">Guardian mobile:</span>{" "}
                {student.guardian_mobile || "—"}
              </p>
              <Button onClick={() => setEditing(true)} className="mt-4">
                Edit student
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance history</CardTitle>
          <CardDescription>
            Summary and records; optionally filter by date range (leave empty for all time)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="history-from" className="whitespace-nowrap">From</Label>
              <Input
                id="history-from"
                type="date"
                value={historyFrom}
                onChange={(e) => setHistoryFrom(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="history-to" className="whitespace-nowrap">To</Label>
              <Input
                id="history-to"
                type="date"
                value={historyTo}
                onChange={(e) => setHistoryTo(e.target.value)}
              />
            </div>
          </div>
          {historyLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : historyData ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span><strong>Present:</strong> {historyData.present_count}</span>
                <span><strong>Absent:</strong> {historyData.absent_count}</span>
                <span><strong>Total days:</strong> {historyData.total_days}</span>
                <span><strong>Attendance %:</strong> {historyData.attendance_percent ?? 0}%</span>
              </div>
              {historyData.records?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Class</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.records.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{rec.date ?? "—"}</TableCell>
                        <TableCell>{rec.status === "P" ? "Present" : rec.status === "A" ? "Absent" : rec.status}</TableCell>
                        <TableCell>{rec.class_name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No attendance records in this range.</p>
              )}
            </div>
          ) : !historyLoading && (
            <p className="text-muted-foreground text-sm">No history data.</p>
          )}
        </CardContent>
      </Card>

      {student.qr_code_url && (
        <Card>
          <CardHeader>
            <CardTitle>QR code</CardTitle>
            <CardDescription>
              Use this QR code for attendance verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative inline-block size-48 overflow-hidden rounded border bg-background p-2">
              <img
                src={student.qr_code_url}
                alt={`QR code for ${student.full_name}`}
                className="size-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
