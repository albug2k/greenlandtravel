// src/components/TestimonialsSection.tsx
import { useState, useEffect } from "react";
import { Star, Quote, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { testimonialsAPI, Testimonial } from "@/api/testimonials";

// ── Fallback static data (shown only if API returns nothing) ──────────────────

const STATIC_TESTIMONIALS = [
  {
    id: -1,
    name: "Sarah Johnson",
    company: "New York, USA",
    content:
      "An absolutely magical experience! The team made our honeymoon in Bali unforgettable. Every detail was perfect, from the accommodations to the guided tours.",
    rating: 5,
    tour_package: "Bali Paradise Package",
    featured: false,
    verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: -2,
    name: "Michael Chen",
    company: "Singapore",
    content:
      "I've traveled with many companies, but none compare to the personalized service and attention to detail. The Swiss Alps tour exceeded all expectations!",
    rating: 5,
    tour_package: "Alpine Adventure",
    featured: false,
    verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: -3,
    name: "Emma Williams",
    company: "London, UK",
    content:
      "Our family safari in Kenya was the trip of a lifetime. The guides were knowledgeable, and every moment was filled with wonder. Can't wait to book our next adventure!",
    rating: 5,
    tour_package: "Kenya Safari Experience",
    featured: false,
    verified: true,
    created_at: new Date().toISOString(),
  },
] as Testimonial[];

// ── Component ─────────────────────────────────────────────────────────────────

const TestimonialsSection = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Try featured first (faster, focused endpoint)
        const featured = await testimonialsAPI.getFeatured();
        if (featured.length > 0) {
          setTestimonials(featured.slice(0, 3));
        } else {
          // Fall back to general list if no featured ones exist
          const { testimonials: all } = await testimonialsAPI.getAll({
            sort_by: "rating",
            limit: 3,
          });
          setTestimonials(all.length > 0 ? all : STATIC_TESTIMONIALS);
        }
      } catch {
        // If API fails, show static data so homepage never breaks
        setTestimonials(STATIC_TESTIMONIALS);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our Travelers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of happy travelers who trusted us with their dream
            vacations
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <Card
                key={t.id}
                className="p-8 shadow-soft hover:shadow-elevated transition-all duration-300 border-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Quote className="text-primary mb-4" size={40} />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={
                        i < Math.round(t.rating)
                          ? "fill-secondary text-secondary"
                          : "text-muted-foreground"
                      }
                    />
                  ))}
                </div>

                {/* Review */}
                <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-4">
                  "{t.content}"
                </p>

                {/* Reviewer */}
                <div className="pt-4 border-t flex items-center gap-3">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[t.role, t.company].filter(Boolean).join(" · ")}
                    </p>
                    {(t.tour_package || t.destination) && (
                      <p className="text-sm text-primary mt-1">
                        {t.tour_package || t.destination}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* View all link */}
        {!loading && (
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/testimonials")}
            >
              Read All Reviews
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;