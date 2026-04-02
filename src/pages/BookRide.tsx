import { useState, useEffect } from "react";
import { MapPin, Clock, Star, CalendarDays, CreditCard, User, Phone, ChevronLeft, ChevronRight, CheckCircle2, X, Navigation } from "lucide-react";
import {
  getPickupLocations, getDropoffMapping, ROUTE_TIMINGS, ROUTES_DATA,
  calculateFare, getBookings, saveBookings, addNotification, type Booking
} from "@/lib/store";
import { saveBookingToFirestore, addNotificationToFirestore } from "@/lib/firestoreStore";

// Route Carousel - Enhanced
const RouteCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % ROUTES_DATA.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-10">
      <h2 className="font-display text-2xl md:text-3xl text-center mb-6 gradient-text font-bold">Our Routes</h2>
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/60" style={{ background: 'linear-gradient(135deg, hsl(0 0% 5%), hsl(0 30% 8%))' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsla(0,70%,45%,0.15),transparent_60%)]" />
        <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]" style={{ transform: `translateX(-${current * 100}%)` }}>
          {ROUTES_DATA.map((route, i) => (
            <div key={i} className="min-w-full p-10 text-center relative">
              <div className="absolute top-4 right-4 bg-primary/20 border border-primary/40 rounded-full px-3 py-1 text-xs text-primary font-semibold">
                Route {i + 1}/{ROUTES_DATA.length}
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/40 rounded-full px-4 py-1.5 mb-4">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-semibold uppercase tracking-wider">Active Route</span>
              </div>
              <h3 className="font-display text-xl md:text-3xl text-foreground mb-5 font-bold">
                <span className="text-primary">{route.title.split(' → ')[0]}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <span className="text-primary">{route.title.split(' → ')[1]}</span>
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {route.timings.map((t, j) => (
                  <span key={j} className="inline-flex items-center gap-2 bg-primary/20 border border-primary/50 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/30 transition-colors">
                    <Clock className="w-4 h-4 text-primary" />{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setCurrent(c => (c - 1 + ROUTES_DATA.length) % ROUTES_DATA.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-primary/90 hover:bg-primary hover:scale-110 p-2.5 rounded-full transition-all shadow-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setCurrent(c => (c + 1) % ROUTES_DATA.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/90 hover:bg-primary hover:scale-110 p-2.5 rounded-full transition-all shadow-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex justify-center gap-2.5 mt-5">
        {ROUTES_DATA.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-primary w-8' : 'bg-primary/30 w-2.5 hover:bg-primary/50'}`} />
        ))}
      </div>
    </div>
  );
};

// Selection Modal
const SelectionModal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-background/95 z-[2000] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-2xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-primary pb-3 mb-4">
          <h3 className="text-primary font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-primary hover:text-primary/70 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const OptionButton = ({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) => (
  <button onClick={onClick} className="w-full p-3.5 my-1.5 bg-primary/10 border border-border rounded-lg hover:bg-primary/25 hover:border-primary hover:scale-[1.02] transition-all text-left text-sm font-medium flex items-center gap-3">
    {icon} {label}
  </button>
);

// Calendar Modal
const CalendarModal = ({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (date: string) => void }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState('');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const selectDate = (d: number) => {
    const dateStr = `${d} ${months[month]} ${year}`;
    setSelected(dateStr);
    onSelect(dateStr);
    onClose();
  };

  if (!open) return null;

  return (
    <SelectionModal open={open} onClose={onClose} title="Select Start Date">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="bg-primary hover:bg-primary/80 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">Prev</button>
        <span className="font-bold text-lg">{months[month]} {year}</span>
        <button onClick={() => changeMonth(1)} className="bg-primary hover:bg-primary/80 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map(d => <div key={d} className="font-bold text-primary text-xs py-1">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: lastDate }).map((_, i) => {
          const dateStr = `${i + 1} ${months[month]} ${year}`;
          return (
            <button key={i} onClick={() => selectDate(i + 1)} className={`p-2 rounded-lg text-sm transition-all hover:scale-105 ${dateStr === selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 hover:bg-primary/30'}`}>
              {i + 1}
            </button>
          );
        })}
      </div>
    </SelectionModal>
  );
};

// Main Booking Page
const BookRide = () => {
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [timing, setTiming] = useState('');
  const [carClass, setCarClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [payments, setPayments] = useState<string[]>([]);

  const [modal, setModal] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pickups, setPickups] = useState<string[]>([]);
  const [dropMap, setDropMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setPickups(getPickupLocations());
    setDropMap(getDropoffMapping());
  }, [modal]);

  const fare = calculateFare(pickup, dropoff);

  const togglePayment = (p: string) => {
    setPayments(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || whatsapp.length !== 11) { alert('Valid name and 11-digit WhatsApp required'); return; }
    if (!pickup || !dropoff || !timing || !carClass || !startDate) { alert('Complete all fields'); return; }
    if (payments.length === 0) { alert('Select payment method'); return; }

    const bookingId = Date.now();
    const newBooking: Booking = {
      id: bookingId,
      name: fullName, whatsapp, pickup, dropoff, timing,
      class: carClass, startDate, payment: payments.join(', '),
      fare: `Rs ${fare?.total}/month`, status: 'pending', assignedCar: '',
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage (primary fallback)
    const bookings = getBookings();
    bookings.unshift(newBooking);
    saveBookings(bookings);

    // Save to Firestore (real-time + push notifications)
    await saveBookingToFirestore(newBooking);

    // Add notification (localStorage + Firestore)
    const notifMsg = `New booking from ${fullName} (${pickup} → ${dropoff})`;
    addNotification(notifMsg, bookingId);
    await addNotificationToFirestore(notifMsg, bookingId);

    setShowSuccess(true);
    setFullName(''); setWhatsapp(''); setPickup(''); setDropoff('');
    setTiming(''); setCarClass(''); setStartDate(''); setPayments([]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">
      <RouteCarousel />

      <div className="glass-card p-6 md:p-8">
        <h2 className="font-display text-xl md:text-2xl text-center mb-8 gradient-text font-bold">Monthly Plan Booking</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors hover:border-primary/70" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />WhatsApp (11 digits)</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} maxLength={11} className="px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors hover:border-primary/70" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Pickup Location</label>
              <button type="button" onClick={() => setModal('pickup')} className={`px-4 py-3 bg-input border rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${pickup ? 'border-primary bg-primary/10' : 'border-primary/50'}`}>
                {pickup || 'Select pickup'}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Drop-off Location</label>
              <button type="button" onClick={() => { if (!pickup) { alert('Select pickup first'); return; } setModal('dropoff'); }} className={`px-4 py-3 bg-input border rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${dropoff ? 'border-primary bg-primary/10' : 'border-primary/50'}`}>
                {dropoff || 'Select dropoff'}
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Timing Slot</label>
              <button type="button" onClick={() => { if (!pickup || !dropoff) { alert('Select route first'); return; } setModal('timing'); }} className={`px-4 py-3 bg-input border rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${timing ? 'border-primary bg-primary/10' : 'border-primary/50'}`}>
                {timing || 'Select timing'}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />Vehicle Class</label>
              <button type="button" onClick={() => setModal('class')} className={`px-4 py-3 bg-input border rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${carClass ? 'border-primary bg-primary/10' : 'border-primary/50'}`}>
                {carClass || 'Select class'}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Start Date</label>
              <button type="button" onClick={() => setModal('calendar')} className={`px-4 py-3 bg-input border rounded-lg text-left transition-all hover:border-primary hover:bg-primary/5 ${startDate ? 'border-primary bg-primary/10' : 'border-primary/50'}`}>
                {startDate || 'Select start date'}
              </button>
            </div>
          </div>

          {/* Fare */}
          <div className="mt-6">
            <label className="font-semibold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2"><CreditCard className="w-3.5 h-3.5" />Monthly Fare (incl. 11% SRB Tax)</label>
            <div className="bg-input border border-primary/50 rounded-lg p-3 text-center font-bold">
              {fare ? <span className="text-primary text-lg">Rs {fare.total}/month <span className="text-muted-foreground text-sm font-normal">({fare.km} km daily)</span></span> : '-- PKR'}
            </div>
          </div>

          {/* Payment */}
          <div className="mt-6">
            <label className="font-semibold text-primary text-xs uppercase tracking-wider mb-3 block">Payment Method</label>
            <div className="flex flex-wrap gap-3">
              {['Easypaisa', 'JazzCash', 'Bank Transfer'].map(p => (
                <button key={p} type="button" onClick={() => togglePayment(p)}
                  className={`px-5 py-3 border rounded-lg font-medium text-sm transition-all hover:scale-105 ${payments.includes(p) ? 'bg-primary/30 border-primary shadow-[0_0_10px_hsla(0,70%,45%,0.4)]' : 'bg-input border-primary/50 hover:border-primary hover:bg-primary/10'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full mt-8 py-4 bg-gradient-to-r from-primary to-destructive border-none rounded-xl font-display font-bold text-lg text-primary-foreground hover:opacity-90 hover:scale-[1.01] transition-all">
            Confirm Monthly Booking
          </button>
        </form>
      </div>

      {/* Modals */}
      <SelectionModal open={modal === 'pickup'} onClose={() => setModal(null)} title="Select Pickup">
        {pickups.map(l => <OptionButton key={l} label={l} icon={<MapPin className="w-4 h-4 text-primary" />} onClick={() => { setPickup(l); setDropoff(''); setTiming(''); setModal(null); }} />)}
      </SelectionModal>

      <SelectionModal open={modal === 'dropoff'} onClose={() => setModal(null)} title="Select Drop-off">
        {(dropMap[pickup] || []).map(d => <OptionButton key={d} label={d} icon={<MapPin className="w-4 h-4 text-primary" />} onClick={() => { setDropoff(d); setModal(null); }} />)}
      </SelectionModal>

      <SelectionModal open={modal === 'timing'} onClose={() => setModal(null)} title="Select Timing">
        {(ROUTE_TIMINGS[`${pickup}→${dropoff}`] || []).map(t => <OptionButton key={t} label={t} icon={<Clock className="w-4 h-4 text-primary" />} onClick={() => { setTiming(t); setModal(null); }} />)}
      </SelectionModal>

      <SelectionModal open={modal === 'class'} onClose={() => setModal(null)} title="Vehicle Class">
        {['Executive', 'Pro Executive'].map(c => <OptionButton key={c} label={c} icon={<Star className="w-4 h-4 text-primary" />} onClick={() => { setCarClass(c); setModal(null); }} />)}
      </SelectionModal>

      <CalendarModal open={modal === 'calendar'} onClose={() => setModal(null)} onSelect={setStartDate} />

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-background/95 z-[2000] flex justify-center items-center p-4">
          <div className="bg-card border-2 border-primary rounded-2xl p-8 max-w-md w-full text-center animate-fade-in-up">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-primary font-bold mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground mb-6">Your monthly package request is pending approval.</p>
            <button onClick={() => setShowSuccess(false)} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all hover:scale-105">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRide;
