import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState, useEffect } from "react";

interface Offer {
  id: string;
  title: string;
  isActive: boolean;
}

export function OffersHeader() {
  const [activeOffersCount, setActiveOffersCount] = useState(0);

  useEffect(() => {
    fetchActiveOffersCount();
  }, []);

  const fetchActiveOffersCount = async () => {
    try {
      const response = await fetch('/api/content/public/offers');
      if (response.ok) {
        const offers: Offer[] = await response.json();
        const activeOffers = offers.filter(offer => offer.isActive);
        setActiveOffersCount(activeOffers.length);
      }
    } catch (error) {
      console.error('Failed to fetch offers count:', error);
    }
  };

  return (
    <Link href="/offers">
      <Button variant="ghost" size="sm" className="relative">
        <Gift className="h-5 w-5" />
        <span className="ml-2 hidden sm:inline">Offers</span>
        {activeOffersCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {activeOffersCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}