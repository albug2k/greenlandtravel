// src/pages/Contact.tsx
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contactAPI, CreateContactData } from "@/api/contact";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "general" | "booking" | "support" | "feedback";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "general", label: "General Inquiry" },
  { value: "booking", label: "Booking Help" },
  { value: "support", label: "Customer Support" },
  { value: "feedback", label: "Feedback" },
];

// ── Static contact info ───────────────────────────────────────────────────────

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email",
    lines: ["info@glttravel.com", "support@glttravel.com"],
  },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
  },
  {
    icon: MapPin,
    title: "Address",
    lines: ["123 Travel Street", "Suite 456", "New York, NY 10001"],
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: [
      "Mon – Fri: 9:00 AM – 6:00 PM",
      "Sat: 10:00 AM – 4:00 PM",
      "Sun: Closed",
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const Contact = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general" as Category,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateContactData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
        category: formData.category,
      };

      await contactAPI.submit(payload);

      setSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          category: "general",
        });
        setSubmitted(false);
      }, 3000);
    } catch (err: any) {
      console.error("Contact form error:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to send message. Please try again.";
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4">

          {/* Page header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions? We're here to help make your travel dreams come
              true
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* ── Contact info sidebar ──────────────────────────────────── */}
            <div className="lg:col-span-1 space-y-6 animate-fade-in">
              {CONTACT_INFO.map((item) => (
                <Card key={item.title} className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                        <item.icon className="text-white" size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        {item.lines.map((line, i) => (
                          <p
                            key={i}
                            className="text-muted-foreground text-sm"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Contact form ──────────────────────────────────────────── */}
            <div className="lg:col-span-2 animate-fade-in-up">
              <Card className="shadow-elevated">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">
                    Send us a Message
                  </h2>

                  {/* ── Success state ─────────────────────────────────── */}
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-muted-foreground">
                        Thank you for reaching out. We'll get back to you
                        within 24 hours.
                      </p>
                    </div>
                  ) : (
                    /* ── Form ─────────────────────────────────────────── */
                    <form onSubmit={handleSubmit} className="space-y-6">

                      {/* Name + Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name *</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) =>
                              handleChange("name", e.target.value)
                            }
                            required
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Your Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) =>
                              handleChange("email", e.target.value)
                            }
                            required
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      {/* Subject + Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            placeholder="How can we help you?"
                            value={formData.subject}
                            onChange={(e) =>
                              handleChange("subject", e.target.value)
                            }
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(v) =>
                              handleChange("category", v)
                            }
                            disabled={submitting}
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem
                                  key={cat.value}
                                  value={cat.value}
                                >
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us more about your inquiry..."
                          className="min-h-[160px] resize-none"
                          value={formData.message}
                          onChange={(e) =>
                            handleChange("message", e.target.value)
                          }
                          required
                          disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {formData.message.length} characters
                        </p>
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full shadow-glow"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        We typically respond within 24 hours on business days.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;