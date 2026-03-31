// src/pages/admin/AdminGallery.tsx
import { useState, useEffect, useCallback } from "react";
import AdminCrudPage from "@/components/AdminCrudPage";
import { adminAPI, AdminGallery } from "@/api/admin";

const FIELDS = [
  { key: "title",       label: "Title",       required: true },
  { key: "description", label: "Description", type: "textarea" as const },
  { key: "location",    label: "Location",    placeholder: "e.g. Ubud, Bali" },
  { key: "country",     label: "Country" },
  { key: "category",    label: "Category",    type: "select" as const,
    options: ["Nature","Culture","Wildlife","Architecture","Food","Adventure","People","Cityscape"] },
  { key: "featured",    label: "Featured",    type: "checkbox" as const },
];

const COLUMNS = [
  { key: "title",    label: "Title" },
  { key: "location", label: "Location" },
  { key: "country",  label: "Country" },
  { key: "category", label: "Category" },
  { key: "images",   label: "Images" },
  { key: "featured", label: "Featured" },
];

const AdminGallery = () => {
  const [items,   setItems]   = useState<AdminGallery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminAPI.getGallery()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminCrudPage
      title="Gallery"
      items={items}
      fields={FIELDS}
      displayColumns={COLUMNS}
      loading={loading}
      onAdd={async (data) => { await adminAPI.createGallery(data); await load(); }}
      onUpdate={async (id, data) => { await adminAPI.updateGallery(Number(id), data); await load(); }}
      onDelete={async (id) => { await adminAPI.deleteGallery(Number(id)); await load(); }}
      renderCell={(item: AdminGallery, key: string) => {
        if (key === "images")
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {item.images?.length ?? 0} photos
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

export default AdminGallery;