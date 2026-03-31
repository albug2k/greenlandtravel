// src/components/AdminLayout.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, MapPin, Image,
  BookOpen, MessageSquare, CalendarCheck, LogOut, Users, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/utils/api";

const NAV_ITEMS = [
  { title: "Dashboard",    path: "/admin",               icon: LayoutDashboard },
  { title: "Packages",     path: "/admin/packages",      icon: Package },
  { title: "Destinations", path: "/admin/destinations",  icon: MapPin },
  { title: "Gallery",      path: "/admin/gallery",       icon: Image },
  { title: "Blogs",        path: "/admin/blogs",         icon: BookOpen },
  { title: "Testimonials", path: "/admin/testimonials",  icon: MessageSquare },
  { title: "Bookings",     path: "/admin/bookings",      icon: CalendarCheck },
  { title: "Users",        path: "/admin/users",         icon: Users },
  { title: "Messages",     path: "/admin/messages",      icon: Inbox },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [user, setUser]     = useState<any>(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem("admin_token");
    const stored = localStorage.getItem("admin_user");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try { setUser(JSON.parse(stored ?? "{}")); } catch { /* ignore */ }
    }
    setReady(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    delete api.defaults.headers.common["Authorization"];
    navigate("/admin/login");
  };

  if (!ready) return null; // wait for localStorage check
  if (!localStorage.getItem("admin_token")) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-muted">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">GreenLand Travel</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {user?.email ?? "Admin"}
          </p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;