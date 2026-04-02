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
import carLiftLogo from "@/assets/carlift-logo.png";

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

// Load logo as base64 for PDF
function loadLogoBase64(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = carLiftLogo;
  });
}

// PDF Invoice Generator
async function generateInvoicePDF(b: Booking) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Load logo
  const logoBase64 = await loadLogoBase64();

  // === HEADER ===
  // Dark gradient header
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageW, 48, 'F');
  // Red accent line
  doc.setFillColor(255, 0, 0);
  doc.rect(0, 48, pageW, 3, 'F');

  // Logo in header
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 12, 6, 36, 36);
  }

  // Invoice title
  doc.setTextColor(255, 0, 0);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageW - 15, 20, { align: "right" });
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: #INV-${b.id}`, pageW - 15, 28, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - 15, 35, { align: "right" });
  doc.text("Premium Monthly Car Service", pageW - 15, 42, { align: "right" });

  // === BILLED TO SECTION ===
  const billedY = 62;
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(15, billedY, pageW - 30, 40, 3, 3, 'F');
  doc.setFillColor(255, 0, 0);
  doc.rect(15, billedY, 4, 40, 'F');

  doc.setTextColor(255, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO", 25, billedY + 12);

  doc.setTextColor(230, 230, 230);
  doc.setFontSize(12);
  doc.text(b.name, 25, billedY + 22);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(`WhatsApp: ${b.whatsapp}`, 25, billedY + 30);
  doc.text(`Start Date: ${b.startDate}`, 25, billedY + 37);

  // === TABLE ===
  const tableTop = billedY + 50;

  // Table header
  doc.setFillColor(255, 0, 0);
  doc.roundedRect(15, tableTop, pageW - 30, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 22, tableTop + 9.5);
  doc.text("DETAILS", pageW - 22, tableTop + 9.5, { align: "right" });

  const rows = [
    ["Pickup Location", b.pickup],
    ["Drop-off Location", b.dropoff],
    ["Timing Slot", b.timing],
    ["Vehicle Class", b.class],
    ["Assigned Vehicle", b.assignedCar || "To Be Assigned"],
    ["Payment Method", b.payment],
    ["Booking Status", b.status === 'approved' ? "APPROVED" : "PENDING"],
  ];

  let y = tableTop + 14;
  rows.forEach((row, i) => {
    const bgVal = i % 2 === 0 ? 22 : 15;
    doc.setFillColor(bgVal, bgVal, bgVal);
    doc.rect(15, y, pageW - 30, 13, 'F');

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(row[0], 22, y + 9);

    doc.setTextColor(230, 230, 230);
    doc.setFont("helvetica", "bold");
    doc.text(row[1], pageW - 22, y + 9, { align: "right" });
    y += 13;
  });

  // === TOTAL FARE BOX ===
  y += 10;
  doc.setFillColor(255, 0, 0);
  doc.roundedRect(pageW / 2 - 10, y, pageW / 2 - 5, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MONTHLY FARE", pageW / 2, y + 14);
  doc.setFontSize(16);
  doc.text(b.fare, pageW - 22, y + 14, { align: "right" });

  // === FOOTER ===
  const footerY = pageH - 35;
  doc.setFillColor(10, 10, 10);
  doc.rect(0, footerY, pageW, 35, 'F');
  doc.setFillColor(255, 0, 0);
  doc.rect(0, footerY, pageW, 2, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Car Lift - Premium Monthly Transportation Service", pageW / 2, footerY + 12, { align: "center" });
  doc.text("This is a system-generated invoice. No signature required.", pageW / 2, footerY + 18, { align: "center" });
  doc.text("For queries, contact via WhatsApp", pageW / 2, footerY + 24, { align: "center" });

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
          <img src={carLiftLogo} alt="Car Lift Admin" className="h-12 w-auto object-contain" />
          <span className="font-display text-lg font-bold text-primary uppercase tracking-wider">Admin</span>
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
                              <ChevronRightIcon className="w-3 h-3 text-primary" /> {d}
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

// ChevronRight icon
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default AdminPanel;
