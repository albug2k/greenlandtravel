// src/pages/Packages.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PackageCard from "@/components/PackageCard";
import {
  Package,
  Loader2,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { packagesAPI, Package as TPackage } from "@/api/packages";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDER = "https://via.placeholder.com/800x600?text=Package";

const DIFFICULTY_OPTIONS = ["Easy", "Moderate", "Challenging", "Expert"];
const SEASON_OPTIONS = ["Spring", "Summer", "Autumn", "Winter", "Year-round"];

// ── Component ─────────────────────────────────────────────────────────────────

const Packages = () => {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [packages, setPackages] = useState<TPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [showFeatured, setShowFeatured] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState("created_at");

  const LIMIT = 9;

  // ── Fetch categories on mount ───────────────────────────────────────────────
  useEffect(() => {
    packagesAPI.getCategories().then(setCategories).catch(console.error);
  }, []);

  // ── Fetch packages ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPackages();
  }, [
    currentPage,
    activeSearch,
    selectedCategory,
    selectedDifficulty,
    selectedSeason,
    showFeatured,
    showPopular,
    priceRange,
    sortBy,
  ]);

  const fetchPackages = async () => {
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
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedSeason) params.season = selectedSeason;
      if (showFeatured) params.featured = true;
      if (showPopular) params.popular = true;
      if (priceRange[0] > 0) params.min_price = priceRange[0];
      if (priceRange[1] < maxPrice) params.max_price = priceRange[1];

      const response = await packagesAPI.getAll(params);
      setPackages(response.packages);
      setTotalPages(response.pages || 1);

      // Update max price slider from fetched data
      const prices = response.packages.map((p) => p.base_price);
      if (prices.length > 0) {
        setMaxPrice(Math.max(...prices, 10000));
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
      setError("Failed to load packages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSelectedSeason("");
    setShowFeatured(false);
    setShowPopular(false);
    setPriceRange([0, maxPrice]);
    setSortBy("created_at");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    activeSearch ||
    selectedCategory ||
    selectedDifficulty ||
    selectedSeason ||
    showFeatured ||
    showPopular ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Package size={32} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Travel Packages</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-white/90">
            Handcrafted journeys designed to create memories that last a lifetime
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="py-6 bg-gray-50 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search packages..."
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
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full lg:w-44">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Latest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced filters sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:w-auto">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Packages</SheetTitle>
                  <SheetDescription>
                    Narrow down your perfect travel package
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Featured */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={showFeatured}
                      onCheckedChange={(v) => setShowFeatured(v as boolean)}
                    />
                    <Label htmlFor="featured">Featured Only</Label>
                  </div>

                  {/* Popular */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="popular"
                      checked={showPopular}
                      onCheckedChange={(v) => setShowPopular(v as boolean)}
                    />
                    <Label htmlFor="popular">Popular Only</Label>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={selectedDifficulty || "all"}
                      onValueChange={(v) => {
                        setSelectedDifficulty(v === "all" ? "" : v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Difficulty</SelectItem>
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d.toLowerCase()}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Season */}
                  <div className="space-y-2">
                    <Label>Season</Label>
                    <Select
                      value={selectedSeason || "all"}
                      onValueChange={(v) => {
                        setSelectedSeason(v === "all" ? "" : v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any season" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Season</SelectItem>
                        {SEASON_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s.toLowerCase()}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price range */}
                  <div className="space-y-4">
                    <Label>Price Range (per person)</Label>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={100}
                      value={priceRange}
                      onValueChange={(v) => setPriceRange(v as [number, number])}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0].toLocaleString()}</span>
                      <span>${priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    Clear All Filters
                  </Button>

                  <SheetClose asChild>
                    <Button className="w-full">Apply Filters</Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

            {/* Clear shortcut */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Packages Grid */}
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
              <Button onClick={fetchPackages}>Try Again</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && packages.length === 0 && (
            <div className="text-center py-20">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No packages found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters to find the perfect package.
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && packages.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    id={pkg.id}
                    slug={pkg.slug}
                    image={pkg.image_url || PLACEHOLDER}
                    title={pkg.title}
                    duration={pkg.duration}
                    groupSize={pkg.group_size}
                    basePrice={pkg.base_price}
                    discountPrice={pkg.discount_price}
                    rating={pkg.rating}
                    reviews={pkg.reviews}
                    featured={pkg.featured}
                    popular={pkg.popular}
                    category={pkg.category}
                    tags={pkg.tags}
                  />
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

export default Packages;