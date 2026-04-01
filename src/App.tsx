import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SlidingBanner, Navbar } from "@/components/Layout";
import BookRide from "./pages/BookRide";
import MyRides from "./pages/MyRides";
import AuthPage from "./pages/AuthPage";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SlidingBanner />
        <Navbar />
        <Routes>
          <Route path="/" element={<BookRide />} />
          <Route path="/my-rides" element={<MyRides />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/carlift-admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
