// src/components/ContactSection.tsx
import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { contactAPI } from "@/api/contact";

const ContactSection = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contactAPI.submit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        category: "general",
      });

      setSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });

      setTimeout(() => {
        setFormData({ name: "", email: "", message: "" });
        setSubmitted(false);
      }, 3000);
    } catch (err: any) {
      toast({
        title: "Failed to send message",
        description:
          err.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to start your adventure? Contact us today and let's plan your
            perfect journey
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact info */}
          <div className="space-y-8 animate-fade-in">
            {[
              {
                icon: Mail,
                title: "Email Us",
                lines: ["info@glttravel.com", "support@glttravel.com"],
              },
              {
                icon: Phone,
                title: "Call Us",
                lines: ["+1 (555) 123-4567", "Available 24/7"],
              },
              {
                icon: MapPin,
                title: "Visit Us",
                lines: ["123 Travel Street", "New York, NY 10001, USA"],
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="p-6 shadow-soft border-0 hover:shadow-elevated transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-lg flex-shrink-0">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    {item.lines.map((line, i) => (
                      <p key={i} className="text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact form */}
          <Card className="p-8 shadow-soft border-0 animate-fade-in">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">
                  We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="cs-name"
                    className="block text-sm font-medium mb-2"
                  >
                    Your Name *
                  </label>
                  <Input
                    id="cs-name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cs-email"
                    className="block text-sm font-medium mb-2"
                  >
                    Email Address *
                  </label>
                  <Input
                    id="cs-email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cs-message"
                    className="block text-sm font-medium mb-2"
                  >
                    Your Message *
                  </label>
                  <Textarea
                    id="cs-message"
                    placeholder="Tell us about your dream destination..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    required
                    className="resize-none"
                    disabled={submitting}
                  />
                </div>
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
                      <Send className="ml-2" size={18} />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;