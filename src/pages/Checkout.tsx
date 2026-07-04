import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cartService, CartItem, CartResponse } from '../services/cartService'; // Import CartItem and CartResponse from cartService
import { paymentService } from '../services/paymentService'; // Assuming paymentService for Razorpay calls
import { useUserAuth } from '../context/UserAuthContext';
import { apiService } from '../services/apiService';
import FeedbackModal from '../components/FeedbackModal';
import { productService } from '../services/productService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectSeparator, SelectGroup } from '@/components/ui/select';
import { Check, CreditCard, Truck, MapPin, ShieldCheck, ShoppingBag, ChevronRight, Banknote } from 'lucide-react';

// Declare RazorpayOptions type globally or in a separate .d.ts file if needed
declare global {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void; // Use specific type
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    theme: {
      color: string;
    };
    modal?: { // Add modal options to handle close behavior if needed
      ondismiss?: () => void;
    };
  }

  interface Window {
    Razorpay: {
      new(options: RazorpayOptions): { open: () => void }; // Use specific type
    };
  }
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  success: boolean;
  data?: {
    key: string;
    amount: number;
    currency: string;
    razorpay_order_id: string;
  };
  error?: { // Add error structure as well
    message: string;
  };
}

interface CheckoutFormData {
  name: string;
  phone: string;
  shippingAddress: string;
  billingAddress: string;
  shippingState?: string;
  billingState?: string;
  email?: string; // Added email field for guest
}

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'An error occurred';
}

const Checkout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const { isLoggedIn, user } = useUserAuth();
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: user?.name || '',
    phone: user?.phone ? user.phone.replace('+91', '') : '',
    shippingAddress: '',
    billingAddress: '',
    shippingState: undefined,
    billingState: undefined,
    email: '', // Initialize email
  });
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(false);
  const [lastAddressLoading, setLastAddressLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackProduct, setFeedbackProduct] = useState<{ id: number, name: string } | null>(null);
  const [productDetails, setProductDetails] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage'); // Added state
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showCoupons, setShowCoupons] = useState(false);

  // Calculate additional charges
  /* Fixed getDiscountAmount */
  const getDiscountAmount = () => {
    if (!couponApplied) return 0;
    if (couponDiscount <= 0) return 0;

    if (couponType === 'percentage') {
      return (totalPrice * couponDiscount) / 100;
    } else {
      // Fixed amount
      return Math.min(couponDiscount, totalPrice); // Cannot discount more than total
    }
  };

  /* Safe platform fee calculation */
  const getPlatformFee = () => {
    // Ensure totalPrice is valid number
    const base = Number(totalPrice) || 0;
    if (base <= 0) return 0;
    return Math.round(base * 0.02 * 100) / 100;
  };

  const getDeliveryCharge = () => {
    const raw = formData.shippingState || '';
    const normalized = raw.toLowerCase().replace(/\s+/g, ' ').trim();
    const isTamilNadu = normalized === 'tamil nadu' || normalized === 'tamilnadu' || normalized === 'tn';
    return isTamilNadu ? 60 : 80;
  };

  const getFinalTotal = () => {
    const total = totalPrice + getPlatformFee() + getDeliveryCharge() - getDiscountAmount();
    return Math.max(0, total); // Ensure non-negative
  };

  const verifyCoupon = async (codeToVerify: string) => {
    setCouponError('');
    try {
      const response = await apiService.post<{ code: string; discount_type: 'percentage' | 'fixed'; discount_value: number }>('/backend/user/verify_coupon.php', {
        code: codeToVerify,
        cart_total: totalPrice,
        guest_email: !isLoggedIn ? formData.email : undefined
      });

      if (response.success && response.data) {
        setCouponCode(codeToVerify); // Only set code if valid
        setCouponApplied(true);
        setCouponDiscount(Number(response.data.discount_value));
        setCouponType(response.data.discount_type); // Set type

        const displayValue = response.data.discount_type === 'percentage'
          ? `${response.data.discount_value}%`
          : `₹${response.data.discount_value}`;

        toast({ title: "Coupon Applied", description: `Coupon applied: ${displayValue} Off` });
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : (response.error?.message || response.message || 'Invalid coupon');
        throw new Error(errorMessage);
      }
    } catch (err) {
      setCouponError(getErrorMessage(err));
      toast({ title: "Invalid Coupon", description: getErrorMessage(err), variant: "destructive" });
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponType('percentage');
    toast({ title: "Coupon Removed", description: "Coupon has been removed." });
  };

  const handleApplyCoupon = () => {
    if (couponApplied) {
      removeCoupon();
    } else {
      verifyCoupon(couponCode);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Validate Email for Guests
    if (!isLoggedIn) {
      if (!formData.email?.trim()) {
        errors.push('Email address is required for guest checkout');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Please enter a valid email address');
      }
    }

    if (!formData.name.trim()) {
      errors.push('Full Name is required.');
    }
    // Only 10 digits
    if (!/^\d{10}$/.test(formData.phone)) {
      errors.push('Phone number must be 10 digits');
    }
    if (!formData.shippingAddress.trim()) {
      errors.push('Shipping Address is required.');
    }
    if (!formData.shippingState) {
      errors.push('Shipping State is required.');
    }
    if (!formData.billingAddress.trim()) {
      errors.push('Billing Address is required.');
    }
    if (!useShippingAsBilling && !formData.billingState) {
      errors.push('Billing State is required.');
    }

    return errors;
  };

  const displayRazorpay = async () => {
    console.log("Attempting to load Razorpay script...");
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = async () => {
      console.log("Razorpay script loaded successfully.");
      try {
        // Always create a fresh order for this payment session
        let phoneToSend = formData.phone.replace(/\D/g, '');
        if (phoneToSend.length === 10) phoneToSend = '+91' + phoneToSend;
        const orderDetailsToSend = {
          amount: getFinalTotal(),
          currency: "INR",
          description: "ShopNest Order",
          user_id: Number(user?.id) || 0,
          name: formData.name,
          phone: phoneToSend,
          shipping_address: formData.shippingAddress,
          billing_address: formData.billingAddress,
          cart: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            color_variation_id: item.color_variation_id || null
          })),
          platform_fee: getPlatformFee(),
          delivery_charge: getDeliveryCharge(),
          subtotal: totalPrice,
          shipping_state: formData.shippingState,
          billing_state: useShippingAsBilling ? formData.shippingState : formData.billingState,
          coupon_code: couponApplied ? couponCode : undefined,
          discount_amount: getDiscountAmount(),
          guest_email: !isLoggedIn ? formData.email : undefined // Send email if guest
        };
        console.log("Creating order with details:", orderDetailsToSend);
        console.log("Calculated Delivery Charge:", getDeliveryCharge());
        console.log("Current Shipping State:", formData.shippingState);
        const orderResponse = await paymentService.createOrder(orderDetailsToSend);
        console.log("Order Creation Response:", orderResponse); // Added Debug Log

        if (orderResponse.success && orderResponse.data && orderResponse.data.razorpay_order_id) {
          const options: RazorpayOptions = {
            key: orderResponse.data.key,
            amount: orderResponse.data.amount * 100, // paise
            currency: "INR",
            name: "ShopNest",
            description: "Order Payment",
            order_id: orderResponse.data.razorpay_order_id,
            handler: async (response: RazorpaySuccessResponse) => {
              try {
                const confirmResponse = await paymentService.confirmPayment({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                });
                if (confirmResponse.success) {
                  await cartService.clearCart();
                  toast({
                    title: "Order Placed Successfully!",
                    description: "Thank you for your purchase. An email confirmation has been sent.",
                  });

                  // Only show feedback for logged in users
                  if (isLoggedIn) {
                    setFeedbackProduct({
                      id: cart[0]?.product_id ?? cart[0]?.id,
                      name: cart[0]?.name || "Product"
                    });
                    setShowFeedback(true);
                  } else {
                    // Guest: Redirect to shop immediately
                    navigate('/shop');
                  }
                } else {
                  throw new Error(getErrorMessage(confirmResponse.error) || 'Order confirmation failed');
                }
              } catch (err) {
                console.error("Error in Razorpay handler or confirmPayment:", err);
                toast({
                  title: "Payment Successful, Order Confirmation Failed",
                  description: getErrorMessage(err),
                  variant: "destructive",
                });
              } finally {
                setFormLoading(false);
              }
            },
            prefill: {
              name: formData.name,
              email: '',
              contact: formData.phone,
            },
            theme: {
              color: '#ec4899',
            },
            modal: {
              ondismiss: async () => {
                setFormLoading(false);
                if (orderResponse && orderResponse.data && orderResponse.data.razorpay_order_id) {
                  try {
                    await apiService.post('/backend/payments/create_order.php', { cancel_order_id: orderResponse.data.razorpay_order_id });
                    toast({
                      title: 'Order Cancelled',
                      description: 'Your order was cancelled before payment.',
                      variant: 'default',
                    });
                  } catch (err) {
                    toast({
                      title: 'Order Cancel Error',
                      description: 'Failed to cancel order. Please contact support.',
                      variant: 'destructive',
                    });
                  }
                }
              }
            }
          };
          const rzp1 = new window.Razorpay(options);
          rzp1.open();
        } else {
          throw new Error((orderResponse.error as any)?.message || 'Failed to create Razorpay order');
        }
      } catch (err) {
        console.error("Error during order creation or Razorpay process:", err);
        toast({
          title: "Payment Initialization Failed",
          description: getErrorMessage(err),
          variant: "destructive",
        });
      }
    };
    script.onerror = (err) => {
      console.error("Error loading Razorpay script:", err);
      setFormLoading(false);
      toast({
        title: "Payment Error",
        description: "Failed to load payment script. Please check your internet connection.",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast({
        title: "Validation Error",
        description: error,
        variant: "destructive"
      }));
      return;
    }

    setFormLoading(true);
    // Adjusted delay to 2.5 seconds to match smoother animation speed
    setTimeout(() => {
      displayRazorpay();
    }, 2500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Only allow digits, max 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleUseShippingAsBilling = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseShippingAsBilling(e.target.checked);
    if (e.target.checked) {
      setFormData(fd => ({ ...fd, billingAddress: fd.shippingAddress, billingState: fd.shippingState }));
    }
  };

  useEffect(() => {
    if (useShippingAsBilling) {
      setFormData(fd => ({ ...fd, billingAddress: fd.shippingAddress, billingState: fd.shippingState }));
    }
  }, [formData.shippingAddress, formData.shippingState, useShippingAsBilling]);

  const handleUseLastAddress = async () => {
    setLastAddressLoading(true);
    try {
      const res = await apiService.get('/backend/user/profile.php');
      console.log('Fetched profile for last address:', res);
      if (res.success && res.data && (res.data as any).last_used_address) {
        setFormData(fd => ({
          ...fd,
          shippingAddress: (res.data as any).last_used_address,
          billingAddress: (res.data as any).last_used_address
        }));
        setUseShippingAsBilling(true);
        toast({
          title: 'Last address used',
          description: (res.data as any).last_used_address,
          variant: 'default'
        });
      } else {
        toast({
          title: 'No address found',
          description: 'No previous address found in your profile.',
          variant: 'destructive'
        });
      }
    } finally {
      setLastAddressLoading(false);
    }
  };

  // Load cart data and coupons on component mount
  useEffect(() => {
    const fetchCartAndProductDetails = async () => {
      try {
        // Fetch Available Coupons
        try {
          const couponRes = await apiService.get<any[]>('/backend/user/get_coupons.php');
          if (couponRes.success && Array.isArray(couponRes.data)) {
            setAvailableCoupons(couponRes.data);
          }
        } catch (e) {
          console.error("Failed to fetch coupons", e);
        }

        // Check for buy now data
        const buyNowRaw = localStorage.getItem('buyNowData');
        if (buyNowRaw) {
          const buyNow = JSON.parse(buyNowRaw);
          // Do not remove it immediately to allow reload persistence. 
          // We will clear it on successful order or rely on new navigation overwriting it.
          // localStorage.removeItem('buyNowData'); 
          // Fetch product details
          const res = await productService.getProductById(buyNow.productId);
          const prod = res.success && res.data && res.data[0] ? res.data[0] : null;
          let variant = null;
          let image_url = prod?.image_url;
          let price = prod?.price;
          let delivery_days = prod?.delivery_days;
          if (prod && buyNow.colorVariationId && prod.color_variations) {
            variant = prod.color_variations.find((v: any) => v.id === buyNow.colorVariationId);
            if (variant && variant.images && variant.images.length > 0) {
              image_url = variant.images[0];
            }
            if (variant && variant.price) {
              price = variant.price;
            }
            if (variant && variant.delivery_days) {
              delivery_days = variant.delivery_days;
            }
          }
          const item = {
            id: prod.id, // using product id as cart item id for direct buy
            product_id: prod.id,
            name: prod.name,
            description: '',
            image_url,
            color_variation_id: buyNow.colorVariationId,
            color_name: variant?.color_name || '',
            color_variations: prod.color_variations || [],
            quantity: buyNow.quantity,
            price,
            delivery_days,
          };
          setCart([item]);
          setProductDetails([item]);
          setTotalPrice(item.price * item.quantity);
          // Calculate delivery date
          const date = new Date();
          date.setDate(date.getDate() + (item.delivery_days || 2));
          setDeliveryDate(date.toLocaleDateString());
          setLoading(false);
          return;
        }
        // Fallback to cart flow
        let items: any[] = [];
        const cartResponse = await cartService.getCart();
        const cartItems = Array.isArray(cartResponse.items) ? cartResponse.items : [];
        // Fetch product details for each cart item
        const details = await Promise.all(cartItems.map(async (item) => {
          const res = await productService.getProductById(item.product_id);
          const prod = res.success && res.data && res.data[0] ? res.data[0] : null;
          let variant = null;
          let image_url = prod?.image_url;
          let price = prod?.price;
          if (prod && item.color_variation_id && prod.color_variations) {
            variant = prod.color_variations.find((v: any) => v.id === item.color_variation_id);
            if (variant && variant.images && variant.images.length > 0) {
              image_url = variant.images[0];
            }
            if (variant && variant.price) {
              price = variant.price;
            }
          }
          return prod ? {
            ...item,
            name: prod.name,
            image_url,
            color_name: variant?.color_name || '',
            color_variations: prod.color_variations || [],
            delivery_days: prod.delivery_days,
            price: price, // Always use correct variant or product price
          } : item;
        }));
        setCart(details);
        setProductDetails(details);
        setTotalPrice(details.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0));
        // Calculate delivery date for the slowest product
        const maxDays = Math.max(...details.map(item => (item as any).delivery_days || 2));
        const date = new Date();
        date.setDate(date.getDate() + maxDays);
        setDeliveryDate(date.toLocaleDateString());
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cart data:', err);
        setError(getErrorMessage(err));
        toast({
          title: "Error fetching cart",
          description: getErrorMessage(err),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCartAndProductDetails();
  }, [navigate, toast, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading cart details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 relative font-sans">
      {formLoading && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-green-50 p-4 rounded-full">
                <Banknote className="w-12 h-12 text-green-600 animate-bounce" />
              </div>
            </div>
            <div className="text-xl font-serif font-bold text-stone-900">Processing Payment</div>
            <p className="text-stone-500 text-sm mt-2">Securely processing your transaction...</p>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-900">Checkout</h1>
              <p className="text-stone-500 text-sm">Secure Payment & Fast Shipping</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-stone-400">
            <span className="text-stone-900 flex items-center gap-1"><ShoppingBag className="w-4 h-4" /> Cart</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-amber-600 flex items-center gap-1"><CreditCard className="w-4 h-4" /> Checkout</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* LEFT COLUMN - FORM */}
          <div className="lg:col-span-8">
            <form id="checkout-form" onSubmit={handleSubmitCheckout} className="space-y-8">

              {/* Contact Info */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-stone-100">
                <div className="flex items-center gap-3 mb-6 border-b border-stone-100 pb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">1</div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">Contact Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-stone-600">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      className="bg-stone-50 border-stone-200 focus:border-amber-500 focus:ring-amber-500 transition-all h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-stone-600">Phone Number</Label>
                    <div className="flex items-center">
                      <span className="h-12 flex items-center px-4 bg-stone-100 border border-r-0 border-stone-200 rounded-l-md text-stone-500 font-medium">+91</span>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="XXXXXXXXXX"
                        maxLength={10}
                        pattern="\d{10}"
                        required
                        className="rounded-l-none bg-stone-50 border-stone-200 focus:border-amber-500 focus:ring-amber-500 transition-all h-12"
                      />
                    </div>
                  </div>
                  {!isLoggedIn && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email" className="text-stone-600">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        placeholder="For order confirmation"
                        required
                        className="bg-stone-50 border-stone-200 focus:border-amber-500 focus:ring-amber-500 transition-all h-12"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-stone-100">
                <div className="flex items-center gap-3 mb-6 border-b border-stone-100 pb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">2</div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">Shipping Address</h2>
                  <Button
                    type="button"
                    onClick={handleUseLastAddress}
                    disabled={lastAddressLoading}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    {lastAddressLoading ? 'Loading...' : 'Use Saved Address'}
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress" className="text-stone-600">Address Details</Label>
                    <Textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      placeholder="Street address, apartment, suite, etc."
                      required
                      className="bg-stone-50 border-stone-200 focus:border-amber-500 focus:ring-amber-500 transition-all min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-600">State / Province</Label>
                    <Select
                      value={formData.shippingState || ''}
                      onValueChange={(value) => setFormData(fd => ({ ...fd, shippingState: value }))}
                    >
                      <SelectTrigger className="h-12 bg-stone-50 border-stone-200">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel>States</SelectLabel>
                          {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectGroup>
                          <SelectLabel>Union Territories</SelectLabel>
                          {["Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"].map(ut => (
                            <SelectItem key={ut} value={ut}>{ut}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-stone-100">
                <div className="flex items-center gap-3 mb-6 border-b border-stone-100 pb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">3</div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">Billing Address</h2>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-3 p-4 border border-stone-200 rounded-lg cursor-pointer hover:border-amber-400 transition-all bg-stone-50">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${useShippingAsBilling ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-400 bg-white'}`}>
                      {useShippingAsBilling && <Check className="w-3 h-3" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={useShippingAsBilling}
                      onChange={handleUseShippingAsBilling}
                      className="hidden"
                    />
                    <span className="text-stone-700 font-medium">Same as shipping address</span>
                  </label>
                </div>

                {!useShippingAsBilling && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress" className="text-stone-600">Billing Address</Label>
                      <Textarea
                        id="billingAddress"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        placeholder="Enter billing address"
                        required
                        className="bg-stone-50 border-stone-200 focus:border-amber-500 focus:ring-amber-500 transition-all min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-stone-600">Billing State</Label>
                      <Select
                        value={formData.billingState || ''}
                        onValueChange={(value) => setFormData(fd => ({ ...fd, billingState: value }))}
                      >
                        <SelectTrigger className="h-12 bg-stone-50 border-stone-200">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Same Options as Shipping - simplified for brevity in replacement, but logically implies full list */}
                          <SelectGroup>
                            <SelectLabel>States</SelectLabel>
                            {["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"].map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Union Territories</SelectLabel>
                            {["Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"].map(ut => (
                              <SelectItem key={ut} value={ut}>{ut}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN - SUMMARY */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8 space-y-6">

              {/* Order Summary Card */}
              <div className="bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden">
                <div className="bg-stone-900 px-6 py-4">
                  <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    Order Summary
                  </h2>
                </div>

                <div className="p-6">
                  {/* Products */}
                  <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {productDetails.map(item => {
                      let imageUrl = item.image_url;
                      let colorLabel = '';
                      if (item.color_variation_id && item.color_variation_id !== 'null' && Array.isArray(item.color_variations)) {
                        const variant = item.color_variations.find((v: any) => v.id === item.color_variation_id);
                        if (variant && variant.images?.[0]) imageUrl = variant.images[0];
                        if (variant?.color_name && variant.color_name !== 'Default') colorLabel = `(${variant.color_name})`;
                      }
                      return (
                        <div key={item.product_id + '_' + (item.color_variation_id || 'default')} className="flex gap-3 py-2 border-b border-stone-50 last:border-0">
                          <div className="w-16 h-16 rounded-md bg-stone-50 border border-stone-200 overflow-hidden shrink-0">
                            <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-900 truncate text-sm">{item.name}</p>
                            <p className="text-xs text-stone-500">{colorLabel}</p>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                              <p className="font-bold text-sm text-stone-900">₹{item.price * item.quantity}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Code */}
                  <div className="mb-6">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                        className="bg-stone-50 border-stone-200 h-10 text-sm"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={(!couponApplied && !couponCode.trim()) || (!isLoggedIn && !formData.email?.trim())}
                        className={`h-10 ${couponApplied ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                      >
                        {couponApplied ? 'Remove' : 'Apply'}
                      </Button>
                    </div>
                    {!isLoggedIn && !formData.email?.trim() && (
                      <p className="text-[10px] text-amber-600 mt-1">Enter email in contact info to apply coupons.</p>
                    )}
                    {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                    {couponApplied && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Coupon applied!</p>}

                    {/* Available Coupons List */}
                    {availableCoupons.length > 0 && !couponApplied && (
                      <div className="mt-4 border border-dashed border-stone-200 rounded-lg p-3 bg-stone-50/50">
                        <p className="text-xs font-serif font-bold text-stone-700 mb-2 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-amber-600" /> Available Offers
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {availableCoupons.map((coupon) => {
                            const minOrder = parseFloat(coupon.min_order_amount);
                            const isEligible = totalPrice >= minOrder;
                            const isGuestEmailMissing = !isLoggedIn && !formData.email?.trim();

                            return (
                              <div key={coupon.code} className="flex justify-between items-center bg-white p-2 rounded-md border border-stone-100 shadow-sm transition-all hover:border-amber-200 hover:shadow-md group">
                                <div>
                                  <div className={`font-bold text-sm ${isEligible ? 'text-stone-900' : 'text-stone-400'}`}>{coupon.code}</div>
                                  <div className="text-[10px] text-stone-500">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% Off` : `₹${coupon.discount_value} Off`}
                                    {minOrder > 0 && ` • Min: ₹${minOrder}`}
                                  </div>
                                  {!isEligible && (
                                    <div className="text-[10px] text-amber-600 font-medium">
                                      Add items worth ₹{(minOrder - totalPrice).toFixed(2)} more
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className={`${isEligible && !isGuestEmailMissing ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-stone-300 cursor-not-allowed'} h-6 text-xs px-2 py-0`}
                                  onClick={() => isEligible && !isGuestEmailMissing && verifyCoupon(coupon.code)}
                                  disabled={!isEligible || isGuestEmailMissing}
                                >
                                  Apply
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="flex justify-between text-stone-600 text-sm">
                      <span>Subtotal</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 text-sm">
                      <span>Platform Fee</span>
                      <span>₹{getPlatformFee().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 text-sm">
                      <span>Delivery</span>
                      <span className="flex items-center gap-1">
                        {`₹${getDeliveryCharge()}`}
                      </span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Discount</span>
                        <span>-₹{getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-end pt-4 border-t border-stone-200 mt-4">
                      <span className="font-serif font-bold text-stone-900 text-lg">Total</span>
                      <span className="font-bold text-2xl text-stone-900">₹{getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button
                      type="submit"
                      form="checkout-form"
                      disabled={formLoading || cart.length === 0}
                      className="w-full bg-stone-900 hover:bg-amber-600 text-white h-14 rounded-xl text-lg font-bold shadow-xl shadow-stone-900/10 transition-all hover:-translate-y-0.5"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      {`Pay ₹${getFinalTotal().toFixed(2)}`}
                    </Button>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Secure SSL Encrypted Payment</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-100 flex flex-col items-center text-center">
                  <Truck className="w-6 h-6 text-amber-600 mb-2" />
                  <span className="font-bold text-stone-900 text-xs">Fast Delivery</span>
                  <span className="text-[10px] text-stone-500">Across India</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-100 flex flex-col items-center text-center">
                  <ShieldCheck className="w-6 h-6 text-amber-600 mb-2" />
                  <span className="font-bold text-stone-900 text-xs">Genuine Products</span>
                  <span className="text-[10px] text-stone-500">Quality Assured</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackProduct && (
        <FeedbackModal
          open={showFeedback}
          onOpenChange={(open) => {
            setShowFeedback(open);
            if (!open) {
              navigate('/shop');
            }
          }}
          type="product"
          itemId={feedbackProduct.id}
          itemName={feedbackProduct.name}
          onSubmitted={() => {
            setShowFeedback(false);
            navigate('/shop');
          }}
        />
      )}
    </div>
  );
};

async function displayRazorpayCartFlow() {
  // Copy the regular cart flow logic from displayRazorpay
}

export default Checkout; 