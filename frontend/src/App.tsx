// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Public pages
import Index from "./pages/Index";
import Destinations from "./pages/Destinations";
import DestinationDetail from "./pages/DestinationDetail";
import Packages from "./pages/Packages";
import PackageDetail from "./pages/PackageDetail";
import Gallery from "./pages/Gallery";
import GalleryDetail from "./pages/GalleryDetail";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import BookNow from "./pages/BookNow";
import Contact from "./pages/Contact";
import Testimonials from "./pages/Testimonials";
import NotFound from "./pages/NotFound";

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMessages from "./pages/admin/Adminmessages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ── Public ─────────────────────────────────────────────────── */}
          <Route path="/" element={<Index />} />

          <Route path="/destinations"              element={<Destinations />} />
          <Route path="/destination-detail"        element={<DestinationDetail />} />
          <Route path="/destination-detail/:slug"  element={<DestinationDetail />} />

          <Route path="/packages"                  element={<Packages />} />
          <Route path="/package-detail/:slug"      element={<PackageDetail />} />

          <Route path="/gallery"                   element={<Gallery />} />
          <Route path="/gallery-detail"            element={<GalleryDetail />} />
          <Route path="/gallery-detail/:slug"      element={<GalleryDetail />} />

          <Route path="/blogs"                     element={<Blogs />} />
          <Route path="/blog-detail"               element={<BlogDetail />} />
          <Route path="/blog-detail/:id"           element={<BlogDetail />} />

          <Route path="/book-now"                  element={<BookNow />} />
          <Route path="/contact"                   element={<Contact />} />
          <Route path="/testimonials"              element={<Testimonials />} />

          {/* ── Admin ──────────────────────────────────────────────────── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index                       element={<Dashboard />} />
            <Route path="packages"             element={<AdminPackages />} />
            <Route path="destinations"         element={<AdminDestinations />} />
            <Route path="gallery"              element={<AdminGallery />} />
            <Route path="blogs"                element={<AdminBlogs />} />
            <Route path="testimonials"         element={<AdminTestimonials />} />
            <Route path="bookings"             element={<AdminBookings />} />
            <Route path="users"                element={<AdminUsers />} />
            <Route path="messages"             element={<AdminMessages />} />
          </Route>

          {/* ── 404 — must be last ─────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;