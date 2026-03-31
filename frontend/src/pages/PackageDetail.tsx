// src/pages/PackageDetail.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Tag,
  Globe,
  Thermometer,
  XCircle,
} from "lucide-react";
import { packagesAPI, Package } from "@/api/packages";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDER = "https://via.placeholder.com/1200x600?text=Package";

// ── Component ─────────────────────────────────────────────────────────────────

const PackageDetail = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const identifier = slug || id;
  const navigate = useNavigate();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!identifier) {
      setError("No package specified.");
      setLoading(false);
      return;
    }
    fetchPackage();
  }, [identifier]);

  const fetchPackage = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Package;

      if (identifier && !isNaN(Number(identifier))) {
        // Numeric ID — use getById which also returns destinations_data
        data = await packagesAPI.getById(identifier);
      } else {
        // Slug — try slug endpoint first, fall back to ID
        try {
          data = await packagesAPI.getBySlug(identifier as string);
        } catch {
          data = await packagesAPI.getById(identifier as string);
        }
      }

      setPkg(data);
    } catch (err: any) {
      console.error("Error fetching package:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load package details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !pkg) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Package Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "The package you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/packages">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const displayPrice = pkg.discount_price ?? pkg.base_price;
  const hasDiscount =
    pkg.discount_price !== undefined && pkg.discount_price < pkg.base_price;
  const discountPct = hasDiscount
    ? Math.round(((pkg.base_price - pkg.discount_price!) / pkg.base_price) * 100)
    : 0;

  const itinerary = [...(pkg.itinerary || [])].sort((a, b) => a.day - b.day);
  const features = pkg.features || [];
  const tags = pkg.tags || [];
  const destinations = pkg.destinations_data || [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-20">

        {/* Hero */}
        <div className="relative h-[60vh] overflow-hidden">
          <img
            src={pkg.image_url || PLACEHOLDER}
            alt={pkg.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="container mx-auto">

              <Link to="/packages">
                <Button
                  variant="ghost"
                  className="mb-4 text-white hover:text-primary hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Packages
                </Button>
              </Link>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(pkg.popular || pkg.featured) && (
                  <Badge className="bg-secondary text-secondary-foreground">
                    Popular Choice
                  </Badge>
                )}
                {pkg.category && (
                  <Badge variant="outline" className="text-white border-white/50">
                    {pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1)}
                  </Badge>
                )}
                {pkg.difficulty && (
                  <Badge variant="outline" className="text-white border-white/50">
                    {pkg.difficulty}
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge className="bg-red-500 text-white">
                    {discountPct}% OFF
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-4">{pkg.title}</h1>

              <div className="flex flex-wrap items-center gap-6 text-lg">
                {pkg.duration && (
                  <div className="flex items-center gap-2">
                    <Clock size={20} />
                    <span>{pkg.duration}</span>
                  </div>
                )}
                {pkg.group_size && (
                  <div className="flex items-center gap-2">
                    <Users size={20} />
                    <span>{pkg.group_size}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Star className="fill-secondary text-secondary" size={20} />
                  <span>
                    {pkg.rating?.toFixed(1)} ({pkg.reviews} reviews)
                  </span>
                </div>
                {pkg.season && (
                  <div className="flex items-center gap-2">
                    <Thermometer size={20} />
                    <span>Best in {pkg.season}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left / Main ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-8">

              {/* Overview */}
              {pkg.description && (
                <Card className="shadow-soft">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-4">Overview</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {pkg.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Features / Highlights */}
              {features.length > 0 && (
                <Card className="shadow-soft">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">What's Included</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {features.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-3">
                          <CheckCircle2
                            className="text-primary flex-shrink-0 mt-1"
                            size={20}
                          />
                          <span className="text-muted-foreground">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Itinerary */}
              {itinerary.length > 0 && (
                <Card className="shadow-soft">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Day by Day Itinerary</h2>
                    <div className="space-y-6">
                      {itinerary.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                              {item.day}
                            </div>
                          </div>
                          <div className="flex-1 pb-6 border-b last:border-0">
                            <h3 className="text-xl font-semibold mb-2">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Destinations included */}
              {destinations.length > 0 && (
                <Card className="shadow-soft">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Destinations Covered</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {destinations.map((dest) => (
                        <Link
                          key={dest.id}
                          to={`/destination-detail/${dest.slug || dest.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          {dest.image_url && (
                            <img
                              src={dest.image_url}
                              alt={dest.title}
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <p className="font-semibold">{dest.title}</p>
                            {(dest.location || dest.country) && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin size={12} />
                                {[dest.location, dest.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Tag size={16} className="text-muted-foreground" />
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right / Sidebar ──────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <Card className="shadow-elevated sticky top-24">
                <CardContent className="p-6">

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      Price per person
                    </p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-4xl font-bold text-primary">
                        ${displayPrice.toLocaleString()}
                      </p>
                      {hasDiscount && (
                        <p className="text-lg text-muted-foreground line-through">
                          ${pkg.base_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        You save ${(pkg.base_price - displayPrice).toLocaleString()} ({discountPct}% off)
                      </p>
                    )}
                  </div>

                  {/* Quick facts */}
                  <div className="space-y-3 mb-6 text-muted-foreground">
                    {pkg.duration && (
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-primary flex-shrink-0" />
                        <span>{pkg.duration}</span>
                      </div>
                    )}
                    {pkg.group_size && (
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-primary flex-shrink-0" />
                        <span>{pkg.group_size}</span>
                      </div>
                    )}
                    {pkg.season && (
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-primary flex-shrink-0" />
                        <span>Best season: {pkg.season}</span>
                      </div>
                    )}
                    {pkg.difficulty && (
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-primary flex-shrink-0" />
                        <span>Difficulty: {pkg.difficulty}</span>
                      </div>
                    )}
                    {destinations.length > 0 && (
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-primary flex-shrink-0" />
                        <span>{destinations.map((d) => d.title).join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Rating summary */}
                  <div className="flex items-center gap-2 mb-6 p-3 bg-muted rounded-lg">
                    <Star className="fill-secondary text-secondary" size={18} />
                    <span className="font-bold">{pkg.rating?.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">
                      ({pkg.reviews} reviews)
                    </span>
                  </div>

                  {/* CTA buttons */}
                  <Button
                    size="lg"
                    className="w-full shadow-glow mb-3"
                    onClick={() => navigate("/book-now")}
                  >
                    Book Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/contact")}
                  >
                    Contact Us
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Free cancellation up to 30 days before departure
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PackageDetail;