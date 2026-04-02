import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown, MapPin, CalendarCheck, Trash2, MessageCircle, FileText, Plus, ArrowLeft, X, Car, CheckCircle, Clock,
  Bell, AlertTriangle, Shield, ChevronDown, ChevronUp, Users, TrendingUp, Timer
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  getBookings, saveBookings, getPickupLocations, getDropoffMapping,
  savePickupLocations, saveDropoffMapping, CARS_LIST, type Booking,
  getNotifications, markNotificationRead, markAllNotificationsRead, getDaysUntilDeadline
} from "@/lib/store";

// Popup Modal component
const PopupModal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-background/90 z-[2000] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-primary pb-3 mb-4">
          <h3 className="text-primary font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-primary hover:text-primary/70 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const PopupOption = ({ label, active, onClick, icon }: { label: string; active?: boolean; onClick: () => void; icon?: React.ReactNode }) => (
  <button onClick={onClick} className={`w-full p-3 my-1.5 border rounded-lg text-left text-sm font-medium transition-all flex items-center gap-3 hover:scale-[1.02] ${active ? 'bg-primary/30 border-primary shadow-[0_0_10px_hsla(0,70%,45%,0.3)]' : 'bg-primary/10 border-border hover:bg-primary/20 hover:border-primary'}`}>
    {icon}
    <span className="flex-1">{label}</span>
    {active && <CheckCircle className="w-4 h-4 text-primary" />}
  </button>
);

// Confirm Delete Modal
const ConfirmDeleteModal = ({ open, onClose, onConfirm, itemName }: { open: boolean; onClose: () => void; onConfirm: () => void; itemName: string }) => (
  <PopupModal open={open} onClose={onClose} title="Confirm Delete">
    <div className="text-center py-4">
      <Shield className="w-12 h-12 text-destructive mx-auto mb-3" />
      <p className="text-foreground mb-2 font-semibold">Are you sure you want to delete?</p>
      <p className="text-muted-foreground text-sm mb-6">"{itemName}" will be permanently removed.</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 bg-muted border border-border rounded-lg font-semibold text-sm hover:bg-muted/80 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm hover:bg-destructive/80 transition-colors">Delete</button>
      </div>
    </div>
  </PopupModal>
);

// PDF Invoice Generator
function generateInvoicePDF(b: Booking) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CAR LIFT", 15, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Monthly Car Service", 15, 32);
  doc.setFontSize(12);
  doc.text("INVOICE", pageW - 15, 22, { align: "right" });
  doc.setFontSize(9);
  doc.text(`#INV-${b.id}`, pageW - 15, 30, { align: "right" });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - 15, 52, { align: "right" });

  doc.setFillColor(245, 245, 245);
  doc.rect(15, 58, pageW - 30, 36, 'F');
  doc.setDrawColor(139, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, 58, 15, 94);
  doc.setTextColor(139, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO", 22, 68);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(b.name, 22, 76);
  doc.setFontSize(9);
  doc.text(`WhatsApp: ${b.whatsapp}`, 22, 84);
  doc.text(`Start Date: ${b.startDate}`, 22, 91);

  const tableTop = 106;
  doc.setFillColor(139, 0, 0);
  doc.rect(15, tableTop, pageW - 30, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 20, tableTop + 8);
  doc.text("DETAILS", pageW - 20, tableTop + 8, { align: "right" });

  const rows = [
    ["Pickup Location", b.pickup],
    ["Drop-off Location", b.dropoff],
    ["Timing Slot", b.timing],
    ["Vehicle Class", b.class],
    ["Assigned Car", b.assignedCar || "To Be Assigned"],
    ["Payment Method", b.payment],
    ["Booking Status", b.status === 'approved' ? "Approved" : "Pending"],
  ];

  doc.setFont("helvetica", "normal");
  let y = tableTop + 12;
  rows.forEach((row, i) => {
    const bg = i % 2 === 0 ? 250 : 255;
    doc.setFillColor(bg, bg, bg);
    doc.rect(15, y, pageW - 30, 11, 'F');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text(row[0], 20, y + 7.5);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(row[1], pageW - 20, y + 7.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 11;
  });

  y += 6;
  doc.setFillColor(139, 0, 0);
  doc.rect(pageW / 2, y, pageW / 2 - 15, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MONTHLY FARE", pageW / 2 + 8, y + 10);
  doc.setFontSize(13);
  doc.text(b.fare, pageW - 20, y + 10, { align: "right" });

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, footerY, pageW - 15, footerY);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Car Lift - Premium Monthly Transportation Service", pageW / 2, footerY + 8, { align: "center" });
  doc.text("This is a system-generated invoice.", pageW / 2, footerY + 14, { align: "center" });

  doc.save(`CarLift_Invoice_${b.id}.pdf`);
}

// Deadline Badge
const DeadlineBadge = ({ startDate }: { startDate: string }) => {
  const days = getDaysUntilDeadline(startDate);
  if (days === null) return <span className="text-xs text-muted-foreground">{startDate}</span>;

  if (days < 0) return (
    <span className="inline-flex items-center gap-1 text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
      <Timer className="w-3 h-3" /> Started
    </span>
  );
  if (days <= 3) return (
    <span className="inline-flex items-center gap-1 text-xs bg-destructive/20 text-destructive border border-destructive/40 px-2 py-0.5 rounded-full animate-pulse">
      <AlertTriangle className="w-3 h-3" /> {days}d left
    </span>
  );
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-full">
      <Timer className="w-3 h-3" /> {days}d left
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-muted-foreground px-2 py-0.5 rounded-full">
      <Timer className="w-3 h-3" /> {days}d left
    </span>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>(getBookings());
  const [pickups, setPickups] = useState(getPickupLocations());
  const [dropMap, setDropMap] = useState(getDropoffMapping());
  const [newPickup, setNewPickup] = useState('');
  const [selectedPickupForDrop, setSelectedPickupForDrop] = useState('');
  const [newDropoff, setNewDropoff] = useState('');

  // Popup states
  const [carPopup, setCarPopup] = useState<number | null>(null);
  const [statusPopup, setStatusPopup] = useState<number | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pickup' | 'dropoff'; name: string; parent?: string } | null>(null);

  // Notification panel
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(getNotifications());

  // Route management expand
  const [routeExpanded, setRouteExpanded] = useState(true);

  const refresh = () => {
    setBookings(getBookings());
    setPickups(getPickupLocations());
    setDropMap(getDropoffMapping());
    setNotifications(getNotifications());
  };

  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;
  const urgentCount = bookings.filter(b => {
    const days = getDaysUntilDeadline(b.startDate);
    return days !== null && days >= 0 && days <= 3;
  }).length;

  const addPickup = () => {
    if (newPickup && !pickups.includes(newPickup)) {
      const updated = [...pickups, newPickup];
      const updatedMap = { ...dropMap, [newPickup]: [] };
      savePickupLocations(updated);
      saveDropoffMapping(updatedMap);
      setPickups(updated);
      setDropMap(updatedMap);
      setNewPickup('');
    }
  };

  const confirmDeletePickup = (p: string) => setDeleteTarget({ type: 'pickup', name: p });
  const confirmDeleteDropoff = (pick: string, drop: string) => setDeleteTarget({ type: 'dropoff', name: drop, parent: pick });

  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'pickup') {
      const updated = pickups.filter(l => l !== deleteTarget.name);
      const updatedMap = { ...dropMap };
      delete updatedMap[deleteTarget.name];
      savePickupLocations(updated);
      saveDropoffMapping(updatedMap);
      setPickups(updated);
      setDropMap(updatedMap);
      if (selectedPickupForDrop === deleteTarget.name) setSelectedPickupForDrop('');
    } else if (deleteTarget.type === 'dropoff' && deleteTarget.parent) {
      const updatedMap = { ...dropMap, [deleteTarget.parent]: dropMap[deleteTarget.parent].filter(d => d !== deleteTarget.name) };
      saveDropoffMapping(updatedMap);
      setDropMap(updatedMap);
    }
    setDeleteTarget(null);
  };

  const addDropoff = () => {
    if (selectedPickupForDrop && newDropoff && !dropMap[selectedPickupForDrop]?.includes(newDropoff)) {
      const updatedMap = { ...dropMap, [selectedPickupForDrop]: [...(dropMap[selectedPickupForDrop] || []), newDropoff] };
      saveDropoffMapping(updatedMap);
      setDropMap(updatedMap);
      setNewDropoff('');
    }
  };

  const updateStatus = (id: number, status: 'pending' | 'approved') => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    saveBookings(updated);
    setBookings(updated);
    setStatusPopup(null);
  };

  const assignCar = (id: number, car: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, assignedCar: car } : b);
    saveBookings(updated);
    setBookings(updated);
    setCarPopup(null);
  };

  const deleteBooking = (id: number) => {
    const updated = bookings.filter(b => b.id !== id);
    saveBookings(updated);
    setBookings(updated);
  };

  const sendWhatsApp = (b: Booking) => {
    window.open(`https://wa.me/${b.whatsapp}?text=Your%20booking%20${b.status}`, '_blank');
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setNotifications(getNotifications());
  };

  const handleMarkRead = (id: number) => {
    markNotificationRead(id);
    setNotifications(getNotifications());
  };

  const activeBookingForCar = bookings.find(b => b.id === carPopup);
  const activeBookingForStatus = bookings.find(b => b.id === statusPopup);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-primary px-4 md:px-8 py-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Crown className="w-7 h-7 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-text">CAR LIFT ADMIN</h1>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-primary/15 border border-primary/50 p-2.5 rounded-xl hover:bg-primary/25 transition-all hover:scale-105"
            >
              <Bell className="w-5 h-5 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Facebook-style Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border-2 border-primary rounded-2xl shadow-2xl z-[3000] animate-fade-in-up overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-border">
                  <h4 className="font-display font-bold text-primary text-base">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-semibold">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 20).map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b border-border/50 flex items-start gap-3 transition-colors hover:bg-primary/10 ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${!n.read ? 'bg-primary' : 'bg-muted'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(n.createdAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card px-4 py-2 text-center min-w-[80px] hover:scale-105 transition-transform">
            <div className="text-2xl font-bold text-primary">{bookings.length}</div>
            <div className="text-xs text-muted-foreground uppercase">Total</div>
          </div>
          <div className="glass-card px-4 py-2 text-center min-w-[80px] hover:scale-105 transition-transform">
            <div className="text-2xl font-bold text-orange-400">{pendingCount}</div>
            <div className="text-xs text-muted-foreground uppercase">Pending</div>
          </div>
          <div className="glass-card px-4 py-2 text-center min-w-[80px] hover:scale-105 transition-transform">
            <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
            <div className="text-xs text-muted-foreground uppercase">Approved</div>
          </div>
          {urgentCount > 0 && (
            <div className="glass-card px-4 py-2 text-center min-w-[80px] border-destructive hover:scale-105 transition-transform">
              <div className="text-2xl font-bold text-destructive">{urgentCount}</div>
              <div className="text-xs text-destructive uppercase">Urgent</div>
            </div>
          )}
          <button onClick={() => navigate('/')} className="bg-primary/20 border border-primary text-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/30 hover:scale-105 transition-all flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {/* Click outside to close notification */}
      {showNotifications && <div className="fixed inset-0 z-[2999]" onClick={() => setShowNotifications(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 p-4 md:p-8">
        {/* Route Management */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <button onClick={() => setRouteExpanded(!routeExpanded)} className="w-full flex justify-between items-center border-b border-border pb-3 mb-5">
            <h3 className="text-primary font-display font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Route Management
            </h3>
            {routeExpanded ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-primary" />}
          </button>

          {routeExpanded && (
            <>
              {/* Add Pickup */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">Pickup Locations</label>
                <div className="flex gap-2">
                  <input value={newPickup} onChange={e => setNewPickup(e.target.value)} placeholder="Add pickup location" className="flex-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none hover:border-primary/50 transition-colors" />
                  <button onClick={addPickup} className="bg-primary text-primary-foreground px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/80 hover:scale-105 transition-all"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                {pickups.map(p => (
                  <div key={p} className="bg-primary/10 border border-border rounded-lg px-3 py-2.5 flex items-center justify-between hover:border-primary hover:bg-primary/15 transition-all group">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {p}
                    </span>
                    <button onClick={() => confirmDeletePickup(p)} className="text-destructive/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Dropoff Management */}
              <div className="border-t border-border pt-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">Drop-off Locations</label>
                <div className="flex flex-col gap-1 mb-3">
                  {pickups.map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPickupForDrop(selectedPickupForDrop === p ? '' : p)}
                      className={`w-full p-2.5 border rounded-lg text-sm text-left transition-all flex items-center justify-between hover:scale-[1.02] ${selectedPickupForDrop === p ? 'bg-primary/20 border-primary' : 'bg-primary/5 border-border hover:bg-primary/10 hover:border-primary/50'}`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {p}
                      </span>
                      <span className="text-xs text-muted-foreground">{(dropMap[p] || []).length} drop-offs</span>
                    </button>
                  ))}
                </div>

                {selectedPickupForDrop && (
                  <div className="bg-primary/5 border border-primary/30 rounded-xl p-3 mt-3 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-primary uppercase">Drop-offs for {selectedPickupForDrop}</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input value={newDropoff} onChange={e => setNewDropoff(e.target.value)} placeholder="Add dropoff" className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
                      <button onClick={addDropoff} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-bold hover:bg-primary/80 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(dropMap[selectedPickupForDrop] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No drop-off locations added yet</p>
                      ) : (
                        (dropMap[selectedPickupForDrop] || []).map(d => (
                          <div key={d} className="bg-accent/20 border border-border rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary transition-all group">
                            <span className="flex items-center gap-2 text-sm">
                              <ChevronRight className="w-3 h-3 text-primary" /> {d}
                            </span>
                            <button onClick={() => confirmDeleteDropoff(selectedPickupForDrop, d)} className="text-destructive/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-primary">{bookings.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Clients</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-primary">{pickups.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Routes</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bookings Panel */}
        <div className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
          <h3 className="text-primary font-display font-bold text-lg mb-5 pb-3 border-b border-border flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" /> Booking Requests
          </h3>

          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No bookings yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="text-left p-3 text-primary text-sm font-semibold">Customer</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Route</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Deadline</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Car</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-border hover:bg-primary/5 transition-colors group">
                      <td className="p-3">
                        <div className="font-semibold text-sm">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.whatsapp}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{b.pickup} → {b.dropoff}</div>
                        <div className="text-xs text-muted-foreground">{b.timing}</div>
                      </td>
                      <td className="p-3">
                        <DeadlineBadge startDate={b.startDate} />
                        <div className="text-[10px] text-muted-foreground mt-0.5">{b.startDate}</div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setStatusPopup(b.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all hover:scale-105 ${b.status === 'approved' ? 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30' : 'bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500/30'}`}
                        >
                          {b.status === 'approved' ? 'Approved' : 'Pending'}
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setCarPopup(b.id)}
                          className="px-3 py-1.5 bg-primary/15 border border-primary/50 rounded-lg text-xs font-medium hover:bg-primary/25 hover:scale-105 transition-all max-w-[180px] truncate"
                        >
                          {b.assignedCar ? <><Car className="w-3 h-3 inline mr-1" />{b.assignedCar}</> : 'Select Car'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => generateInvoicePDF(b)} className="bg-primary/20 hover:bg-primary/30 hover:scale-110 p-2 rounded-md transition-all" title="Download Invoice PDF"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => sendWhatsApp(b)} className="bg-green-600/20 hover:bg-green-600/30 hover:scale-110 p-2 rounded-md transition-all" title="WhatsApp"><MessageCircle className="w-4 h-4 text-green-400" /></button>
                          <button onClick={() => deleteBooking(b.id)} className="bg-destructive/20 hover:bg-destructive/30 hover:scale-110 p-2 rounded-md transition-all opacity-0 group-hover:opacity-100" title="Delete Booking"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Popup */}
      <PopupModal open={statusPopup !== null} onClose={() => setStatusPopup(null)} title="Update Booking Status">
        {activeBookingForStatus && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Change status for <span className="text-foreground font-semibold">{activeBookingForStatus.name}</span>
            </p>
            <PopupOption
              label="Pending"
              icon={<Clock className="w-4 h-4 text-orange-400" />}
              active={activeBookingForStatus.status === 'pending'}
              onClick={() => updateStatus(activeBookingForStatus.id, 'pending')}
            />
            <PopupOption
              label="Approved"
              icon={<CheckCircle className="w-4 h-4 text-green-400" />}
              active={activeBookingForStatus.status === 'approved'}
              onClick={() => updateStatus(activeBookingForStatus.id, 'approved')}
            />
          </div>
        )}
      </PopupModal>

      {/* Car Selection Popup */}
      <PopupModal open={carPopup !== null} onClose={() => setCarPopup(null)} title="Assign Vehicle">
        {activeBookingForCar && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Assign car for <span className="text-foreground font-semibold">{activeBookingForCar.name}</span>
            </p>
            {CARS_LIST.map(c => (
              <PopupOption
                key={c}
                label={c}
                icon={<Car className="w-4 h-4 text-primary" />}
                active={activeBookingForCar.assignedCar === c}
                onClick={() => assignCar(activeBookingForCar.id, c)}
              />
            ))}
          </div>
        )}
      </PopupModal>

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        itemName={deleteTarget?.name || ''}
      />
    </div>
  );
};

// Need this for the dropoff section
const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default AdminPanel;
