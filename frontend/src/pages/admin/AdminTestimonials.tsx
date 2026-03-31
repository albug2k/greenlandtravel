// src/pages/admin/AdminTestimonials.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Star, Search, Loader2, ShieldCheck, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminAPI, AdminTestimonial } from "@/api/admin";

// Testimonials are user-submitted — admin cannot create them directly.
// Admin actions: verify (approve), feature/unfeature.

const STATUS_BADGE = {
  verified_featured:   "bg-primary/10 text-primary",
  verified_unfeatured: "bg-green-100 text-green-700",
  unverified:          "bg-yellow-100 text-yellow-700",
};

const AdminTestimonials = () => {
  const [items,     setItems]     = useState<AdminTestimonial[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [actingId,  setActingId]  = useState<number | null>(null);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<"all" | "unverified" | "featured">("all");
  const { toast } = useToast();

  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await adminAPI.getTestimonials();
      setItems(data);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Network Error";
      setFetchError(msg);
      toast({ title: "Failed to load testimonials", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id: number) => {
    setActingId(id);
    try {
      await adminAPI.verifyTestimonial(id);
      toast({ title: "Testimonial verified successfully" });
      await load();
    } catch (err: any) {
      toast({ title: "Failed to verify", description: err.response?.data?.error, variant: "destructive" });
    } finally { setActingId(null); }
  };

  const handleFeature = async (id: number) => {
    setActingId(id);
    try {
      await adminAPI.featureTestimonial(id);
      toast({ title: "Testimonial feature status updated" });
      await load();
    } catch (err: any) {
      toast({ title: "Failed to update feature status", description: err.response?.data?.error, variant: "destructive" });
    } finally { setActingId(null); }
  };

  const filtered = items.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()) ||
      (t.destination ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.tour_package ?? "").toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all"        ? true :
      filter === "unverified" ? !t.verified :
      filter === "featured"   ? t.featured  : true;

    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            {" · "}
            <span className="text-yellow-600">{items.filter(t => !t.verified).length} pending review</span>
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, review, destination..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(["all","unverified","featured"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "unverified" ? "Pending Review" : "Featured"}
          </Button>
        ))}
      </div>

      {/* API Error */}
      {fetchError && !loading && (
        <div className="rounded-md bg-red-50 border border-red-200 p-6 text-center mb-4">
          <p className="text-red-600 font-medium mb-1">Failed to load testimonials</p>
          <p className="text-red-500 text-sm mb-3">{fetchError}</p>
          <p className="text-xs text-red-400 mb-3">
            If you see "Network Error", check that your backend is running and the /testimonials endpoint is accessible.
            Open <strong>api-diagnostic.html</strong> to test all endpoints.
          </p>
          <button onClick={load} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No testimonials found
          </CardContent>
        </Card>
      )}

      {/* Cards Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <Card key={t.id} className={`flex flex-col ${!t.verified ? "border-yellow-300 bg-yellow-50/30" : ""}`}>
              <CardContent className="p-5 flex flex-col h-full">
                {/* Status badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {!t.verified && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending Review</Badge>
                  )}
                  {t.verified && (
                    <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                  )}
                  {t.featured && (
                    <Badge className="bg-primary/10 text-primary text-xs">Featured</Badge>
                  )}
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(t.rating) ? "fill-secondary text-secondary" : "text-muted-foreground"}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{t.rating}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4 mb-4">
                  "{t.content}"
                </p>

                {/* Reviewer info */}
                <div className="border-t pt-3 mb-4">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[t.role, t.company].filter(Boolean).join(" · ")}
                  </p>
                  {(t.tour_package || t.destination) && (
                    <p className="text-xs text-primary mt-0.5">
                      {t.tour_package || t.destination}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!t.verified && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleVerify(t.id)}
                      disabled={actingId === t.id}
                    >
                      {actingId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck size={14} className="mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                  )}
                  {t.verified && (
                    <Button
                      size="sm"
                      variant={t.featured ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => handleFeature(t.id)}
                      disabled={actingId === t.id}
                    >
                      {actingId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Bookmark size={14} className="mr-1" />
                          {t.featured ? "Unfeature" : "Feature"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;