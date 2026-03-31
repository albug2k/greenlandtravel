// src/components/PackageCard.tsx
import { Clock, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const PLACEHOLDER = "https://via.placeholder.com/800x600?text=Package";

interface PackageCardProps {
  id?: number | string;
  slug?: string;
  image: string;
  title: string;
  duration?: string;
  groupSize?: string;
  // Accept either a pre-formatted string (legacy from Index.tsx) or a number (new API)
  price?: string;
  basePrice?: number;
  discountPrice?: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  popular?: boolean;
  category?: string;
  tags?: string[];
}

const PackageCard = ({
  id,
  slug,
  image,
  title,
  duration,
  groupSize,
  price,         // legacy string e.g. "$2,499" — passed by Index.tsx
  basePrice,     // numeric — passed by Packages.tsx
  discountPrice,
  rating,
  reviews,
  featured = false,
  popular = false,
  category,
}: PackageCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (slug || id) {
      navigate(`/package-detail/${slug || id}`);
    } else {
      navigate("/packages");
    }
  };

  // Resolve display price safely — handles both old string and new numeric props
  const resolveDisplayPrice = (): string => {
    if (discountPrice != null) return `$${discountPrice.toLocaleString()}`;
    if (basePrice != null) return `$${basePrice.toLocaleString()}`;
    if (price) return price; // already formatted string
    return "—";
  };

  const resolveOriginalPrice = (): string | null => {
    if (discountPrice != null && basePrice != null && discountPrice < basePrice) {
      return `$${basePrice.toLocaleString()}`;
    }
    return null;
  };

  const discountPct =
    discountPrice != null && basePrice != null && discountPrice < basePrice
      ? Math.round(((basePrice - discountPrice) / basePrice) * 100)
      : null;

  const displayPrice = resolveDisplayPrice();
  const originalPrice = resolveOriginalPrice();

  return (
    <Card className="group overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-500 border-0 animate-fade-in">
      <div className="relative h-56 overflow-hidden">
        <img
          src={image || PLACEHOLDER}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {(popular || featured) && (
            <Badge className="bg-secondary text-secondary-foreground">
              Popular
            </Badge>
          )}
          {category && (
            <Badge variant="outline" className="bg-white/80 text-foreground text-xs">
              {category}
            </Badge>
          )}
        </div>

        {/* Discount ribbon */}
        {discountPct !== null && (
          <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {discountPct}% OFF
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-6">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="fill-secondary text-secondary" size={16} />
          <span className="font-semibold">
            {typeof rating === "number" ? rating.toFixed(1) : rating ?? "—"}
          </span>
          <span className="text-muted-foreground text-sm">({reviews ?? 0} reviews)</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
          {duration && (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{duration}</span>
            </div>
          )}
          {groupSize && (
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{groupSize}</span>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <span className="text-sm text-muted-foreground">From</span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-primary">{displayPrice}</p>
              {originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </p>
              )}
            </div>
          </div>
          <Button className="shadow-soft" onClick={handleViewDetails}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PackageCard;