// src/pages/Testimonials.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Quote,
  Loader2,
  MessageSquarePlus,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  testimonialsAPI,
  Testimonial,
  TestimonialStats,
  CreateTestimonialData,
} from "@/api/testimonials";

// ── Helpers ───────────────────────────────────────────────────────────────────

const StarRating = ({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={
          i < Math.round(rating)
            ? "fill-secondary text-secondary"
            : "text-muted-foreground"
        }
        style={interactive ? { cursor: "pointer" } : undefined}
        onClick={() => interactive && onChange?.(i + 1)}
      />
    ))}
  </div>
);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

// ── Submit Form ───────────────────────────────────────────────────────────────

const SubmitForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateTestimonialData>({
    name: "",
    content: "",
    rating: 5,
    role: "",
    company: "",
    destination: "",
    tour_package: "",
  });

  const handleChange = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content || !form.rating) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await testimonialsAPI.create({
        name: form.name.trim(),
        content: form.content.trim(),
        rating: form.rating,
        role: form.role?.trim() || undefined,
        company: form.company?.trim() || undefined,
        destination: form.destination?.trim() || undefined,
        tour_package: form.tour_package?.trim() || undefined,
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description:
          err.response?.data?.error ||
          "Please log in to submit a testimonial.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
        <p className="text-muted-foreground">
          Your testimonial has been submitted for review and will appear once
          approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="t-name">Your Name *</Label>
          <Input
            id="t-name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-role">Your Role</Label>
          <Input
            id="t-role"
            placeholder="e.g. Travel Enthusiast"
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      {/* Company + Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="t-company">Company / Location</Label>
          <Input
            id="t-company"
            placeholder="e.g. London, UK"
            value={form.company}
            onChange={(e) => handleChange("company", e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-destination">Destination Visited</Label>
          <Input
            id="t-destination"
            placeholder="e.g. Bali, Indonesia"
            value={form.destination}
            onChange={(e) => handleChange("destination", e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      {/* Package */}
      <div className="space-y-2">
        <Label htmlFor="t-package">Tour Package</Label>
        <Input
          id="t-package"
          placeholder="e.g. Bali Paradise Package"
          value={form.tour_package}
          onChange={(e) => handleChange("tour_package", e.target.value)}
          disabled={submitting}
        />
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>Your Rating *</Label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={28}
              className={
                i < form.rating
                  ? "fill-secondary text-secondary cursor-pointer"
                  : "text-muted-foreground cursor-pointer hover:text-secondary transition-colors"
              }
              onClick={() => handleChange("rating", i + 1)}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{form.rating} out of 5 stars</p>
      </div>

      {/* Review */}
      <div className="space-y-2">
        <Label htmlFor="t-content">Your Review *</Label>
        <Textarea
          id="t-content"
          placeholder="Share your experience with us..."
          className="min-h-[120px] resize-none"
          value={form.content}
          onChange={(e) => handleChange("content", e.target.value)}
          required
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground text-right">
          {form.content.length} characters
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Testimonials are reviewed before publishing. You must be logged in.
      </p>
    </form>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Testimonials = () => {
  // ── Data state ──────────────────────────────────────────────────────────
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<TestimonialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<"created_at" | "rating" | "random">(
    "created_at"
  );
  const [minRating, setMinRating] = useState<number>(0);
  const [showFeatured, setShowFeatured] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);

  const LIMIT = 9;

  // ── Fetch stats once ─────────────────────────────────────────────────────
  useEffect(() => {
    testimonialsAPI.getStats().then(setStats).catch(console.error);
  }, []);

  // ── Fetch testimonials ───────────────────────────────────────────────────
  useEffect(() => {
    fetchTestimonials();
  }, [currentPage, sortBy, minRating, showFeatured]);

  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: LIMIT,
        sort_by: sortBy,
      };
      if (minRating > 0) params.min_rating = minRating;
      if (showFeatured) params.featured = true;

      const response = await testimonialsAPI.getAll(params);
      setTestimonials(response.testimonials);
      setTotalPages(response.pages || 1);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      setError("Failed to load testimonials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSortBy("created_at");
    setMinRating(0);
    setShowFeatured(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = minRating > 0 || showFeatured;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Quote size={32} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Traveller Stories
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-white/90">
            Real experiences from real adventurers who trusted us with their
            dream journeys
          </p>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      {stats && (
        <section className="py-10 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-12 text-center">
              <div>
                <p className="text-4xl font-bold">{stats.average_rating}</p>
                <StarRating rating={stats.average_rating} size={18} />
                <p className="text-primary-foreground/80 text-sm mt-1">
                  Average Rating
                </p>
              </div>
              <div>
                <p className="text-4xl font-bold">
                  {stats.total_count.toLocaleString()}
                </p>
                <p className="text-primary-foreground/80 text-sm mt-1">
                  Verified Reviews
                </p>
              </div>
              {/* Rating distribution */}
              <div className="hidden md:block">
                <p className="text-sm font-semibold mb-2">Rating Breakdown</p>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((r) => {
                    const entry = stats.rating_distribution.find(
                      (d) => Math.round(d.rating) === r
                    );
                    const count = entry?.count ?? 0;
                    const pct =
                      stats.total_count > 0
                        ? Math.round((count / stats.total_count) * 100)
                        : 0;
                    return (
                      <div key={r} className="flex items-center gap-2 text-xs">
                        <span className="w-4">{r}★</span>
                        <div className="w-24 bg-white/20 rounded-full h-1.5">
                          <div
                            className="bg-white rounded-full h-1.5"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-primary-foreground/70">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <section className="py-5 bg-gray-50 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center justify-between max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Sort */}
              <div className="w-44">
                <Select
                  value={sortBy}
                  onValueChange={(v) => {
                    setSortBy(v as typeof sortBy);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Latest First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min rating filter */}
              <div className="w-44">
                <Select
                  value={String(minRating)}
                  onValueChange={(v) => {
                    setMinRating(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Ratings</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="5">5 Stars Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured toggle */}
              <Button
                variant={showFeatured ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowFeatured((v) => !v);
                  setCurrentPage(1);
                }}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Featured Only
              </Button>

              {/* Clear */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Submit CTA */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Share Your Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Share Your Experience</DialogTitle>
                  <DialogDescription>
                    Tell us about your journey. Your review helps other
                    travellers make great decisions.
                  </DialogDescription>
                </DialogHeader>
                <SubmitForm onSuccess={() => {
                  // Refetch after successful submission
                  setTimeout(() => {
                    setDialogOpen(false);
                    fetchTestimonials();
                  }, 2500);
                }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchTestimonials}>Try Again</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && testimonials.length === 0 && (
            <div className="text-center py-20">
              <Quote className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No reviews found</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share your experience!
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Cards */}
          {!loading && !error && testimonials.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((t, index) => (
                  <Card
                    key={t.id}
                    className="p-8 shadow-soft hover:shadow-elevated transition-all duration-300 border-0 animate-fade-in-up flex flex-col"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <Quote className="text-primary/30" size={36} />
                      <div className="flex flex-col items-end gap-1">
                        {t.featured && (
                          <Badge className="text-xs bg-secondary text-secondary-foreground">
                            Featured
                          </Badge>
                        )}
                        <StarRating rating={t.rating} size={16} />
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-muted-foreground leading-relaxed flex-1 mb-6 line-clamp-5">
                      "{t.content}"
                    </p>

                    {/* Reviewer info */}
                    <div className="pt-4 border-t flex items-center gap-3">
                      {t.avatar_url ? (
                        <img
                          src={t.avatar_url}
                          alt={t.name}
                          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[t.role, t.company].filter(Boolean).join(" · ")}
                        </p>
                        {(t.destination || t.tour_package) && (
                          <p className="text-xs text-primary mt-0.5 truncate">
                            {t.tour_package || t.destination}
                          </p>
                        )}
                      </div>
                      <p className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Testimonials;