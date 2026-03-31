// src/pages/BookNow.tsx
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, MapPin, CreditCard, Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";
import { destinationsAPI, Destination } from "@/api/destinations";
import api from "@/utils/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PriceResult {
  success: boolean;
  total_price: number;
  base_price?: number;
  guests?: number;
  breakdown?: Record<string, number>;
}

interface CreatedBooking {
  id: number;
  booking_reference: string;
  destination: string;
  travel_date: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

// ── Component ─────────────────────────────────────────────────────────────────

const BookNow = () => {
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    destination: "",       // human-readable label sent to backend
    destinationId: "",     // numeric id, used for available-dates lookup
    travelDate: "",
    returnDate: "",
    guests: "",
    tourId: "",
    packageId: "",
    specialRequests: "",
  });

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // ── Fetch destinations on mount ────────────────────────────────────────────
  useEffect(() => {
    const fetchDestinations = async () => {
      setDestinationsLoading(true);
      try {
        const response = await destinationsAPI.getAll({ limit: 100 });
        setDestinations(response.destinations);
      } catch (err) {
        console.error("Failed to load destinations:", err);
        toast({
          title: "Could not load destinations",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } finally {
        setDestinationsLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // ── Calculate price from backend whenever relevant fields change ───────────
  useEffect(() => {
    const canCalculate =
      formData.destination && formData.guests && parseInt(formData.guests) > 0;

    if (!canCalculate) {
      setEstimatedPrice(null);
      setPriceError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPriceLoading(true);
      setPriceError(null);
      try {
        const payload: Record<string, unknown> = {
          destination: formData.destination,
          guests: parseInt(formData.guests),
        };
        if (formData.tourId) payload.tour_id = parseInt(formData.tourId);
        if (formData.packageId) payload.package_id = parseInt(formData.packageId);
        if (formData.travelDate) payload.travel_date = formData.travelDate;

        const response = await api.post("/bookings/calculate-price", payload, {
          signal: controller.signal,
        });

        const result: PriceResult = response.data;
        if (result.success) {
          setEstimatedPrice(result.total_price);
        } else {
          setPriceError("Could not calculate price for this selection.");
          setEstimatedPrice(null);
        }
      } catch (err: any) {
        if (err.name !== "CanceledError") {
          console.error("Price calculation error:", err);
          setPriceError(
            err.response?.data?.error || "Price calculation unavailable."
          );
          setEstimatedPrice(null);
        }
      } finally {
        setPriceLoading(false);
      }
    }, 500); // debounce 500ms

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.destination, formData.guests, formData.tourId, formData.packageId, formData.travelDate]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDestinationSelect = (value: string) => {
    // value is "id::title" so we can store both
    const [id, ...titleParts] = value.split("::");
    const title = titleParts.join("::");
    setFormData((prev) => ({
      ...prev,
      destinationId: id,
      destination: title,
    }));
  };

  // ── Submit booking ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.destination ||
      !formData.travelDate ||
      !formData.guests
    ) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.travelDate) <= new Date()) {
      toast({
        title: "Invalid travel date",
        description: "Travel date must be in the future.",
        variant: "destructive",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload: Record<string, unknown> = {
        destination: formData.destination,
        travel_date: formData.travelDate,
        guests: parseInt(formData.guests),
        special_requests: formData.specialRequests || "",
      };
      if (formData.returnDate) payload.return_date = formData.returnDate;
      if (formData.tourId) payload.tour_id = parseInt(formData.tourId);
      if (formData.packageId) payload.package_id = parseInt(formData.packageId);

      const response = await api.post("/bookings", payload);
      const result = response.data;

      if (result.success) {
        setCreatedBooking(result.data);
        setIsPaymentOpen(true);
        toast({
          title: "Booking created!",
          description: `Reference: ${result.data.booking_reference}`,
        });
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create booking. Please try again.";
      toast({ title: "Booking failed", description: message, variant: "destructive" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Payment close / reset ─────────────────────────────────────────────────
  const handlePaymentClose = () => {
    setIsPaymentOpen(false);
    setCreatedBooking(null);
    setEstimatedPrice(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      destination: "",
      destinationId: "",
      travelDate: "",
      returnDate: "",
      guests: "",
      tourId: "",
      packageId: "",
      specialRequests: "",
    });
  };

  // ── Price display ─────────────────────────────────────────────────────────
  const priceDisplay = () => {
    if (priceLoading)
      return (
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
        </span>
      );
    if (priceError)
      return (
        <span className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {priceError}
        </span>
      );
    if (estimatedPrice !== null)
      return (
        <span className="text-2xl font-bold text-primary">
          ${estimatedPrice.toLocaleString()}
        </span>
      );
    return <span className="text-2xl font-bold text-muted-foreground">---</span>;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-20 bg-muted">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book Your Dream Journey
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fill out the form below and our travel experts will create a
              personalised itinerary for you
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="shadow-elevated animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-2xl">Booking Information</CardTitle>
                <CardDescription>
                  Please provide your details and travel preferences
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* ── Personal Information ─────────────────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                    />
                  </div>

                  {/* ── Travel Details ────────────────────────────────────── */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="text-primary" size={20} />
                      Travel Details
                    </h3>

                    {/* Destination dropdown */}
                    <div className="space-y-2 mb-6">
                      <Label htmlFor="destination">Preferred Destination *</Label>
                      {destinationsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground h-10">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading destinations…
                        </div>
                      ) : (
                        <Select
                          value={
                            formData.destinationId
                              ? `${formData.destinationId}::${formData.destination}`
                              : ""
                          }
                          onValueChange={handleDestinationSelect}
                          required
                        >
                          <SelectTrigger id="destination">
                            <SelectValue placeholder="Select a destination" />
                          </SelectTrigger>
                          <SelectContent>
                            {destinations.map((dest) => (
                              <SelectItem
                                key={dest.id}
                                value={`${dest.id}::${dest.title}`}
                              >
                                {dest.title}
                                {dest.country ? ` — ${dest.country}` : ""}
                                {dest.base_price
                                  ? `  (from $${dest.base_price.toLocaleString()})`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Dates + guests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="travelDate"
                          className="flex items-center gap-2"
                        >
                          <Calendar size={16} />
                          Travel Date *
                        </Label>
                        <Input
                          id="travelDate"
                          type="date"
                          min={today}
                          value={formData.travelDate}
                          onChange={(e) =>
                            handleChange("travelDate", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="returnDate"
                          className="flex items-center gap-2"
                        >
                          <Calendar size={16} />
                          Return Date
                        </Label>
                        <Input
                          id="returnDate"
                          type="date"
                          min={formData.travelDate || today}
                          value={formData.returnDate}
                          onChange={(e) =>
                            handleChange("returnDate", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-6">
                      <Label
                        htmlFor="guests"
                        className="flex items-center gap-2"
                      >
                        <Users size={16} />
                        Number of Guests *
                      </Label>
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        max="50"
                        placeholder="2"
                        value={formData.guests}
                        onChange={(e) => handleChange("guests", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* ── Special Requests ──────────────────────────────────── */}
                  <div className="space-y-2">
                    <Label htmlFor="specialRequests">
                      Special Requests or Preferences
                    </Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any dietary restrictions, accessibility needs, or special occasions…"
                      className="min-h-[120px]"
                      value={formData.specialRequests}
                      onChange={(e) =>
                        handleChange("specialRequests", e.target.value)
                      }
                    />
                  </div>

                  {/* ── Price summary ─────────────────────────────────────── */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Estimated Total:
                      </span>
                      {priceDisplay()}
                    </div>
                    {estimatedPrice !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Final price confirmed at checkout
                      </p>
                    )}
                  </div>

                  {/* ── Submit ────────────────────────────────────────────── */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full shadow-glow"
                    disabled={submitLoading || destinationsLoading}
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Booking…
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    By submitting this form, you agree to our Terms of Service
                    and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment modal — receives the real total_price from the created booking */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={handlePaymentClose}
        amount={createdBooking?.total_price ?? estimatedPrice ?? 0}
        bookingDetails={{
          name: formData.name,
          destination: formData.destination,
          guests: formData.guests,
          bookingReference: createdBooking?.booking_reference,
          bookingId: createdBooking?.id?.toString(),
        }}
      />

      <Footer />
    </div>
  );
};

export default BookNow;