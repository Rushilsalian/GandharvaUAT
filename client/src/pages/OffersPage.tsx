import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  validFrom: string;
  validTo: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  mediaType: 'image' | 'video' | 'text';
  mediaUrl: string;
  thumbnailUrl: string;
  displayOrder: number;
  isActive: boolean;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-scroll offers every 5 seconds
    if (offers.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % offers.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [offers.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersRes, contentRes] = await Promise.all([
        fetch('/api/content/public/offers'),
        fetch('/api/content/public/content')
      ]);

      if (offersRes.ok) {
        const offersData = await offersRes.json();
        console.log('Offers data received:', offersData);
        setOffers(offersData);
      } else {
        console.error('Offers fetch failed:', offersRes.status, offersRes.statusText);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        console.log('Content data received:', contentData);
        console.log('Setting all content items:', contentData);
        setContentItems(contentData);
      } else {
        console.error('Content fetch failed:', contentRes.status, contentRes.statusText);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch offers and content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % offers.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const isOfferValid = (offer: Offer) => {
    const now = new Date();
    const validFrom = offer.validFrom ? new Date(offer.validFrom) : null;
    const validTo = offer.validTo ? new Date(offer.validTo) : null;

    if (validFrom && now < validFrom) return false;
    if (validTo && now > validTo) return false;
    return true;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('Rendering - offers:', offers.length, 'contentItems:', contentItems.length);

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Special Offers & Updates</h1>
        <p className="text-muted-foreground">Discover our latest financial opportunities and market insights</p>
      </div>

      {/* Main Offers Carousel */}
      {offers.length > 0 && (
        <div className="relative">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-96 bg-gradient-to-r from-primary/10 to-primary/5">
                {offers.map((offer, index) => (
                  <div
                    key={offer.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Image Section */}
                      <div className="w-full md:w-1/2 relative h-48 md:h-full">
                        {offer.imageUrl ? (
                          <img
                            src={offer.imageUrl}
                            alt={offer.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <div className="text-6xl text-primary/30">💰</div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20"></div>
                      </div>

                      {/* Content Section */}
                      <div className="w-full md:w-1/2 p-4 sm:p-8 flex flex-col justify-center">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={isOfferValid(offer) ? "default" : "secondary"}>
                              {isOfferValid(offer) ? "Active" : "Expired"}
                            </Badge>
                            {offer.validFrom && offer.validTo && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(offer.validFrom)} - {formatDate(offer.validTo)}
                              </div>
                            )}
                          </div>

                          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{offer.title}</h2>
                          
                          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                            {offer.description}
                          </p>

                          {offer.linkUrl && (
                            <Button 
                              size="lg" 
                              className="w-fit"
                              onClick={() => window.open(offer.linkUrl, '_blank')}
                            >
                              Learn More
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Navigation Arrows */}
                {offers.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={prevSlide}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={nextSlide}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Slide Indicators */}
                {offers.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {offers.map((_, index) => (
                      <button
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Content Gallery */}
      {contentItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Market Insights & Updates ({contentItems.length} items)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {contentItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {item.mediaUrl && (
                    <div className="aspect-video relative">
                      {item.mediaType === 'video' ? (
                        <video
                          src={item.mediaUrl}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                    )}
                    {item.content && (
                      <p className="text-sm leading-relaxed">{item.content}</p>
                    )}
                    <div className="mt-3 text-xs text-muted-foreground">
                      Published: {formatDate(item.publishedAt || item.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {offers.length === 0 && contentItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📢</div>
          <h2 className="text-2xl font-semibold mb-2">No Offers Available</h2>
          <p className="text-muted-foreground">Check back soon for exciting financial opportunities and updates!</p>
        </div>
      )}
    </div>
  );
}