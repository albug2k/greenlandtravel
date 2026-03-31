// src/pages/admin/AdminDestinations.tsx
import { useState, useEffect, useCallback } from "react";
import AdminCrudPage from "@/components/AdminCrudPage";
import { adminAPI, AdminDestination } from "@/api/admin";

const FIELDS = [
  { key: "title",       label: "Title",              required: true },
  { key: "description", label: "Description",        type: "textarea" as const, required: true },
  { key: "location",    label: "Location",           required: true },
  { key: "country",     label: "Country" },
  { key: "continent",   label: "Continent",          type: "select" as const,
    options: ["Africa","Asia","Europe","North America","South America","Oceania","Antarctica"] },
  { key: "base_price",  label: "Base Price ($)",     type: "number" as const, required: true },
  { key: "best_time",   label: "Best Time to Visit", placeholder: "e.g. April–October" },
  { key: "avg_temp",    label: "Avg Temperature",    placeholder: "e.g. 22°C" },
  { key: "currency",    label: "Currency",           placeholder: "e.g. EUR" },
  { key: "language",    label: "Language",           placeholder: "e.g. French" },
  { key: "image_url",   label: "Image URL",          type: "url" as const },
  { key: "featured",    label: "Featured",           type: "checkbox" as const },
  { key: "popular",     label: "Popular",            type: "checkbox" as const },
  { key: "active",      label: "Active",             type: "checkbox" as const },
];

const COLUMNS = [
  { key: "title",      label: "Title" },
  { key: "location",   label: "Location" },
  { key: "country",    label: "Country" },
  { key: "base_price", label: "Price" },
  { key: "featured",   label: "Featured" },
  { key: "active",     label: "Status" },
];

const AdminDestinations = () => {
  const [items,   setItems]   = useState<AdminDestination[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminAPI.getDestinations()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminCrudPage
      title="Destinations"
      items={items}
      fields={FIELDS}
      displayColumns={COLUMNS}
      loading={loading}
      onAdd={async (data) => { await adminAPI.createDestination(data); await load(); }}
      onUpdate={async (id, data) => { await adminAPI.updateDestination(Number(id), data); await load(); }}
      onDelete={async (id) => { await adminAPI.deleteDestination(Number(id)); await load(); }}
      renderCell={(item: AdminDestination, key: string) => {
        if (key === "base_price") return `$${item.base_price?.toLocaleString() ?? 0}`;
        if (key === "active")
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {item.active ? "Active" : "Inactive"}
            </span>
          );
        if (key === "featured")
          return item.featured
            ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Featured</span>
            : <span className="text-muted-foreground">—</span>;
        return String((item as any)[key] ?? "");
      }}
    />
  );
};

export default AdminDestinations;