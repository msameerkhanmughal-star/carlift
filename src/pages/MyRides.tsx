import { getBookings } from "@/lib/store";
import { Car, MapPin, Clock, User, Phone, CreditCard, CalendarDays, Star } from "lucide-react";

const MyRides = () => {
  const bookings = getBookings();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">
      <h2 className="font-display text-2xl md:text-3xl text-center mb-8 gradient-text font-bold">My Rides</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <Car className="w-16 h-16 text-primary/40 mx-auto mb-4" />
          <h3 className="font-display text-xl text-muted-foreground">No Rides Yet</h3>
          <p className="text-muted-foreground text-sm mt-2">Book your first monthly ride to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map(b => (
            <div key={b.id} className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h4 className="text-primary font-display text-lg font-bold mb-2">{b.pickup} → {b.dropoff}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{b.name}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{b.whatsapp}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{b.timing}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{b.class}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{b.startDate}</span>
                  <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />{b.fare}</span>
                  <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{b.assignedCar || 'Not assigned'}</span>
                </div>
              </div>
              <div className={`px-5 py-2 rounded-full font-semibold text-sm border ${b.status === 'approved' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}>
                {b.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRides;
