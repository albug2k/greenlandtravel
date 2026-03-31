// src/pages/admin/AdminUsers.tsx
import { useState, useEffect, useCallback } from "react";
import { Button }   from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Search, ShieldCheck, ShieldOff,
  UserCheck, UserX, Plus, Pencil, Trash2,
} from "lucide-react";
import { useToast }             from "@/hooks/use-toast";
import { adminAPI, AdminUser }  from "@/api/admin";
import api                      from "@/utils/api";

// ── form shape used for both Create and Edit ──────────────────────────────────
interface UserForm {
  name:      string;
  email:     string;
  phone:     string;
  password:  string;          // empty = don't change on edit
  is_admin:  boolean;
  is_active: boolean;
}

const EMPTY_FORM: UserForm = {
  name: "", email: "", phone: "", password: "", is_admin: false, is_active: true,
};

// ─────────────────────────────────────────────────────────────────────────────
const AdminUsers = () => {
  const { toast } = useToast();

  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [actingId,  setActingId]  = useState<number | null>(null);
  const [search,    setSearch]    = useState("");

  // Dialog state — mode: "create" | "edit" | null
  const [mode,      setMode]      = useState<"create" | "edit" | null>(null);
  const [editUser,  setEditUser]  = useState<AdminUser | null>(null);
  const [form,      setForm]      = useState<UserForm>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch {
      toast({ title: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── open create dialog ────────────────────────────────────────────────────
  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setMode("create");
  };

  // ── open edit dialog ──────────────────────────────────────────────────────
  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setForm({
      name:      u.name,
      email:     u.email,
      phone:     u.phone ?? "",
      password:  "",              // blank = don't change
      is_admin:  u.is_admin,
      is_active: u.is_active,
    });
    setMode("edit");
  };

  // ── create user ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Name, email and password are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/register", {
        name:     form.name,
        email:    form.email,
        password: form.password,
        phone:    form.phone || undefined,
      });
      if (form.is_admin) {
        const all = await adminAPI.getUsers();
        const created = all.find(u => u.email === form.email);
        if (created) await adminAPI.updateUser(created.id, { is_admin: true });
      }
      toast({ title: "User created successfully" });
      setMode(null);
      await load();
    } catch (err: any) {
      toast({
        title:       "Failed to create user",
        description: err.response?.data?.error || err.message,
        variant:     "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── edit user ──────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editUser) return;
    if (!form.name || !form.email) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: Parameters<typeof adminAPI.updateUser>[1] = {
        name:      form.name,
        email:     form.email,
        phone:     form.phone || undefined,
        is_admin:  form.is_admin,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;

      await adminAPI.updateUser(editUser.id, payload);
      toast({ title: "User updated successfully" });
      setMode(null);
      await load();
    } catch (err: any) {
      toast({
        title:       "Failed to update user",
        description: err.response?.data?.error || err.message,
        variant:     "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── delete user ────────────────────────────────────────────────────────────
  const handleDelete = async (u: AdminUser) => {
    if (!window.confirm(`Delete user "${u.name}" permanently? This cannot be undone.`)) return;
    setActingId(u.id);
    try {
      await adminAPI.deleteUser(u.id);
      toast({ title: "User deleted successfully" });
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err: any) {
      toast({
        title:       "Failed to delete user",
        description: err.response?.data?.error || err.message,
        variant:     "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  // ── quick-toggle active ────────────────────────────────────────────────────
  const toggleActive = async (u: AdminUser) => {
    setActingId(u.id);
    try {
      await adminAPI.updateUser(u.id, { is_active: !u.is_active });
      toast({ title: `User ${u.is_active ? "deactivated" : "activated"}` });
      await load();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.response?.data?.error, variant: "destructive" });
    } finally { setActingId(null); }
  };

  // ── quick-toggle admin ─────────────────────────────────────────────────────
  const toggleAdmin = async (u: AdminUser) => {
    if (!window.confirm(`${u.is_admin ? "Remove admin from" : "Make admin"}: ${u.name}?`)) return;
    setActingId(u.id);
    try {
      await adminAPI.updateUser(u.id, { is_admin: !u.is_admin });
      toast({ title: `Admin ${u.is_admin ? "removed" : "granted"}` });
      await load();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.response?.data?.error, variant: "destructive" });
    } finally { setActingId(null); }
  };

  const f = (k: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const filtered = users.filter(u =>
    !search.trim() ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} users ·{" "}
            <span className="text-primary">{users.filter(u => u.is_admin).length} admins</span>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} className="mr-2" /> Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9"
               value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Name","Email","Phone","Role","Status","Joined","Actions"].map(h => (
                    <th key={h} className={`py-3 px-4 font-medium text-muted-foreground whitespace-nowrap
                                            ${h === "Actions" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center
                                          text-primary font-bold text-xs flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.phone ?? "—"}</td>
                    {/* Role */}
                    <td className="py-3 px-4">
                      {u.is_admin
                        ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Admin</span>
                        : <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">User</span>
                      }
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                                        ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* Joined */}
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Button variant="ghost" size="icon" title="Edit user"
                                onClick={() => openEdit(u)} disabled={actingId === u.id}>
                          <Pencil size={15} className="text-primary" />
                        </Button>
                        {/* Toggle active */}
                        <Button variant="ghost" size="icon"
                                title={u.is_active ? "Deactivate" : "Activate"}
                                onClick={() => toggleActive(u)} disabled={actingId === u.id}>
                          {actingId === u.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : u.is_active
                              ? <UserX      size={15} className="text-amber-600" />
                              : <UserCheck  size={15} className="text-green-600" />
                          }
                        </Button>
                        {/* Toggle admin */}
                        <Button variant="ghost" size="icon"
                                title={u.is_admin ? "Remove admin" : "Make admin"}
                                onClick={() => toggleAdmin(u)} disabled={actingId === u.id}>
                          {u.is_admin
                            ? <ShieldOff   size={15} className="text-muted-foreground" />
                            : <ShieldCheck size={15} className="text-primary" />
                          }
                        </Button>
                        {/* Delete */}
                        <Button variant="ghost" size="icon" title="Delete user"
                                onClick={() => handleDelete(u)} disabled={actingId === u.id}>
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={mode !== null} onOpenChange={open => { if (!open) setMode(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? `Edit: ${editUser?.name}` : "Add New User"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="John Doe" value={form.name} onChange={f("name")} disabled={saving} />
            </div>

            <div className="space-y-1.5">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="john@example.com"
                     value={form.email} onChange={f("email")} disabled={saving} />
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 (555) 000-0000"
                     value={form.phone} onChange={f("phone")} disabled={saving} />
            </div>

            <div className="space-y-1.5">
              <Label>
                {mode === "edit" ? "New Password" : "Password"}{" "}
                {mode === "create" && <span className="text-destructive">*</span>}
              </Label>
              <Input type="password"
                     placeholder={mode === "edit" ? "Leave blank to keep current" : "Min 8 characters"}
                     value={form.password} onChange={f("password")} disabled={saving} />
              {mode === "edit" && (
                <p className="text-xs text-muted-foreground">Leave blank to keep the current password.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_admin}
                       onChange={f("is_admin")} disabled={saving}
                       className="h-4 w-4 rounded border-input cursor-pointer" />
                <span className="text-sm">Admin privileges</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                       onChange={f("is_active")} disabled={saving}
                       className="h-4 w-4 rounded border-input cursor-pointer" />
                <span className="text-sm">Active account</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMode(null)} disabled={saving}>Cancel</Button>
            <Button onClick={mode === "edit" ? handleEdit : handleCreate} disabled={saving}>
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "edit" ? "Saving..." : "Creating..."}</>
                : mode === "edit" ? "Save Changes" : "Create User"
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;