// src/components/AdminCrudPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date" | "checkbox" | "url";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface AdminCrudPageProps<T extends { id: number | string }> {
  title: string;
  items: T[];
  fields: FieldConfig[];
  displayColumns: { key: string; label: string }[];
  loading?: boolean;
  searchable?: boolean;
  onAdd: (data: Record<string, any>) => Promise<void>;
  onUpdate: (id: number | string, data: Record<string, any>) => Promise<void>;
  onDelete: (id: number | string) => Promise<void>;
  renderCell?: (item: T, key: string) => React.ReactNode;
  rowActions?: (item: T) => React.ReactNode;
}

function AdminCrudPage<T extends { id: number | string }>({
  title,
  items,
  fields,
  displayColumns,
  loading = false,
  searchable = true,
  onAdd,
  onUpdate,
  onDelete,
  renderCell,
  rowActions,
}: AdminCrudPageProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Client-side search filter across all string column values
  const filtered =
    search.trim() === ""
      ? items
      : items.filter((item) =>
          displayColumns.some((col) =>
            String((item as any)[col.key] ?? "")
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        );

  const openCreate = () => {
    setEditing(null);
    // Default checkbox fields to false
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === "checkbox") defaults[f.key] = false;
    });
    setFormData(defaults);
    setIsOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setFormData({ ...(item as any) });
    setIsOpen(true);
  };

  const setField = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const missing = fields.filter((f) => f.required && !formData[f.key] && formData[f.key] !== 0);
    if (missing.length > 0) {
      toast({
        title: `Required fields missing: ${missing.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, formData);
        toast({ title: `${title.replace(/s$/, "")} updated successfully` });
      } else {
        await onAdd(formData);
        toast({ title: `${title.replace(/s$/, "")} created successfully` });
      }
      setIsOpen(false);
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.response?.data?.error || err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      toast({ title: `${title.replace(/s$/, "")} deleted` });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? "record" : "records"}
              {search && ` matching "${search}"`}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} className="mr-2" /> Add New
        </Button>
      </div>

      {/* Search */}
      {searchable && (
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {displayColumns.map((col) => (
                    <th
                      key={col.key}
                      className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={displayColumns.length + 1} className="py-16 text-center">
                      <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayColumns.length + 1}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {search ? "No items match your search" : "No items yet — click Add New to get started"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      {displayColumns.map((col) => (
                        <td key={col.key} className="py-3 px-4 max-w-[280px] truncate">
                          {renderCell ? renderCell(item, col.key) : String((item as any)[col.key] ?? "")}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {rowActions?.(item)}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            title="Delete"
                          >
                            {deletingId === item.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} {title.replace(/s$/, "")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                {field.type !== "checkbox" && (
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                )}

                {field.type === "textarea" ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="min-h-[100px] resize-y"
                  />
                ) : field.type === "select" ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData[field.key] || ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id={`chk-${field.key}`}
                      checked={!!formData[field.key]}
                      onChange={(e) => setField(field.key, e.target.checked)}
                      className="h-4 w-4 rounded border-input cursor-pointer"
                    />
                    <Label htmlFor={`chk-${field.key}`} className="cursor-pointer font-normal">
                      {field.label}
                    </Label>
                  </div>
                ) : (
                  <Input
                    type={field.type === "url" ? "url" : field.type || "text"}
                    placeholder={field.placeholder}
                    value={formData[field.key] ?? ""}
                    onChange={(e) =>
                      setField(
                        field.key,
                        field.type === "number"
                          ? e.target.value === "" ? "" : Number(e.target.value)
                          : e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editing ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCrudPage;