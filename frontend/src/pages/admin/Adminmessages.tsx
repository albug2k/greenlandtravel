// src/pages/admin/AdminMessages.tsx
import { useState, useEffect, useCallback } from "react";
import { Button }       from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input }        from "@/components/ui/input";
import { Label }        from "@/components/ui/label";
import { Textarea }     from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, Search, Mail, MailOpen, Reply,
  Trash2, MessageSquare, Clock, CheckCheck,
  InboxIcon, AlertCircle,
} from "lucide-react";
import { useToast }  from "@/hooks/use-toast";
import { contactAPI, ContactMessage } from "@/api/contact";

// ── category colours ──────────────────────────────────────────────────────────
const CAT: Record<string, string> = {
  general:  "bg-blue-100   text-blue-700",
  booking:  "bg-purple-100 text-purple-700",
  support:  "bg-orange-100 text-orange-700",
  feedback: "bg-green-100  text-green-700",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ─────────────────────────────────────────────────────────────────────────────
const AdminMessages = () => {
  const { toast } = useToast();

  const [items,       setItems]       = useState<ContactMessage[]>([]);
  const [total,       setTotal]       = useState(0);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState<"all" | "unread" | "unreplied">("all");
  const [selected,    setSelected]    = useState<ContactMessage | null>(null);
  const [replyText,   setReplyText]   = useState("");
  const [sending,     setSending]     = useState(false);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params: Record<string, any> = {};
      if (filter === "unread")    params.read    = false;
      if (filter === "unreplied") params.replied = false;

      const data = await contactAPI.getAll(params);
      setItems(data.items);
      setTotal(data.total);
      setUnread(data.unread_count);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Network Error";
      setFetchError(msg);
      toast({ title: "Failed to load messages", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // ── open a message (auto-mark read) ───────────────────────────────────────
  const open = async (msg: ContactMessage) => {
    setSelected(msg);
    setReplyText("");
    if (!msg.read) {
      try {
        await contactAPI.markRead(msg.id, true);
        setUnread(u => Math.max(0, u - 1));
        setItems(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      } catch { /* ignore */ }
    }
  };

  // ── send reply ─────────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const updated = await contactAPI.reply(selected.id, replyText.trim());
      toast({ title: "Reply sent!" });
      // merge in the updated message
      const merged = { ...selected, replied: true, reply_message: replyText.trim(), ...updated };
      setSelected(merged);
      setReplyText("");
      setItems(prev => prev.map(m => m.id === selected.id ? { ...m, replied: true } : m));
    } catch (err: any) {
      toast({
        title:       "Failed to send reply",
        description: err.response?.data?.error || err.message,
        variant:     "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const del = async (id: number) => {
    if (!window.confirm("Delete this message permanently?")) return;
    setDeletingId(id);
    try {
      await contactAPI.delete(id);
      toast({ title: "Message deleted" });
      if (selected?.id === id) setSelected(null);
      setItems(prev => prev.filter(m => m.id !== id));
      setTotal(t => t - 1);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // ── client-side search ─────────────────────────────────────────────────────
  const visible = items.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q)    ||
      m.email.toLowerCase().includes(q)   ||
      (m.subject ?? "").toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Messages
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5
                               rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} total · {unread} unread
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* Error banner */}
      {fetchError && !loading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-5 flex gap-3">
          <AlertCircle size={18} className="text-destructive mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Failed to load messages</p>
            <p className="text-muted-foreground">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search messages…" className="pl-9"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "unreplied"] as const).map(f => (
            <Button key={f} size="sm"
                    variant={filter === f ? "default" : "outline"}
                    onClick={() => setFilter(f)}
                    className="capitalize">
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Sender", "Subject & Preview", "Category", "Status", "Date", ""].map(h => (
                    <th key={h}
                        className={`py-3 px-4 font-medium text-muted-foreground whitespace-nowrap
                                    ${h === "" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <InboxIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No messages found</p>
                    </td>
                  </tr>
                ) : visible.map(msg => (
                  <tr key={msg.id}
                      onClick={() => open(msg)}
                      className={`border-b last:border-0 cursor-pointer transition-colors
                                  hover:bg-muted/30 ${!msg.read ? "bg-primary/5" : ""}`}>
                    {/* Sender */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {msg.read
                          ? <MailOpen size={15} className="text-muted-foreground flex-shrink-0" />
                          : <Mail     size={15} className="text-primary      flex-shrink-0" />}
                        <div>
                          <div className={`text-sm ${!msg.read ? "font-semibold" : ""}`}>{msg.name}</div>
                          <div className="text-xs text-muted-foreground">{msg.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Subject */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className={`truncate ${!msg.read ? "font-medium" : ""}`}>
                        {msg.subject || "(no subject)"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {msg.message.slice(0, 65)}…
                      </div>
                    </td>
                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${CAT[msg.category] ?? "bg-muted text-muted-foreground"}`}>
                        {msg.category}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {!msg.read && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 w-fit">
                            Unread
                          </span>
                        )}
                        {msg.replied
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 w-fit flex items-center gap-1">
                              <CheckCheck size={10} /> Replied
                            </span>
                          : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
                              Pending
                            </span>
                        }
                      </div>
                    </td>
                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(msg.created_at)}
                    </td>
                    {/* Delete */}
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon"
                              disabled={deletingId === msg.id}
                              onClick={e => { e.stopPropagation(); del(msg.id); }}
                              title="Delete">
                        {deletingId === msg.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2  size={14} className="text-destructive" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Detail + Reply dialog ───────────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  {selected.subject || "(no subject)"}
                </DialogTitle>
              </DialogHeader>

              {/* Sender card */}
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold">{selected.name}</span>
                    <span className="text-muted-foreground ml-2">
                      &lt;{selected.email}&gt;
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0
                                    ${CAT[selected.category] ?? "bg-muted text-muted-foreground"}`}>
                    {selected.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} /> {fmt(selected.created_at)}
                </div>
              </div>

              {/* Message body */}
              <div className="rounded-lg border p-4 text-sm whitespace-pre-wrap leading-relaxed min-h-[80px]">
                {selected.message}
              </div>

              {/* Previous reply */}
              {selected.replied && selected.reply_message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <CheckCheck size={12} /> Your previous reply
                  </p>
                  <p className="whitespace-pre-wrap text-green-900 leading-relaxed">
                    {selected.reply_message}
                  </p>
                </div>
              )}

              {/* Reply form */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="font-medium flex items-center gap-2">
                  <Reply size={15} className="text-primary" />
                  {selected.replied ? "Send another reply" : "Reply to this message"}
                </Label>
                <Textarea
                  placeholder={`Write your reply to ${selected.name}…`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={5}
                  disabled={sending}
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground flex-1">
                    Reply saved in the system.{" "}
                    <span className="text-amber-600">
                      Email sending requires Flask-Mail — see setup notes below.
                    </span>
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" onClick={() => setSelected(null)} disabled={sending}>
                      Close
                    </Button>
                    <Button onClick={sendReply} disabled={sending || !replyText.trim()}>
                      {sending
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                        : <><Reply   className="mr-2 h-4 w-4" />Send Reply</>}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;