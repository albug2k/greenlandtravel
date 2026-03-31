//src/pages/Destinations.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DestinationCard from "@/components/DestinationCard";
import { MapPin, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { destinationsAPI, Destination } from "@/api/destinations";
import { useSearchParams } from "react-router-dom";

// Extended interface to match backend data
interface ExtendedDestination extends Omit<Destination, 'image'> {
  image_url?: string;
  thumbnail_url?: string | null;
  slug?: string;
  views?: number;
  base_price?: number;
  avg_temp?: string;
  currency?: string;
  language?: string;
  visa_info?: string;
  location?: string;
  best_time?: string;
  tours_count?: number;
  image?: string; // Keep for compatibility
}

const Destinations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinations, setDestinations] = useState<ExtendedDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [continents, setContinents] = useState<string[]>([]);
  
  // Filter states
  const [selectedContinent, setSelectedContinent] = useState<string>(
    searchParams.get("continent") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort_by") || "created_at"
  );
  const [showFeatured, setShowFeatured] = useState<boolean>(
    searchParams.get("featured") === "true"
  );
  const [showPopular, setShowPopular] = useState<boolean>(
    searchParams.get("popular") === "true"
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("min_price")) || 0,
    Number(searchParams.get("max_price")) || 10000
  ]);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  useEffect(() => {
    fetchContinents();
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [currentPage, selectedContinent, searchQuery, sortBy, showFeatured, showPopular, priceRange]);

  const fetchContinents = async () => {
    try {
      const conts = await destinationsAPI.getContinents();
      setContinents(conts);
    } catch (err) {
      console.error("Failed to fetch continents:", err);
    }
  };

  const fetchDestinations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update URL params
      const params = new URLSearchParams();
      if (selectedContinent) params.set("continent", selectedContinent);
      if (searchQuery) params.set("search", searchQuery);
      if (sortBy) params.set("sort_by", sortBy);
      if (showFeatured) params.set("featured", "true");
      if (showPopular) params.set("popular", "true");
      params.set("min_price", priceRange[0].toString());
      params.set("max_price", priceRange[1].toString());
      params.set("page", currentPage.toString());
      setSearchParams(params);

      const response = await destinationsAPI.getAll({
        page: currentPage,
        limit: 12,
        continent: selectedContinent || undefined,
        featured: showFeatured || undefined,
        popular: showPopular || undefined,
      });
      
      console.log('Fetched destinations:', response);
      
      // Apply client-side filters for search and price
      let filteredDestinations = response.destinations as ExtendedDestination[];
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredDestinations = filteredDestinations.filter(dest => 
          dest.title?.toLowerCase().includes(query) ||
          dest.name?.toLowerCase().includes(query) ||
          dest.description?.toLowerCase().includes(query) ||
          dest.location?.toLowerCase().includes(query) ||
          dest.country?.toLowerCase().includes(query)
        );
      }
      
      // Price filter
      filteredDestinations = filteredDestinations.filter(dest => 
        (dest.base_price || 0) >= priceRange[0] && 
        (dest.base_price || 0) <= priceRange[1]
      );

      // Update max price for slider
      const prices = filteredDestinations.map(d => d.base_price || 0);
      if (prices.length > 0) {
        setMaxPrice(Math.max(...prices, 10000));
      }

      setDestinations(filteredDestinations);
      setTotalPages(response.pages);
    } catch (err) {
      setError("Failed to load destinations. Please try again later.");
      console.error("Error fetching destinations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinentChange = (value: string) => {
    setSelectedContinent(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDestinations();
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSelectedContinent("");
    setSearchQuery("");
    setSortBy("created_at");
    setShowFeatured(false);
    setShowPopular(false);
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const getImageUrl = (destination: ExtendedDestination) => {
    return destination.image_url || destination.thumbnail_url || destination.image || "https://via.placeholder.com/800x600?text=Destination";
  };

  const getToursCount = (destination: ExtendedDestination) => {
    return destination.tours_count || destination.toursCount || 0;
  };

  const getDestinationName = (destination: ExtendedDestination) => {
    return destination.title || destination.name || "Destination";
  };

  if (loading && destinations.length === 0) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <MapPin size={32} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Explore Our Destinations
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-white/90">
            From tropical beaches to mountain peaks, discover the world's most breathtaking locations
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-gray-50 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-20"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="absolute right-1 top-1"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Continent Filter */}
            <div className="w-full lg:w-48">
              <Select
                value={selectedContinent || "all"}
                onValueChange={handleContinentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Continents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Continents</SelectItem>
                  {continents.map((continent) => (
                    <SelectItem key={continent} value={continent}>
                      {continent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="w-full lg:w-40">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Latest</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="-price">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:w-auto">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Destinations</SheetTitle>
                  <SheetDescription>
                    Narrow down your destination options
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Featured filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="featured" 
                      checked={showFeatured}
                      onCheckedChange={(checked) => setShowFeatured(checked as boolean)}
                    />
                    <Label htmlFor="featured">Show Featured Only</Label>
                  </div>

                  {/* Popular filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="popular" 
                      checked={showPopular}
                      onCheckedChange={(checked) => setShowPopular(checked as boolean)}
                    />
                    <Label htmlFor="popular">Show Popular Only</Label>
                  </div>

                  {/* Price range */}
                  <div className="space-y-4">
                    <Label>Price Range (per person)</Label>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={100}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>

                  <SheetClose asChild>
                    <Button className="w-full">Apply Filters</Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchDestinations}>Try Again</Button>
            </div>
          ) : destinations.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No destinations found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters to find what you're looking for.
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {destinations.map((destination, index) => (
                  <DestinationCard 
                    key={destination.id} 
                    id={destination.id}
                    image={getImageUrl(destination)}
                    title={getDestinationName(destination)}
                    description={destination.description || "Discover this amazing destination"}
                    tours={getToursCount(destination)}
                    link={`/destination-detail/${destination.slug || destination.id}`}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
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

export default Destinations;