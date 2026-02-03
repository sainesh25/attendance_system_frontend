import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getProfile, registerTeacher } from "@/lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeachersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  async function load() {
    setLoading(true);
    try {
      const data = await getProfile();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load teachers");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddTeacher(e) {
    e.preventDefault();
    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!form.password) {
      toast.error("Password is required");
      return;
    }
    setSubmitting(true);
    try {
      await registerTeacher({
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      toast.success("Teacher registered successfully");
      setForm({ username: "", email: "", password: "" });
      setOpen(false);
      load();
    } catch (err) {
      const msg =
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        "Failed to register teacher";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">
            View and register teachers (Admin only)
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add teacher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register teacher</DialogTitle>
              <DialogDescription>
                Create a new teacher account. Only admins can register teachers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTeacher}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="Email (optional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create teacher"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>Teachers and admins</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No users yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email || "—"}</TableCell>
                      <TableCell>{u.role}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
