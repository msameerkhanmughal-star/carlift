import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, MapPin, CalendarCheck, Trash2, MessageCircle, FileText, Car, Plus, ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";
import {
  getBookings, saveBookings, getPickupLocations, getDropoffMapping,
  savePickupLocations, saveDropoffMapping, CARS_LIST, getCurrentUser, type Booking
} from "@/lib/store";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>(getBookings());
  const [pickups, setPickups] = useState(getPickupLocations());
  const [dropMap, setDropMap] = useState(getDropoffMapping());
  const [newPickup, setNewPickup] = useState('');
  const [selectedPickupForDrop, setSelectedPickupForDrop] = useState('');
  const [newDropoff, setNewDropoff] = useState('');

  const refresh = () => {
    setBookings(getBookings());
    setPickups(getPickupLocations());
    setDropMap(getDropoffMapping());
  };

  // Auto-refresh bookings every 2 seconds and on window focus
  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;

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

  const deletePickup = (p: string) => {
    const updated = pickups.filter(l => l !== p);
    const updatedMap = { ...dropMap };
    delete updatedMap[p];
    savePickupLocations(updated);
    saveDropoffMapping(updatedMap);
    setPickups(updated);
    setDropMap(updatedMap);
  };

  const addDropoff = () => {
    if (selectedPickupForDrop && newDropoff && !dropMap[selectedPickupForDrop]?.includes(newDropoff)) {
      const updatedMap = { ...dropMap, [selectedPickupForDrop]: [...(dropMap[selectedPickupForDrop] || []), newDropoff] };
      saveDropoffMapping(updatedMap);
      setDropMap(updatedMap);
      setNewDropoff('');
    }
  };

  const deleteDropoff = (pick: string, drop: string) => {
    const updatedMap = { ...dropMap, [pick]: dropMap[pick].filter(d => d !== drop) };
    saveDropoffMapping(updatedMap);
    setDropMap(updatedMap);
  };

  const updateStatus = (id: number, status: 'pending' | 'approved') => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    saveBookings(updated);
    setBookings(updated);
  };

  const assignCar = (id: number, car: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, assignedCar: car } : b);
    saveBookings(updated);
    setBookings(updated);
  };

  const sendWhatsApp = (b: Booking) => {
    window.open(`https://wa.me/${b.whatsapp}?text=Your%20booking%20${b.status}`, '_blank');
  };

  const generateInvoice = (b: Booking) => {
    alert(`CAR LIFT INVOICE\nCustomer: ${b.name}\nRoute: ${b.pickup}→${b.dropoff}\nCar: ${b.assignedCar || 'TBD'}\nFare: ${b.fare}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-primary px-4 md:px-8 py-5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Crown className="w-7 h-7 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold gradient-text">CAR LIFT ADMIN</h1>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="glass-card px-4 py-2 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-primary">{bookings.length}</div>
            <div className="text-xs text-muted-foreground uppercase">Total</div>
          </div>
          <div className="glass-card px-4 py-2 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-orange-400">{pendingCount}</div>
            <div className="text-xs text-muted-foreground uppercase">Pending</div>
          </div>
          <div className="glass-card px-4 py-2 text-center min-w-[80px]">
            <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
            <div className="text-xs text-muted-foreground uppercase">Approved</div>
          </div>
          <button onClick={() => navigate('/')} className="bg-primary/20 border border-primary text-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/30 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 p-4 md:p-8">
        {/* Route Management */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-primary font-display font-bold text-lg mb-5 pb-3 border-b border-border flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Route Management
          </h3>

          <div className="mb-4">
            <div className="flex gap-2">
              <input value={newPickup} onChange={e => setNewPickup(e.target.value)} placeholder="Add pickup location" className="flex-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
              <button onClick={addPickup} className="bg-primary text-primary-foreground px-3 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {pickups.map(p => (
              <div key={p} className="bg-primary/15 border border-primary rounded-full px-3 py-1.5 flex items-center gap-2 text-sm">
                📍 {p}
                <button onClick={() => deletePickup(p)} className="text-destructive hover:text-destructive/70"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <select value={selectedPickupForDrop} onChange={e => setSelectedPickupForDrop(e.target.value)} className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground mb-3 focus:border-primary focus:outline-none">
              <option value="">Select Pickup for Dropoffs</option>
              {pickups.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {selectedPickupForDrop && (
              <>
                <div className="flex gap-2 mb-3">
                  <input value={newDropoff} onChange={e => setNewDropoff(e.target.value)} placeholder="Add dropoff" className="flex-1 px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none" />
                  <button onClick={addDropoff} className="bg-primary text-primary-foreground px-3 py-2.5 rounded-lg text-sm font-bold hover:opacity-90"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(dropMap[selectedPickupForDrop] || []).map(d => (
                    <div key={d} className="bg-accent/30 border border-primary/50 rounded-full px-3 py-1.5 flex items-center gap-2 text-sm">
                      ➡️ {d}
                      <button onClick={() => deleteDropoff(selectedPickupForDrop, d)} className="text-destructive hover:text-destructive/70"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="text-left p-3 text-primary text-sm font-semibold">Customer</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Route</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Car</th>
                    <th className="text-left p-3 text-primary text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-border hover:bg-primary/5 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-sm">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.whatsapp}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{b.pickup} → {b.dropoff}</div>
                        <div className="text-xs text-muted-foreground">{b.timing}</div>
                      </td>
                      <td className="p-3">
                        <select value={b.status} onChange={e => updateStatus(b.id, e.target.value as 'pending' | 'approved')} className="bg-input border border-primary text-foreground px-2 py-1.5 rounded-md text-sm focus:outline-none">
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select defaultValue={b.assignedCar} onChange={e => assignCar(b.id, e.target.value)} className="bg-input border border-primary text-foreground px-2 py-1.5 rounded-md text-xs max-w-[180px] focus:outline-none">
                          <option value="">Select car</option>
                          {CARS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => generateInvoice(b)} className="bg-primary/20 hover:bg-primary/30 p-2 rounded-md transition-colors" title="Invoice"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => sendWhatsApp(b)} className="bg-green-600/20 hover:bg-green-600/30 p-2 rounded-md transition-colors" title="WhatsApp"><MessageCircle className="w-4 h-4 text-green-400" /></button>
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
    </div>
  );
};

export default AdminPanel;
