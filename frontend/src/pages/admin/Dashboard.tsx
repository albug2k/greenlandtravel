// src/pages/admin/Dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, MapPin, Image, BookOpen,
  MessageSquare, CalendarCheck, DollarSign, TrendingUp,
  Users, Loader2,
} from "lucide-react";
import { adminAPI, AdminStats } from "@/api/admin";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid:           "bg-green-100 text-green-700",
  pending:        "bg-yellow-100 text-yellow-700",
  partially_paid: "bg-orange-100 text-orange-700",
  refunded:       "bg-purple-100 text-purple-700",
};

const Dashboard = () => {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    adminAPI.getStats()
      .then(setStats)
      .catch(() => setError("Failed to load dashboard data. Make sure you are logged in as admin."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-center text-destructive py-16">{error}</p>;
  }

  const confirmedRevenue = stats.recent_bookings
    .filter((b) => b.status === "confirmed" || b.payment_status === "paid")
    .reduce((sum, b) => sum + b.total_price, 0);

  const pendingCount = stats.recent_bookings.filter((b) => b.status === "pending").length;

  const STAT_CARDS = [
    { title: "Packages",          value: stats.packages,      icon: Package,       color: "text-primary" },
    { title: "Destinations",      value: stats.destinations,  icon: MapPin,        color: "text-secondary" },
    { title: "Gallery Albums",    value: stats.gallery_items, icon: Image,         color: "text-accent" },
    { title: "Blog Posts",        value: stats.blogs,         icon: BookOpen,      color: "text-primary" },
    { title: "Users",             value: stats.users,         icon: Users,         color: "text-secondary" },
    { title: "Total Bookings",    value: stats.bookings,      icon: CalendarCheck, color: "text-accent" },
    { title: "Revenue (recent)",  value: `$${confirmedRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { title: "Pending Bookings",  value: pendingCount,        icon: TrendingUp,    color: "text-destructive" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {STAT_CARDS.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.title}
              </CardTitle>
              <s.icon className={s.color} size={20} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent_bookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Reference","Destination","Travel Date","Guests","Total","Status","Payment"].map((h) => (
                      <th key={h} className="text-left py-3 px-2 font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_bookings.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-2 font-mono text-xs">{b.booking_reference}</td>
                      <td className="py-3 px-2">{b.destination}</td>
                      <td className="py-3 px-2 whitespace-nowrap">{b.travel_date}</td>
                      <td className="py-3 px-2">{b.guests}</td>
                      <td className="py-3 px-2 font-semibold">${b.total_price.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                          {b.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;