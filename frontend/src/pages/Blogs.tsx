//src/pages/Blogs.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, User, ArrowRight, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { blogsAPI, Blog } from "@/api/blogs";

// Extend the Blog interface to match your data structure
interface ExtendedBlog extends Blog {
  image_url?: string;
  thumbnail_url?: string | null;
  read_time?: string;
  views?: number;
  slug?: string;
  author_avatar?: string | null;
}

const Blogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState<ExtendedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const cats = await blogsAPI.getCategories();
      console.log('Categories:', cats);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update URL params
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", currentPage.toString());
      setSearchParams(params);

      const response = await blogsAPI.getAll({
        page: currentPage,
        limit: 9,
        category: selectedCategory || undefined,
      });
      
      console.log('Fetched blogs response:', response); // Debug log
      
      // Filter blogs based on search query if needed
      let filteredBlogs = response.blogs;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredBlogs = response.blogs.filter(blog => 
          blog.title.toLowerCase().includes(query) ||
          (blog.excerpt && blog.excerpt.toLowerCase().includes(query)) ||
          (blog.content && blog.content.toLowerCase().includes(query)) ||
          (blog.author && blog.author.toLowerCase().includes(query)) ||
          (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }

      setBlogs(filteredBlogs);
      setTotalPages(response.pages || 1);
    } catch (err) {
      setError("Failed to load blog posts. Please try again later.");
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlogs();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageUrl = (blog: ExtendedBlog) => {
    return blog.image_url || blog.thumbnail_url || blog.image || "https://via.placeholder.com/800x600?text=Travel+Blog";
  };

  const getReadTime = (blog: ExtendedBlog) => {
    return blog.read_time || blog.readTime || "5 min read";
  };

  // If loading and no blogs, show loading
  if (loading && blogs.length === 0) {
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
            <BookOpen size={32} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Travel Blog
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-white/90">
            Stories, tips, and inspiration from around the world
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 max-w-7xl mx-auto">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>

            {/* Category Filter */}
            <select
              value={selectedCategory || "all"}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchBlogs}>Try Again</Button>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {blogs.map((blog, index) => (
                  <Card 
                    key={blog.id} 
                    className="overflow-hidden hover:shadow-elevated transition-shadow duration-300 animate-fade-in" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={getImageUrl(blog)} 
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
                        }}
                      />
                      {blog.category && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                            {blog.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <h3 className="text-xl font-bold mb-3 line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-3">
                        {blog.excerpt || (blog.content ? blog.content.substring(0, 150) + "..." : "No description available")}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {blog.author && (
                          <div className="flex items-center gap-1">
                            <User size={16} />
                            <span>{blog.author}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{formatDate()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen size={16} />
                          <span>{getReadTime(blog)}</span>
                        </div>
                      </div>
                      <Link to={`/blog-detail/${blog.slug || blog.id}`}>
                        <Button variant="outline" className="w-full group">
                          Read More
                          <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
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

export default Blogs;