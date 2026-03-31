// src/pages/admin/AdminPackages.tsx
import { useState, useEffect, useCallback } from "react";
import AdminCrudPage from "@/components/AdminCrudPage";
import { adminAPI, AdminPackage } from "@/api/admin";

const FIELDS = [
  { key: "title",          label: "Title",              required: true },
  { key: "description",    label: "Description",        type: "textarea" as const, required: true },
  { key: "duration",       label: "Duration",           required: true, placeholder: "e.g. 7 Days" },
  { key: "group_size",     label: "Group Size",         required: true, placeholder: "e.g. 2–12 people" },
  { key: "base_price",     label: "Base Price ($)",     type: "number" as const, required: true },
  { key: "discount_price", label: "Discount Price ($)", type: "number" as const },
  { key: "category",       label: "Category",           type: "select" as const,
    options: ["romance","adventure","family","luxury","cultural","beach","wildlife"] },
  { key: "difficulty",     label: "Difficulty",         type: "select" as const,
    options: ["easy","moderate","challenging","expert"] },
  { key: "season",         label: "Best Season",        type: "select" as const,
    options: ["spring","summer","autumn","winter","year-round"] },
  { key: "image_url",      label: "Image URL",          type: "url" as const },
  { key: "featured",       label: "Featured",           type: "checkbox" as const },
  { key: "popular",        label: "Popular",            type: "checkbox" as const },
];

const COLUMNS = [
  { key: "title",      label: "Title" },
  { key: "duration",   label: "Duration" },
  { key: "base_price", label: "Price" },
  { key: "category",   label: "Category" },
  { key: "rating",     label: "Rating" },
  { key: "featured",   label: "Featured" },
];

const AdminPackages = () => {
  const [items,   setItems]   = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAPI.getPackages();
      setItems(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load packages");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Packages</h1>
        </div>
        <div className="rounded-md bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load packages</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminCrudPage
      title="Packages"
      items={items}
      fields={FIELDS}
      displayColumns={COLUMNS}
      loading={loading}
      onAdd={async (data) => { await adminAPI.createPackage(data); await load(); }}
      onUpdate={async (id, data) => { await adminAPI.updatePackage(Number(id), data); await load(); }}
      onDelete={async (id) => { await adminAPI.deletePackage(Number(id)); await load(); }}
      renderCell={(item: AdminPackage, key: string) => {
        if (key === "base_price") return `$${item.base_price?.toLocaleString() ?? 0}`;
        if (key === "rating")     return `⭐ ${item.rating?.toFixed(1) ?? "0.0"} (${item.reviews ?? 0})`;
        if (key === "featured")
          return item.featured
            ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Featured</span>
            : item.popular
            ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">Popular</span>
            : <span className="text-muted-foreground">—</span>;
        return String((item as any)[key] ?? "");
      }}
    />
  );
};

export default AdminPackages;