// src/pages/DestinationDetail.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Star, Clock, Check, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { destinationsAPI, Destination } from "@/api/destinations";

// Define the destination detail interface
interface DestinationDetail {
  id: string | number;
  title: string;
  name?: string;
  slug?: string;
  image_url?: string;
  thumbnail_url?: string | null;
  description: string;
  location?: string;
  country?: string;
  continent?: string;
  best_time?: string;
  bestTime?: string;
  avg_temp?: string;
  avgTemp?: string;
  currency?: string;
  language?: string;
  visa_info?: string;
  visaInfo?: string;
  base_price?: number;
  basePrice?: number;
  featured?: boolean;
  popular?: boolean;
  views?: number;
  highlights?: Array<{ text: string; icon?: string }> | string[];
  gallery?: Array<{ image_url: string; caption?: string }> | string[];
  tours?: Array<{
    id: number;
    name: string;
    duration?: string;
    base_price: number;
    rating?: number;
    slug?: string;
  }>;
  tours_count?: number;
  toursCount?: number;
}

const DestinationDetail = () => {
  // Support both route patterns:
  //   /destination-detail/:slug   (used by DestinationCard links)
  //   /destination-detail/:id
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const destinationId = slug || id;

  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (destinationId) {
      fetchDestinationDetails();
    } else {
      setError("No destination ID or slug provided");
      setLoading(false);
    }
  }, [destinationId]);

  const fetchDestinationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching destination with ID/slug:", destinationId);
      let response: Destination;

      // Check if it's a numeric ID or a slug
      if (destinationId && !isNaN(Number(destinationId))) {
        // It's a numeric ID
        response = await destinationsAPI.getById(destinationId);
      } else {
        // It's a slug — try slug endpoint first, fall back to ID
        try {
          response = await destinationsAPI.getBySlug(destinationId as string);
        } catch (slugError) {
          console.log("Slug fetch failed, trying by ID:", slugError);
          response = await destinationsAPI.getById(destinationId as string);
        }
      }

      console.log("Fetched destination details:", response);

      // Transform the data to our component's format
      const transformedData: DestinationDetail = {
        id: response.id,
        title: response.title || response.name || "Destination",
        name: response.name,
        slug: response.slug,
        image_url: response.image_url || response.image,
        thumbnail_url: response.thumbnail_url,
        description: response.description,
        location: response.location || response.country,
        country: response.country,
        continent: response.continent,
        best_time: response.best_time || response.bestTime,
        avg_temp: response.avg_temp || response.avgTemp,
        currency: response.currency,
        language: response.language,
        visa_info: response.visa_info || response.visaInfo,
        base_price: response.base_price || response.basePrice,
        featured: response.featured,
        popular: response.popular,
        views: response.views,
        highlights: response.highlights || [],
        gallery: response.gallery || [],
        tours: (response as any).tours || [],
        tours_count: response.tours_count || response.toursCount,
      };

      setDestination(transformedData);
    } catch (err: any) {
      console.error("Error fetching destination details:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load destination details. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Contact for pricing";
    return `$${price.toLocaleString()}`;
  };

  const getImageUrl = (dest: DestinationDetail) => {
    return (
      dest.image_url ||
      dest.thumbnail_url ||
      "https://via.placeholder.com/1200x600?text=Destination"
    );
  };

  const getGalleryImages = () => {
    if (!destination?.gallery || destination.gallery.length === 0) {
      return [
        { image_url: getImageUrl(destination!) },
        { image_url: getImageUrl(destination!) },
        { image_url: getImageUrl(destination!) },
        { image_url: getImageUrl(destination!) },
      ];
    }
    return destination.gallery.map((item) => {
      if (typeof item === "string") {
        return { image_url: item };
      }
      return item;
    });
  };

  const getHighlights = () => {
    if (!destination?.highlights || destination.highlights.length === 0) {
      return [
        { text: "Scenic beauty" },
        { text: "Cultural experiences" },
        { text: "Local cuisine" },
        { text: "Guided tours" },
        { text: "Accommodation included" },
        { text: "24/7 support" },
      ];
    }
    return destination.highlights.map((item) => {
      if (typeof item === "string") {
        return { text: item };
      }
      return item;
    });
  };

  const getTours = () => {
    return destination?.tours || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <h2 className="text-2xl font-bold mb-4">Destination Not Found</h2>
          <p className="text-muted-foreground mb-8">
            {error || "The destination you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/destinations">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Destinations
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const gallery = getGalleryImages();
  const highlights = getHighlights();
  const tours = getTours();
  const destinationName = destination.title || destination.name || "Destination";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={getImageUrl(destination)}
          alt={destinationName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/1200x600?text=Destination";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link to="/destinations">
              <Button variant="ghost" className="mb-4 text-white hover:text-primary hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Destinations
              </Button>
            </Link>
            <h1 className="text-4xl md:text-5xl bg-[#8f6767] font-bold text-white mb-2">
              {destinationName}
            </h1>
            <div className="flex items-center bg-[#8f6767] gap-2 text-white/80">
              <MapPin className="w-5 h-5" />
              <span>
                {destination.location ||
                  destination.country ||
                  destination.continent ||
                  "Popular Destination"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-4">About This Destination</h2>
              <p className="text-foreground/80 text-lg leading-relaxed">{destination.description}</p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">Highlights</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground/80">{highlight.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">Photo Gallery</h2>
              <div className="grid grid-cols-2 gap-4">
                {gallery.slice(0, 4).map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={img.image_url}
                      alt={`${destinationName} ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/600x400?text=Gallery+Image";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Available Tours */}
            {tours.length > 0 && (
              <div className="bg-card rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-foreground mb-6">Available Tours</h2>
                <div className="space-y-4">
                  {tours.map((tour, index) => (
                    <Card key={tour.id || index} className="bg-muted/50 border-0">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground">{tour.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {tour.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {tour.duration}
                                </span>
                              )}
                              {tour.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  {tour.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-primary">
                              {formatPrice(tour.base_price)}
                            </span>
                            <Link to={`/tour-detail/${tour.slug || tour.id}`}>
                              <Button size="sm">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Facts</h3>
                <div className="space-y-4">
                  {destination.best_time && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Best Time to Visit</p>
                        <p className="font-medium text-foreground">{destination.best_time}</p>
                      </div>
                    </div>
                  )}
                  {destination.avg_temp && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-primary flex items-center justify-center flex-shrink-0">🌡️</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average Temperature</p>
                        <p className="font-medium text-foreground">{destination.avg_temp}</p>
                      </div>
                    </div>
                  )}
                  {destination.currency && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-primary flex items-center justify-center flex-shrink-0">💰</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Currency</p>
                        <p className="font-medium text-foreground">{destination.currency}</p>
                      </div>
                    </div>
                  )}
                  {destination.language && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-primary flex items-center justify-center flex-shrink-0">🗣️</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Language</p>
                        <p className="font-medium text-foreground">{destination.language}</p>
                      </div>
                    </div>
                  )}
                  {destination.visa_info && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-primary flex items-center justify-center flex-shrink-0">🛂</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Visa Information</p>
                        <p className="font-medium text-foreground">{destination.visa_info}</p>
                      </div>
                    </div>
                  )}
                  {destination.base_price && (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-primary flex items-center justify-center flex-shrink-0">🏷️</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Starting From</p>
                        <p className="font-medium text-foreground">{formatPrice(destination.base_price)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-lg">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Ready to Explore?</h3>
                <p className="text-primary-foreground/80 mb-4">
                  Book your trip to {destinationName.split(",")[0]} today!
                </p>
                <Link to="/book-now">
                  <Button variant="secondary" className="w-full">
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DestinationDetail;