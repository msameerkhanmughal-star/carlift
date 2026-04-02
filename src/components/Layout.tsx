import { useState, useEffect } from "react";
import { Phone, LogIn, LogOut, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import carLiftLogo from "@/assets/carlift-logo-new.png";

const SlidingBanner = () => (
  <div className="sliding-banner-bg overflow-hidden whitespace-nowrap border-b-2 border-primary py-3 relative z-50">
    <div className="flex w-max">
      {[0, 1].map((i) => (
        <div key={i} className="inline-block animate-slide whitespace-nowrap pr-8 font-display font-black text-xl md:text-2xl uppercase tracking-wider text-primary-foreground" style={{ textShadow: '2px 2px 0 hsl(0 30% 10%)' }}>
          MONTHLY PACKAGES ONLY &nbsp;&nbsp;|&nbsp;&nbsp; 25K TO 50K + TAX &nbsp;&nbsp;|&nbsp;&nbsp; PREMIUM CAR LIFT
        </div>
      ))}
    </div>
  </div>
);

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname === '/carlift-admin';
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (isAdmin) return null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <nav className="bg-background/95 backdrop-blur-md px-4 md:px-8 py-3 flex justify-between items-center border-b-2 border-primary sticky top-0 z-[1000] flex-wrap gap-3">
      <Link to="/" className="flex items-center gap-3">
        <img
          src={carLiftLogo}
          alt="Car Lift"
          className="h-20 md:h-24 w-auto object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
        />
      </Link>
      <div className="flex gap-3 md:gap-5 items-center flex-wrap">
        <Link
          to="/"
          className={`font-semibold transition-colors hover:text-primary ${location.pathname === '/' ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'}`}
        >
          Book Ride
        </Link>
        <Link
          to="/my-rides"
          className={`font-semibold transition-colors hover:text-primary ${location.pathname === '/my-rides' ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground'}`}
        >
          My Rides
        </Link>
        <a
          href="https://wa.me/923099926777?text=Hello"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 text-primary-foreground px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm transition-colors"
        >
          <Phone className="w-4 h-4" /> WhatsApp
        </a>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full">
              <User className="w-3.5 h-3.5 text-primary" />
              {user.email?.split('@')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 text-sm transition-all hover:scale-105"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm transition-all hover:scale-105"
          >
            <LogIn className="w-4 h-4" /> Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export { SlidingBanner, Navbar };
