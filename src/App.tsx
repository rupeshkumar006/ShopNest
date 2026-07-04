import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
// Services and ServiceBooking pages removed
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Favorites from "./pages/Favorites";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import { useState, useEffect } from "react";
import Preloader from "./components/Preloader";
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { UserAuthProvider, useUserAuth } from './context/UserAuthContext';
import { cartService } from './services';
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import { FavoritesProvider } from './context/FavoritesContext';
import VerifyOTP from './pages/VerifyOTP';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfSale from './pages/TermsOfSale';
import ShippingPolicy from './pages/ShippingPolicy';
import ReturnRefund from './pages/ReturnRefund';
import Cancellation from './pages/Cancellation';
import Contact from './pages/Contact';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, loading } = useUserAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const PublicProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { loading } = useUserAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return children;
};

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoggedIn, isVerified, loading } = useUserAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  // Allow unverified users to access /register and /verify-otp
  if ((location.pathname === '/register' || location.pathname === '/verify-otp') && (!isLoggedIn || !isVerified)) {
    return children;
  }
  // For login page, don't redirect logged-in users - let the login page handle redirects
  if (location.pathname === '/login' && isLoggedIn) {
    return children;
  }
  // Only redirect to /home if user is fully logged in and verified (but not on login page)
  return !isLoggedIn ? children : <Navigate to="/home" replace />;
};

const AppContent = () => {
  const { isLoggedIn, logout: userLogout } = useUserAuth();
  const { isAdmin, logout: adminLogout } = useAdminAuth();
  const [cartItemCount, setCartItemCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Fetch live cart count from backend (works for both user and guest)
    cartService.getCartItemCount().then(setCartItemCount);
  }, [isLoggedIn, location]);

  // Only show Navbar on user pages, not on admin pages
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && (
        <Navbar
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          cartItemCount={cartItemCount}
          onLogout={userLogout}
        />
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/home" element={<PublicProtectedRoute><Home /></PublicProtectedRoute>} />
        <Route path="/shop" element={<PublicProtectedRoute><Shop setCartItemCount={setCartItemCount} /></PublicProtectedRoute>} />
        {/* Services routes removed */}
        <Route path="/cart" element={<PublicProtectedRoute><Cart setCartItemCount={setCartItemCount} /></PublicProtectedRoute>} />
        <Route path="/favorites" element={<PublicProtectedRoute><Favorites setCartItemCount={setCartItemCount} /></PublicProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/checkout" element={<PublicProtectedRoute><Checkout /></PublicProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/product/:id" element={<PublicProtectedRoute><ProductDetails /></PublicProtectedRoute>} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-sale" element={<TermsOfSale />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/return-refund" element={<ReturnRefund />} />
        <Route path="/cancellation" element={<Cancellation />} />
        <Route path="/contact" element={<Contact />} />
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminProtectedRoute><AdminPanel /></AdminProtectedRoute>} />
        {/* Optionally, add more admin routes here */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && <Footer />}
    </>
  );
};

const App = () => {
  const [showPreloader, setShowPreloader] = useState(() => {
    // Only show preloader if not already shown in this session
    return sessionStorage.getItem('preloaderShown') !== 'true';
  });

  useEffect(() => {
    if (showPreloader) {
      const timer = setTimeout(() => {
        setShowPreloader(false);
        sessionStorage.setItem('preloaderShown', 'true');
      }, 3000); // Set to exactly 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showPreloader]);

  if (showPreloader) {
    return <Preloader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AdminAuthProvider>
            <UserAuthProvider>
              <FavoritesProvider>
                <AppContent />
              </FavoritesProvider>
            </UserAuthProvider>
          </AdminAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
