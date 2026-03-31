// src/pages/admin/AdminBookings.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminAPI, AdminBooking } from "@/api/admin";

const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
const PAYMENT_STATUSES = ["pending", "paid", "partially_paid", "refunded"];

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

const AdminBookings = () => {
  const [items,    setItems]    = useState<AdminBooking[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Status edit dialog
  const [editing,    setEditing]    = useState<AdminBooking | null>(null);
  const [newStatus,  setNewStatus]  = useState("");
  const [saving,     setSaving]     = useState(false);

  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, per_page: 15 };
      if (statusFilter  !== "all") params.status         = statusFilter;
      if (paymentFilter !== "all") params.payment_status = paymentFilter;
      const res = await adminAPI.getBookings(params);
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      toast({ title: "Failed to load bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async () => {
    if (!editing || !newStatus) return;
    setSaving(true);
    try {
      await adminAPI.updateBookingStatus(editing.id, newStatus);
      toast({ title: "Booking status updated" });
      setEditing(null);
      await load();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Client-side search on visible page
  const filtered = items.filter((b) =>
    !search.trim() ||
    b.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
    b.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} total booking{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reference or destination..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Booking Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Reference","Destination","Travel Date","Guests","Total","Status","Payment","Actions"].map((h) => (
                    <th key={h} className={`py-3 px-4 font-medium text-muted-foreground whitespace-nowrap ${h === "Actions" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-xs">{b.booking_reference}</td>
                      <td className="py-3 px-4">{b.destination}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{b.travel_date}</td>
                      <td className="py-3 px-4">{b.guests}</td>
                      <td className="py-3 px-4 font-semibold">${b.total_price?.toLocaleString() ?? 0}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_COLORS[b.payment_status] ?? ""}`}>
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditing(b); setNewStatus(b.status); }}
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft size={16} className="mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pages}>
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Ref:</span> {editing.booking_reference}</p>
                <p><span className="font-medium text-foreground">Destination:</span> {editing.destination}</p>
                <p><span className="font-medium text-foreground">Total:</span> ${editing.total_price?.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                <Button onClick={handleStatusUpdate} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;