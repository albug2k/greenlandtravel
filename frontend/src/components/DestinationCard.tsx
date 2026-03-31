// src/components/DestinationCard.tsx
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";

interface DestinationCardProps {
  id: string | number;
  image: string;
  title: string;
  description: string;
  tours: number;
  link: string;
}

const DestinationCard = ({ image, title, description, tours, link }: DestinationCardProps) => {
  return (
    <Link to={link}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{tours} tours available</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default DestinationCard;