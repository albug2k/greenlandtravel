//src/pages/BlogDetail.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, ArrowLeft, Share2, Heart, Loader2 } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { blogsAPI, Blog } from "@/api/blogs";

// Extended Blog interface
interface ExtendedBlog extends Omit<Blog, 'content' | 'excerpt'> {
  image_url?: string;
  thumbnail_url?: string | null;
  read_time?: string;
  views?: number;
  slug?: string;
  author_avatar?: string | null;
  content?: string;
  excerpt?: string;
  published_at?: string;
  tags?: string[];
}

const BlogDetail = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("id");
  
  // Use param id first, then query id
  const blogId = paramId || queryId;
  
  const [blog, setBlog] = useState<ExtendedBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<ExtendedBlog[]>([]);

  useEffect(() => {
    if (blogId) {
      fetchBlogDetails();
    } else {
      setError("No blog ID provided");
      setLoading(false);
    }
  }, [blogId]);

  const fetchBlogDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching blog with ID:', blogId);
      
      // Try to fetch by slug if id is not a number, otherwise by id
      let blogData;
      if (blogId && isNaN(Number(blogId))) {
        // It's a slug
        blogData = await blogsAPI.getBySlug(blogId);
      } else {
        // It's an ID
        blogData = await blogsAPI.getById(blogId as string);
      }
      
      console.log('Fetched blog details:', blogData);
      setBlog(blogData);

      // Fetch related blogs based on category
      if (blogData.category) {
        const relatedResponse = await blogsAPI.getAll({
          category: blogData.category,
          limit: 3
        });
        
        // Filter out current blog from related blogs
        const filtered = relatedResponse.blogs.filter(b => b.id !== blogData.id);
        setRelatedBlogs(filtered.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching blog details:", err);
      setError("Failed to load blog post. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getImageUrl = (blog: ExtendedBlog) => {
    return blog.image_url || blog.thumbnail_url || blog.image || "https://via.placeholder.com/1200x600?text=Travel+Blog";
  };

  const getReadTime = (blog: ExtendedBlog) => {
    return blog.read_time || blog.readTime || "5 min read";
  };

  const parseContent = (content?: string) => {
    if (!content) return [];
    
    const paragraphs = content.split('\n\n');
    return paragraphs.map(para => {
      if (para.startsWith('# ')) {
        return { type: 'h1', content: para.substring(2) };
      } else if (para.startsWith('## ')) {
        return { type: 'h2', content: para.substring(3) };
      } else if (para.startsWith('### ')) {
        return { type: 'h3', content: para.substring(4) };
      } else if (para.startsWith('**') && para.endsWith('**')) {
        return { type: 'bold', content: para.replace(/\*\*/g, '') };
      } else if (para.includes('\n- ')) {
        const items = para.split('\n- ').filter(item => item.trim());
        return { type: 'list', items };
      } else {
        return { type: 'paragraph', content: para };
      }
    });
  };

  const renderContent = () => {
    if (!blog?.content) return <p className="text-muted-foreground italic">No content available</p>;

    const parsedContent = parseContent(blog.content);

    return parsedContent.map((block, index) => {
      switch (block.type) {
        case 'h1':
          return (
            <h1 key={index} className="text-3xl font-bold text-foreground mt-8 mb-4">
              {block.content}
            </h1>
          );
        case 'h2':
          return (
            <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">
              {block.content}
            </h2>
          );
        case 'h3':
          return (
            <h3 key={index} className="text-xl font-bold text-foreground mt-6 mb-3">
              {block.content}
            </h3>
          );
        case 'bold':
          return (
            <p key={index} className="mb-4 font-bold text-foreground">
              {block.content}
            </p>
          );
        case 'list':
          return (
            <ul key={index} className="list-disc pl-6 mb-4 space-y-2">
              {(block.items as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        default:
          return (
            <p key={index} className="mb-4 leading-relaxed">
              {block.content}
            </p>
          );
      }
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        text: blog?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
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

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-4">Oops! Page not found</h2>
          <p className="text-muted-foreground mb-8">
            {error || "The blog post you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img 
          src={getImageUrl(blog)} 
          alt={blog.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/1200x600?text=Image+Not+Found";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/blogs">
            <Button variant="ghost" className="mb-6 text-white hover:text-primary hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>

          <div className="bg-card rounded-2xl p-8 shadow-xl">
            {blog.category && (
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                {blog.category}
              </span>
            )}
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8 pb-8 border-b border-border">
              {blog.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{blog.author}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.published_at || blog.date || blog.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{getReadTime(blog)}</span>
              </div>
              {blog.views !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span>{blog.views} views</span>
                </div>
              )}
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none text-foreground/80">
              {blog.excerpt && (
                <div className="italic text-lg mb-6 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                  {blog.excerpt}
                </div>
              )}
              {renderContent()}
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/blogs?tag=${tag}`}
                      className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Social Actions */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Like
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              <Link to="/blogs">
                <Button variant="default">More Articles</Button>
              </Link>
            </div>
          </div>

          {/* Related Blogs */}
          {relatedBlogs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Link
                    key={relatedBlog.id}
                    to={`/blog-detail/${relatedBlog.slug || relatedBlog.id}`}
                    className="group"
                  >
                    <div className="bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-40 overflow-hidden">
                        <img
                          src={getImageUrl(relatedBlog)}
                          alt={relatedBlog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Travel+Blog";
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedBlog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {relatedBlog.excerpt || relatedBlog.content?.substring(0, 100) + "..."}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(relatedBlog.published_at || relatedBlog.date || relatedBlog.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogDetail;