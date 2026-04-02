import { Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
  const isAdmin = location.pathname === '/carlift-admin';

  if (isAdmin) return null;

  return (
    <nav className="bg-background/95 backdrop-blur-md px-4 md:px-6 py-3 flex justify-between items-center border-b-2 border-primary sticky top-0 z-[1000] flex-wrap gap-3">
      <Link to="/" className="flex items-center gap-2.5">
        <img src={carLiftLogo} alt="Car Lift" className="h-10 w-auto object-contain" />
      </Link>
      <div className="flex gap-4 md:gap-6 items-center flex-wrap">
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
      </div>
    </nav>
  );
};

export { SlidingBanner, Navbar };
