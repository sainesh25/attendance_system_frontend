import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getClasses,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const classFilter = searchParams.get("class");
  const isAdmin = user?.role === "ADMIN" || user?.role === "Admin";
  const isTeacher = user?.role === "TEACHER" || user?.role === "Teacher";
  const canAccess = isAdmin || isTeacher;

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    roll_no: "",
    student_class: "",
    guardian_mobile: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!canAccess) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, canAccess, navigate]);

  async function load() {
    setLoading(true);
    try {
      const [studentsData, classesData] = await Promise.all([
        getStudents().catch(() => []),
        getClasses().catch(() => []),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch {
      toast.error("Failed to load data");
      setStudents([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccess) load();
  }, [canAccess]);

  const filteredStudents = classFilter
    ? students.filter((s) => String(s.student_class) === classFilter)
    : students;

  function openEdit(student) {
    setEditingId(student.id);
    setForm({
      full_name: student.full_name || "",
      roll_no: String(student.roll_no ?? ""),
      student_class: student.student_class ? String(student.student_class) : "",
      guardian_mobile: student.guardian_mobile || "",
    });
    setEditOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!form.student_class) {
      toast.error("Class is required");
      return;
    }
    const rollNo = parseInt(form.roll_no, 10);
    if (isNaN(rollNo) || rollNo < 0) {
      toast.error("Valid roll number is required");
      return;
    }
    setSubmitting(true);
    try {
      await createStudent({
        full_name: form.full_name.trim(),
        roll_no: rollNo,
        student_class: Number(form.student_class),
        guardian_mobile: form.guardian_mobile.trim() || null,
      });
      toast.success("Student created");
      setForm({
        full_name: "",
        roll_no: "",
        student_class: "",
        guardian_mobile: "",
      });
      setCreateOpen(false);
      load();
    } catch (err) {
      const msg =
        err.response?.data?.full_name?.[0] ||
        err.response?.data?.roll_no?.[0] ||
        err.response?.data?.student_class?.[0] ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to create student";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId || !form.full_name.trim() || !form.student_class) return;
    const rollNo = parseInt(form.roll_no, 10);
    if (isNaN(rollNo) || rollNo < 0) {
      toast.error("Valid roll number is required");
      return;
    }
    setSubmitting(true);
    try {
      await updateStudent(editingId, {
        full_name: form.full_name.trim(),
        roll_no: rollNo,
        student_class: Number(form.student_class),
        guardian_mobile: form.guardian_mobile.trim() || null,
      });
      toast.success("Student updated");
      setEditOpen(false);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.full_name?.[0] ||
          err.response?.data?.detail ||
          "Failed to update student"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await deleteStudent(deleteId);
      toast.success("Student deleted");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete student");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClassFilterChange(value) {
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ class: value });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage students and roll numbers</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Add student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create student</DialogTitle>
              <DialogDescription>
                Add a new student. A QR code will be generated for attendance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    placeholder="Student full name"
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
                    placeholder="Roll no"
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
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
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
                    placeholder="Optional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Filter by class:</Label>
          <Select
            value={classFilter || "all"}
            onValueChange={handleClassFilterChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.class_name}
                  {c.section ? ` ${c.section}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All students</CardTitle>
          <CardDescription>View and manage students</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll no</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Guardian mobile</TableHead>
                  <TableHead className="w-16">QR</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No students yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          to={`/students/${s.id}`}
                          className="font-medium hover:underline"
                        >
                          {s.full_name}
                        </Link>
                      </TableCell>
                      <TableCell>{s.roll_no}</TableCell>
                      <TableCell>{s.class_name || s.student_class}</TableCell>
                      <TableCell>{s.guardian_mobile || "—"}</TableCell>
                      <TableCell>
                        {s.qr_code_url ? (
                          <a
                            href={s.qr_code_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block size-10 overflow-hidden rounded border bg-background p-0.5"
                            title={`QR code for ${s.full_name}`}
                          >
                            <img
                              src={s.qr_code_url}
                              alt={`QR for ${s.full_name}`}
                              className="size-full object-contain"
                            />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="mr-2"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(s.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>
              Update student details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_full_name">Full name</Label>
                <Input
                  id="edit_full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_roll_no">Roll number</Label>
                <Input
                  id="edit_roll_no"
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
                <Label htmlFor="edit_guardian_mobile">Guardian mobile</Label>
                <Input
                  id="edit_guardian_mobile"
                  value={form.guardian_mobile}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guardian_mobile: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student and their QR code. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
