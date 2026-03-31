// src/pages/Gallery.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Camera, Loader2, Search, X, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { galleryAPI, GalleryItem } from "@/api/gallery";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDER = "https://via.placeholder.com/800x600?text=Gallery";

const getCoverImage = (item: GalleryItem): string => {
  if (item.images && item.images.length > 0) {
    return item.images[0].image_url;
  }
  return PLACEHOLDER;
};

// ── Component ─────────────────────────────────────────────────────────────────

const Gallery = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [showFeatured, setShowFeatured] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 12;

  // ── Fetch filter options on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchFilters = async () => {
      const [cats, locs] = await Promise.all([
        galleryAPI.getCategories(),
        galleryAPI.getLocations(),
      ]);
      setCategories(cats);
      setLocations(locs);
    };
    fetchFilters();
  }, []);

  // ── Fetch gallery items ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: LIMIT,
          sort_by: sortBy,
        };
        if (activeSearch) params.search = activeSearch;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedLocation) params.location = selectedLocation;
        if (showFeatured) params.featured = true;

        const response = await galleryAPI.getAll(params);
        setGalleryItems(response.items);
        setTotalPages(response.pages || 1);
      } catch (err) {
        console.error("Error fetching gallery:", err);
        setError("Failed to load gallery. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [currentPage, activeSearch, selectedCategory, selectedLocation, sortBy, showFeatured]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedLocation("");
    setSortBy("created_at");
    setShowFeatured(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    activeSearch || selectedCategory || selectedLocation || showFeatured;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Camera size={32} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Travel Gallery</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-white/90">
            Explore stunning moments captured from around the world
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-gray-50 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search gallery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-20"
                />
                <Button type="submit" size="sm" className="absolute right-1 top-1">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Category */}
            <div className="w-full lg:w-44">
              <Select
                value={selectedCategory || "all"}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            {locations.length > 0 && (
              <div className="w-full lg:w-44">
                <Select
                  value={selectedLocation || "all"}
                  onValueChange={handleLocationChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort */}
            <div className="w-full lg:w-40">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Latest</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured toggle */}
            <Button
              variant={showFeatured ? "default" : "outline"}
              onClick={() => {
                setShowFeatured((v) => !v);
                setCurrentPage(1);
              }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Featured
            </Button>

            {/* Clear */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-background">
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
              <Button onClick={() => setCurrentPage((p) => p)}>Try Again</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && galleryItems.length === 0 && (
            <div className="text-center py-20">
              <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No photos found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters to find what you're looking for.
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && galleryItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryItems.map((item, index) => (
                  <Link
                    to={`/gallery-detail/${item.slug || item.id}`}
                    key={item.id}
                    className="group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <img
                      src={getCoverImage(item)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div className="text-white">
                        <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                        <p className="text-sm text-white/80">
                          {item.category || item.location || item.country || ""}
                        </p>
                        {item.images.length > 1 && (
                          <p className="text-xs text-white/60 mt-1">
                            {item.images.length} photos
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Featured badge */}
                    {item.featured && (
                      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                        Featured
                      </div>
                    )}
                  </Link>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
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

export default Gallery;