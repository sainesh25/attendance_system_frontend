import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { getClass, updateClass, getProfile } from "@/lib/api";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const [classData, profileData] = await Promise.all([
          getClass(id),
          getProfile().catch(() => []),
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
          setTeachers(Array.isArray(profileData) ? profileData : []);
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
  }, [id, navigate]);

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/classes">← Classes</Link>
        </Button>
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
