import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getProfile,
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

export default function ClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN" || user?.role === "Admin";

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    class_name: "",
    section: "",
    class_teacher: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  async function load() {
    setLoading(true);
    try {
      const [classesData, profileData] = await Promise.all([
        getClasses().catch(() => []),
        getProfile().catch(() => []),
      ]);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setTeachers(Array.isArray(profileData) ? profileData : []);
    } catch {
      toast.error("Failed to load data");
      setClasses([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  function openEdit(cls) {
    setEditingId(cls.id);
    setForm({
      class_name: cls.class_name || "",
      section: cls.section || "",
      class_teacher: cls.class_teacher ? String(cls.class_teacher) : "",
    });
    setEditOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.class_name.trim()) {
      toast.error("Class name is required");
      return;
    }
    setSubmitting(true);
    try {
      await createClass({
        class_name: form.class_name.trim(),
        section: form.section.trim() || null,
        class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
      });
      toast.success("Class created");
      setForm({ class_name: "", section: "", class_teacher: "" });
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.class_name?.[0] ||
          err.response?.data?.detail ||
          "Failed to create class"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId || !form.class_name.trim()) return;
    setSubmitting(true);
    try {
      await updateClass(editingId, {
        class_name: form.class_name.trim(),
        section: form.section.trim() || null,
        class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
      });
      toast.success("Class updated");
      setEditOpen(false);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.class_name?.[0] ||
          err.response?.data?.detail ||
          "Failed to update class"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await deleteClass(deleteId);
      toast.success("Class deleted");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete class");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Manage school classes</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Add class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create class</DialogTitle>
              <DialogDescription>
                Add a new class with optional section and class teacher.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="class_name">Class name</Label>
                  <Input
                    id="class_name"
                    value={form.class_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, class_name: e.target.value }))
                    }
                    placeholder="e.g. 10"
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
                    placeholder="e.g. A (optional)"
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
                      <SelectValue placeholder="Select teacher (optional)" />
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
      <Card>
        <CardHeader>
          <CardTitle>All classes</CardTitle>
          <CardDescription>Click a row to view details or use actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Class teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No classes yet
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <Link
                          to={`/classes/${cls.id}`}
                          className="font-medium hover:underline"
                        >
                          {cls.class_name}
                        </Link>
                      </TableCell>
                      <TableCell>{cls.section || "—"}</TableCell>
                      <TableCell>{cls.class_teacher_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          asChild
                        >
                          <Link to={`/classes/${cls.id}#reports`}>Reports</Link>
                        </Button>
                        <Button
                          size="sm"
                          className="mr-2"
                          onClick={() => openEdit(cls)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(cls.id)}
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
            <DialogTitle>Edit class</DialogTitle>
            <DialogDescription>
              Update class name, section, or class teacher.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_class_name">Class name</Label>
                <Input
                  id="edit_class_name"
                  value={form.class_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, class_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_section">Section</Label>
                <Input
                  id="edit_section"
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the class. Students in this class may
              need to be reassigned. This action cannot be undone.
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
