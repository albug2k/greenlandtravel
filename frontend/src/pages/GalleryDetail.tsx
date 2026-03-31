// src/pages/GalleryDetail.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Tag,
  Images,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { galleryAPI, GalleryItem, GalleryImage } from "@/api/gallery";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLACEHOLDER = "https://via.placeholder.com/1200x800?text=Gallery+Image";

// ── Lightbox ──────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }: LightboxProps) => {
  const img = images[currentIndex];

  // Close on Escape, navigate with arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-5xl max-h-[85vh] px-16" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.image_url}
          alt={img.caption || "Gallery image"}
          className="max-h-[80vh] max-w-full object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        {img.caption && (
          <p className="text-white/70 text-center mt-3 text-sm">{img.caption}</p>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next image"
        >
          <ChevronRight className="h-10 w-10" />
        </button>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const GalleryDetail = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const identifier = slug || id;

  const [gallery, setGallery] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!identifier) {
      setError("No gallery item specified.");
      setLoading(false);
      return;
    }
    fetchGallery();
  }, [identifier]);

  const fetchGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: GalleryItem;

      if (identifier && !isNaN(Number(identifier))) {
        data = await galleryAPI.getById(identifier);
      } else {
        try {
          data = await galleryAPI.getBySlug(identifier as string);
        } catch {
          data = await galleryAPI.getById(identifier as string);
        }
      }

      setGallery(data);
    } catch (err: any) {
      console.error("Error fetching gallery detail:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load gallery item. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Lightbox helpers ─────────────────────────────────────────────────────
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + (gallery?.images.length ?? 1)) % (gallery?.images.length ?? 1) : 0
    );
  const nextImage = () =>
    setLightboxIndex((i) =>
      i !== null ? (i + 1) % (gallery?.images.length ?? 1) : 0
    );

  // ── Loading ──────────────────────────────────────────────────────────────
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

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Gallery Item Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "The gallery item you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/gallery">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const coverImage =
    gallery.images.length > 0 ? gallery.images[0].image_url : PLACEHOLDER;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Lightbox */}
      {lightboxIndex !== null && gallery.images.length > 0 && (
        <Lightbox
          images={gallery.images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      {/* Hero */}
      <div className="relative h-[55vh] overflow-hidden">
        <img
          src={coverImage}
          alt={gallery.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Link to="/gallery">
              <Button
                variant="ghost"
                className="mb-4 text-white hover:text-primary hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gallery
              </Button>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {gallery.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              {(gallery.location || gallery.country) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {[gallery.location, gallery.country].filter(Boolean).join(", ")}
                </span>
              )}
              {gallery.category && (
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {gallery.category}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Images className="w-4 h-4" />
                {gallery.images.length} photo{gallery.images.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">

        {/* Description */}
        {gallery.description && (
          <div className="max-w-3xl mb-12">
            <h2 className="text-2xl font-bold mb-4">About This Collection</h2>
            <p className="text-foreground/80 text-lg leading-relaxed">
              {gallery.description}
            </p>
          </div>
        )}

        {/* Featured badge */}
        {gallery.featured && (
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full mb-8">
            ★ Featured Collection
          </div>
        )}

        {/* Photo Grid */}
        {gallery.images.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Photo Collection
              <span className="text-muted-foreground text-base font-normal ml-2">
                ({gallery.images.length} images)
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => openLightbox(index)}
                  className="group relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={img.image_url}
                    alt={img.caption || `${gallery.title} photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER;
                    }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Images className="text-white h-8 w-8" />
                  </div>
                  {/* Caption */}
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm">{img.caption}</p>
                    </div>
                  )}
                  {/* Index badge */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {index + 1} / {gallery.images.length}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-muted-foreground text-sm text-center mt-6">
              Click any photo to view full size
            </p>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Images className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No images available for this gallery.</p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-12">
          <Link to="/gallery">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GalleryDetail;