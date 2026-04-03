import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown, MapPin, CalendarCheck, Trash2, MessageCircle, FileText, Plus, ArrowLeft, X, Car, CheckCircle, Clock,
  Bell, AlertTriangle, Shield, ChevronDown, ChevronUp, Users, TrendingUp, Timer, Settings,
  Image, DollarSign, BarChart3, Loader2, Wifi
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  getBookings, saveBookings, getPickupLocations, getDropoffMapping,
  savePickupLocations, saveDropoffMapping, CARS_LIST, ROUTES_DATA, type Booking, type RouteData, type PaymentInfo,
  getNotifications, markNotificationRead, markAllNotificationsRead, getDaysUntilDeadline,
  getCarImages, saveCarImages, parseFareAmount
} from "@/lib/store";
import {
  subscribeToBookings, updateBookingInFirestore, deleteBookingFromFirestore,
  saveAdminFCMToken, getCarImagesFromFirestore, saveCarImagesToFirestore,
  saveRoutesToFirestore, subscribeToRoutes, savePaymentInfoToFirestore, subscribeToPaymentInfo
} from "@/lib/firestoreStore";
import { getMessagingInstance, VAPID_KEY } from "@/lib/firebase";
import { getToken } from "firebase/messaging";

// Admin tabs
type AdminTab = 'bookings' | 'routes' | 'settings';

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

function loadLogoBase64(): Promise<string> {
  return Promise.resolve('');
}

async function generateInvoicePDF(b: Booking) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageW, 48, 'F');
  doc.setFillColor(255, 0, 0);
  doc.rect(0, 48, pageW, 3, 'F');

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

  const tableTop = billedY + 50;
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

  y += 10;
  doc.setFillColor(255, 0, 0);
  doc.roundedRect(pageW / 2 - 10, y, pageW / 2 - 5, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MONTHLY FARE", pageW / 2, y + 14);
  doc.setFontSize(16);
  doc.text(b.fare, pageW - 22, y + 14, { align: "right" });

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
  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>(getBookings());
  const [pickups, setPickups] = useState(getPickupLocations());
  const [dropMap, setDropMap] = useState(getDropoffMapping());
  const [newPickup, setNewPickup] = useState('');
  const [selectedPickupForDrop, setSelectedPickupForDrop] = useState('');
  const [newDropoff, setNewDropoff] = useState('');
  const [isRealtime, setIsRealtime] = useState(false);

  const [carPopup, setCarPopup] = useState<number | null>(null);
  const [statusPopup, setStatusPopup] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pickup' | 'dropoff'; name: string; parent?: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(getNotifications());
  const [routeExpanded, setRouteExpanded] = useState(true);

  // Car images state
  const [carImages, setCarImages] = useState<Record<string, string>>(getCarImages());
  const [uploadingCar, setUploadingCar] = useState<string | null>(null);
  const [savingImages, setSavingImages] = useState(false);

  // Routes management state
  const [routes, setRoutes] = useState<RouteData[]>(ROUTES_DATA);
  const [newRouteTitle, setNewRouteTitle] = useState('');
  const [newRouteTiming, setNewRouteTiming] = useState('');
  const [editingRoute, setEditingRoute] = useState<RouteData | null>(null);
  const [savingRoutes, setSavingRoutes] = useState(false);

  // Payment info state
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    easypaisa: { accName: '', accNumber: '' },
    jazzcash: { accName: '', accNumber: '' },
    bankTransfer: { accName: '', accNumber: '' },
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // FCM status
  const [fcmStatus, setFcmStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  // Switch to admin PWA manifest
  useEffect(() => {
    const existing = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
    const prev = existing?.href || '';
    if (existing) existing.href = '/manifest-admin.json';
    return () => { if (existing) existing.href = prev; };
  }, []);

  // Subscribe to routes from Firestore
  useEffect(() => {
    const unsub = subscribeToRoutes(r => { if (r.length) setRoutes(r); });
    return () => unsub();
  }, []);

  // Subscribe to payment info from Firestore
  useEffect(() => {
    const unsub = subscribeToPaymentInfo(info => setPaymentInfo(info));
    return () => unsub();
  }, []);

  // Firestore real-time subscription
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToBookings((firestoreBookings) => {
        setBookings(firestoreBookings);
        setIsRealtime(true);
        // Sync to localStorage as fallback
        saveBookings(firestoreBookings);
      });
    } catch {
      // Fallback to polling
      const interval = setInterval(() => {
        setBookings(getBookings());
        setNotifications(getNotifications());
      }, 2000);
      return () => clearInterval(interval);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  // Notification polling (localStorage)
  useEffect(() => {
    const interval = setInterval(() => setNotifications(getNotifications()), 3000);
    const onFocus = () => setNotifications(getNotifications());
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, []);

  // FCM token registration
  useEffect(() => {
    const registerFCM = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { setFcmStatus('denied'); return; }
        setFcmStatus('granted');

        const messaging = await getMessagingInstance();
        if (!messaging) return;

        // Register service worker
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
        if (token) {
          await saveAdminFCMToken(token);
          console.log('FCM token saved:', token.substring(0, 20) + '...');
        }
      } catch (err) {
        console.error('FCM registration error:', err);
      }
    };
    registerFCM();
  }, []);

  // Load car images from Firestore
  useEffect(() => {
    getCarImagesFromFirestore().then(imgs => {
      if (Object.keys(imgs).length > 0) {
        setCarImages(imgs);
        saveCarImages(imgs);
      }
    });
  }, []);

  // Revenue calculations
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const totalRevenue = bookings.reduce((sum, b) => sum + parseFareAmount(b.fare), 0);
  const collectedRevenue = approvedBookings.reduce((sum, b) => sum + parseFareAmount(b.fare), 0);
  const pendingRevenue = pendingBookings.reduce((sum, b) => sum + parseFareAmount(b.fare), 0);

  const formatRevenue = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return `${amount}`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;
  const urgentCount = bookings.filter(b => {
    const days = getDaysUntilDeadline(b.startDate);
    return days !== null && days >= 0 && days <= 3;
  }).length;

  const refresh = () => {
    setBookings(getBookings());
    setPickups(getPickupLocations());
    setDropMap(getDropoffMapping());
    setNotifications(getNotifications());
  };

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

  const updateStatus = async (id: number, status: 'pending' | 'approved') => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    saveBookings(updated);
    setBookings(updated);
    setStatusPopup(null);
    await updateBookingInFirestore(id, { status });
  };

  const assignCar = async (id: number, car: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, assignedCar: car } : b);
    saveBookings(updated);
    setBookings(updated);
    setCarPopup(null);
    await updateBookingInFirestore(id, { assignedCar: car });
  };

  const deleteBooking = async (id: number) => {
    const updated = bookings.filter(b => b.id !== id);
    saveBookings(updated);
    setBookings(updated);
    await deleteBookingFromFirestore(id);
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

  // Car image management — compress + save as base64
  const compressAndSave = async (carName: string, file: File) => {
    setUploadingCar(carName);
    setSavingImages(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
          const src = e.target?.result as string;
          const img = new window.Image();
          img.onerror = reject;
          img.onload = () => {
            const MAX = 480;
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
            else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.72));
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
      const updated = { ...carImages, [carName]: base64 };
      setCarImages(updated);
      saveCarImages(updated);
      await saveCarImagesToFirestore(updated);
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setUploadingCar(null);
      setSavingImages(false);
    }
  };

  const handleRemoveCarImage = async (carName: string) => {
    const updated = { ...carImages };
    delete updated[carName];
    setCarImages(updated);
    saveCarImages(updated);
    await saveCarImagesToFirestore(updated);
  };

  // Routes management handlers
  const handleAddRoute = async () => {
    if (!newRouteTitle.trim() || !newRouteTiming.trim()) return;
    setSavingRoutes(true);
    const newRoute: RouteData = {
      id: `r${Date.now()}`,
      title: newRouteTitle.trim(),
      timings: newRouteTiming.split(',').map(t => t.trim()).filter(Boolean),
    };
    const updated = [...routes, newRoute];
    setRoutes(updated);
    await saveRoutesToFirestore(updated);
    setNewRouteTitle('');
    setNewRouteTiming('');
    setSavingRoutes(false);
  };

  const handleSaveEditRoute = async () => {
    if (!editingRoute) return;
    setSavingRoutes(true);
    const updated = routes.map(r => r.id === editingRoute.id ? editingRoute : r);
    setRoutes(updated);
    await saveRoutesToFirestore(updated);
    setEditingRoute(null);
    setSavingRoutes(false);
  };

  const handleDeleteRoute = async (id: string) => {
    const updated = routes.filter(r => r.id !== id);
    setRoutes(updated);
    await saveRoutesToFirestore(updated);
  };

  // Payment info handler
  const handleSavePayment = async () => {
    setSavingPayment(true);
    await savePaymentInfoToFirestore(paymentInfo);
    setSavingPayment(false);
  };

  const activeBookingForCar = bookings.find(b => b.id === carPopup);
  const activeBookingForStatus = bookings.find(b => b.id === statusPopup);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-primary px-4 md:px-8 py-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 border border-primary/50 p-2 rounded-xl">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-primary uppercase tracking-wider">Admin Panel</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isRealtime ? (
                <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                  <Wifi className="w-2.5 h-2.5" /> Live
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Polling</span>
              )}
              {fcmStatus === 'granted' && (
                <span className="text-[10px] text-primary font-semibold">· Push ON</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
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
                      <button key={n.id} onClick={() => handleMarkRead(n.id)}
                        className={`w-full text-left px-4 py-3 border-b border-border/50 flex items-start gap-3 transition-colors hover:bg-primary/10 ${!n.read ? 'bg-primary/5' : ''}`}>
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

          {/* Stats */}
          <div className="glass-card px-3 py-2 text-center min-w-[70px] hover:scale-105 transition-transform">
            <div className="text-xl font-bold text-primary">{bookings.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Total</div>
          </div>
          <div className="glass-card px-3 py-2 text-center min-w-[70px] hover:scale-105 transition-transform">
            <div className="text-xl font-bold text-orange-400">{pendingCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Pending</div>
          </div>
          <div className="glass-card px-3 py-2 text-center min-w-[70px] hover:scale-105 transition-transform">
            <div className="text-xl font-bold text-green-400">{approvedCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Approved</div>
          </div>

          {/* Revenue Stats */}
          <div className="glass-card px-3 py-2 text-center min-w-[70px] hover:scale-105 transition-transform border-green-500/30">
            <div className="text-xl font-bold text-green-400">Rs {formatRevenue(collectedRevenue)}</div>
            <div className="text-[10px] text-green-400/70 uppercase">Collected</div>
          </div>
          <div className="glass-card px-3 py-2 text-center min-w-[70px] hover:scale-105 transition-transform border-orange-500/30">
            <div className="text-xl font-bold text-orange-400">Rs {formatRevenue(pendingRevenue)}</div>
            <div className="text-[10px] text-orange-400/70 uppercase">Pending</div>
          </div>

          {urgentCount > 0 && (
            <div className="glass-card px-3 py-2 text-center min-w-[70px] border-destructive hover:scale-105 transition-transform">
              <div className="text-xl font-bold text-destructive">{urgentCount}</div>
              <div className="text-[10px] text-destructive uppercase">Urgent</div>
            </div>
          )}
          <button onClick={() => navigate('/')} className="bg-primary/20 border border-primary text-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/30 hover:scale-105 transition-all flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {showNotifications && <div className="fixed inset-0 z-[2999]" onClick={() => setShowNotifications(false)} />}

      {/* Revenue Summary Bar */}
      <div className="bg-card/50 border-b border-border px-4 md:px-8 py-3 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground font-medium">Revenue Overview:</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-foreground" />
            <span className="text-xs text-muted-foreground">Total Generated:</span>
            <span className="text-xs font-bold text-foreground">Rs {totalRevenue.toLocaleString()}/mo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-muted-foreground">Collected:</span>
            <span className="text-xs font-bold text-green-400">Rs {collectedRevenue.toLocaleString()}/mo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-muted-foreground">Pending:</span>
            <span className="text-xs font-bold text-orange-400">Rs {pendingRevenue.toLocaleString()}/mo</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-4 md:px-8 pt-5 pb-1">
        {([
          { id: 'bookings', label: 'Bookings', icon: <CalendarCheck className="w-4 h-4" /> },
          { id: 'routes', label: 'Routes', icon: <MapPin className="w-4 h-4" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        ] as { id: AdminTab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id ? 'bg-card border-primary text-primary' : 'bg-card/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-card'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-8 pt-4">

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (
          <div className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
            <h3 className="text-primary font-display font-bold text-lg mb-5 pb-3 border-b border-border flex items-center gap-2">
              <CalendarCheck className="w-5 h-5" /> Booking Requests
              {isRealtime && <span className="ml-auto text-xs text-green-400 font-normal flex items-center gap-1"><Wifi className="w-3 h-3" /> Real-time</span>}
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
                      <th className="text-left p-3 text-primary text-sm font-semibold">Fare</th>
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
                          <span className="text-sm font-semibold text-primary">{b.fare}</span>
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
                            {b.assignedCar ? (
                              <span className="flex items-center gap-1">
                                {carImages[b.assignedCar] && (
                                  <img src={carImages[b.assignedCar]} alt="" className="w-5 h-4 object-cover rounded" />
                                )}
                                <Car className="w-3 h-3 inline" />{b.assignedCar}
                              </span>
                            ) : 'Select Car'}
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
        )}

        {/* ── ROUTES TAB ── */}
        {activeTab === 'routes' && (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <button onClick={() => setRouteExpanded(!routeExpanded)} className="w-full flex justify-between items-center border-b border-border pb-3 mb-5">
                <h3 className="text-primary font-display font-bold text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Route Management
                </h3>
                {routeExpanded ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-primary" />}
              </button>

              {routeExpanded && (
                <>
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

                  <div className="border-t border-border pt-4">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">Drop-off Locations</label>
                    <div className="flex flex-col gap-1 mb-3">
                      {pickups.map(p => (
                        <button key={p}
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

            {/* Route Info Panel */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-primary font-display font-bold text-lg mb-5 pb-3 border-b border-border flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Route Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pickups.map(p => (
                  <div key={p} className="bg-primary/5 border border-border rounded-xl p-4 hover:border-primary transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{p}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(dropMap[p] || []).map(d => (
                        <div key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRightIcon className="w-3 h-3 text-primary/60" /> {d}
                        </div>
                      ))}
                      {(dropMap[p] || []).length === 0 && (
                        <p className="text-xs text-muted-foreground/50 italic">No drop-offs configured</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6">

            {/* ── Routes Management ── */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-primary font-display font-bold text-lg mb-2 pb-3 border-b border-border flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Routes Management
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Add, edit or delete routes. Changes reflect instantly in the user panel.</p>

              {/* Existing routes list */}
              <div className="flex flex-col gap-2 mb-5">
                {routes.map(route => (
                  <div key={route.id} className="bg-primary/5 border border-border rounded-xl p-3 hover:border-primary/40 transition-all">
                    {editingRoute?.id === route.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editingRoute.title}
                          onChange={e => setEditingRoute({ ...editingRoute, title: e.target.value })}
                          placeholder="Route title (From → To)"
                          className="px-3 py-2 bg-input border border-primary/50 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none w-full"
                        />
                        <input
                          value={editingRoute.timings.join(', ')}
                          onChange={e => setEditingRoute({ ...editingRoute, timings: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                          placeholder="Timings (comma-separated)"
                          className="px-3 py-2 bg-input border border-primary/50 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none w-full"
                        />
                        <div className="flex gap-2">
                          <button onClick={handleSaveEditRoute} disabled={savingRoutes} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/85 transition-all flex items-center gap-1.5 disabled:opacity-50">
                            {savingRoutes ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
                          </button>
                          <button onClick={() => setEditingRoute(null)} className="bg-muted px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-muted/80 transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{route.title}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {route.timings.map((t, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 text-muted-foreground">
                                <Clock className="w-2.5 h-2.5 text-primary" />{t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => setEditingRoute(route)} className="bg-primary/20 hover:bg-primary/30 p-1.5 rounded-lg transition-all" title="Edit">
                            <Settings className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button onClick={() => handleDeleteRoute(route.id)} className="bg-destructive/20 hover:bg-destructive/30 p-1.5 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new route */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Add New Route</p>
                <div className="flex flex-col gap-2">
                  <input
                    value={newRouteTitle}
                    onChange={e => setNewRouteTitle(e.target.value)}
                    placeholder="Route title, e.g. Gulistan-e-Johar → PECHS"
                    className="px-3 py-2.5 bg-input border border-primary/50 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    value={newRouteTiming}
                    onChange={e => setNewRouteTiming(e.target.value)}
                    placeholder="Timing(s), e.g. 7:30 AM – 1:45 PM, 10:00 AM – 6:00 PM"
                    className="px-3 py-2.5 bg-input border border-primary/50 rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleAddRoute}
                    disabled={savingRoutes || !newRouteTitle.trim() || !newRouteTiming.trim()}
                    className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/85 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingRoutes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Route
                  </button>
                </div>
              </div>
            </div>

            {/* ── Payment Info Management ── */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-primary font-display font-bold text-lg mb-2 pb-3 border-b border-border flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Payment Account Details
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Set your account details. When a user taps a payment method, a popup shows these details with a copy button.</p>

              <div className="flex flex-col gap-4">
                {([
                  { key: 'easypaisa', label: 'Easypaisa', color: 'text-green-400 border-green-500/30 bg-green-500/5' },
                  { key: 'jazzcash', label: 'JazzCash', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
                  { key: 'bankTransfer', label: 'Bank Transfer', color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
                ] as const).map(({ key, label, color }) => (
                  <div key={key} className={`border rounded-xl p-4 ${color}`}>
                    <p className="font-bold text-sm mb-3">{label}</p>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-xs uppercase tracking-wider opacity-70 mb-1 block">Account Name</label>
                        <input
                          value={paymentInfo[key].accName}
                          onChange={e => setPaymentInfo(prev => ({ ...prev, [key]: { ...prev[key], accName: e.target.value } }))}
                          placeholder={`${label} account name`}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider opacity-70 mb-1 block">Account Number</label>
                        <input
                          value={paymentInfo[key].accNumber}
                          onChange={e => setPaymentInfo(prev => ({ ...prev, [key]: { ...prev[key], accNumber: e.target.value } }))}
                          placeholder={`${label} number`}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSavePayment}
                  disabled={savingPayment}
                  className="bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/85 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingPayment ? 'Saving...' : 'Save Payment Details'}
                </button>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Car Image Management */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-primary font-display font-bold text-lg mb-2 pb-3 border-b border-border flex items-center gap-2">
                <Image className="w-5 h-5" /> Car Images
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Upload photos from your phone or PC. Tap the <span className="text-primary font-semibold">image icon</span> next to any car to select a photo. Works on mobile camera too.</p>

              <div className="flex flex-col gap-3">
                {CARS_LIST.map(car => (
                  <div key={car} className="bg-primary/5 border border-border rounded-xl p-3 hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      {carImages[car] ? (
                        <img
                          src={carImages[car]}
                          alt={car}
                          className="w-14 h-10 object-cover rounded-lg border border-primary/30 flex-shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-14 h-10 bg-primary/10 rounded-lg border border-border flex items-center justify-center flex-shrink-0">
                          <Car className="w-5 h-5 text-primary/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{car}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {carImages[car] ? 'Image set' : 'No image'}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {/* Hidden file input */}
                        <label
                          htmlFor={`car-img-${car.replace(/\s/g, '-')}`}
                          className="cursor-pointer bg-primary/20 hover:bg-primary/30 p-1.5 rounded-lg transition-all hover:scale-110 flex items-center"
                          title="Upload photo from device"
                        >
                          {uploadingCar === car
                            ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                            : <Image className="w-3.5 h-3.5 text-primary" />}
                        </label>
                        <input
                          id={`car-img-${car.replace(/\s/g, '-')}`}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) compressAndSave(car, file);
                            e.target.value = '';
                          }}
                        />
                        {carImages[car] && (
                          <button
                            onClick={() => handleRemoveCarImage(car)}
                            className="bg-destructive/20 hover:bg-destructive/30 p-1.5 rounded-lg transition-all hover:scale-110"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Details */}
            <div className="flex flex-col gap-6">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-primary font-display font-bold text-lg mb-5 pb-3 border-b border-border flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Revenue Summary
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-xl">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Generated</p>
                      <p className="text-2xl font-bold text-primary">Rs {totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per month · {bookings.length} clients</p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-green-500/20 p-3 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Collected (Approved)</p>
                      <p className="text-2xl font-bold text-green-400">Rs {collectedRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{approvedBookings.length} approved bookings</p>
                    </div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-orange-500/20 p-3 rounded-xl">
                      <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Revenue</p>
                      <p className="text-2xl font-bold text-orange-400">Rs {pendingRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{pendingBookings.length} pending bookings</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Car Revenue */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-primary font-display font-bold text-lg mb-5 pb-3 border-b border-border flex items-center gap-2">
                  <Car className="w-5 h-5" /> Per-Vehicle Revenue
                </h3>
                <div className="flex flex-col gap-2">
                  {CARS_LIST.map(car => {
                    const carBookings = bookings.filter(b => b.assignedCar === car);
                    if (carBookings.length === 0) return null;
                    const carRevenue = carBookings.reduce((s, b) => s + parseFareAmount(b.fare), 0);
                    return (
                      <div key={car} className="flex items-center gap-3 bg-primary/5 border border-border rounded-lg px-3 py-2.5 hover:border-primary transition-all">
                        {carImages[car] ? (
                          <img src={carImages[car]} alt="" className="w-10 h-7 object-cover rounded flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <Car className="w-5 h-5 text-primary/60 flex-shrink-0" />
                        )}
                        <span className="flex-1 text-xs font-medium text-foreground truncate">{car}</span>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-primary">Rs {carRevenue.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">{carBookings.length} booking{carBookings.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                  {bookings.filter(b => b.assignedCar).length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No cars assigned yet</p>
                  )}
                </div>
              </div>

              {/* Push Notification Status */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-primary font-display font-bold text-lg mb-4 pb-3 border-b border-border flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Push Notifications
                </h3>
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${fcmStatus === 'granted' ? 'bg-green-500/10 border-green-500/30' : fcmStatus === 'denied' ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/30'}`}>
                  <Bell className={`w-5 h-5 ${fcmStatus === 'granted' ? 'text-green-400' : fcmStatus === 'denied' ? 'text-destructive' : 'text-primary'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${fcmStatus === 'granted' ? 'text-green-400' : fcmStatus === 'denied' ? 'text-destructive' : 'text-primary'}`}>
                      {fcmStatus === 'granted' ? 'Push Notifications Active' : fcmStatus === 'denied' ? 'Notifications Denied' : 'Setting up notifications...'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fcmStatus === 'granted' ? 'You will receive alerts for new bookings even when the app is closed.' : fcmStatus === 'denied' ? 'Enable notifications in browser settings to receive booking alerts.' : 'Requesting notification permission...'}
                    </p>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-2 text-xs ${isRealtime ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <Wifi className="w-3.5 h-3.5" />
                  {isRealtime ? 'Firestore real-time connection active' : 'Using localStorage polling (Firestore connecting...)'}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Status Popup */}
      <PopupModal open={statusPopup !== null} onClose={() => setStatusPopup(null)} title="Update Booking Status">
        {activeBookingForStatus && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Change status for <span className="text-foreground font-semibold">{activeBookingForStatus.name}</span>
            </p>
            <PopupOption label="Pending" icon={<Clock className="w-4 h-4 text-orange-400" />} active={activeBookingForStatus.status === 'pending'} onClick={() => updateStatus(activeBookingForStatus.id, 'pending')} />
            <PopupOption label="Approved" icon={<CheckCircle className="w-4 h-4 text-green-400" />} active={activeBookingForStatus.status === 'approved'} onClick={() => updateStatus(activeBookingForStatus.id, 'approved')} />
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
              <PopupOption key={c} label={c}
                icon={
                  carImages[c]
                    ? <img src={carImages[c]} alt="" className="w-8 h-6 object-cover rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <Car className="w-4 h-4 text-primary" />
                }
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

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default AdminPanel;
