import { useEffect, useState } from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import { apiService, ApiResponse } from "@/services/apiService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { FaBox } from "react-icons/fa";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  product_image: string;
  product_description: string;
  category: string;
  color_name?: string;
  hex_code?: string;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  name?: string; // Added for user name
  phone?: string; // Added for user phone
}

interface OrdersData {
  orders: Order[];
}

const Dashboard = () => {
  const { user, userVersion } = useUserAuth();
  // Debug log to check user context and version on every render
  console.log('[Dashboard] user context:', user, 'userVersion:', userVersion);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds

    const fetchData = async () => {
      setLoading(true);
      try {
        // Do NOT call fetchAndSetProfile here; just use the user context
        const ordersRes = await apiService.get<ApiResponse<OrdersData>>('/backend/user/orders.php');

        if (ordersRes.success && ordersRes.data?.orders) {
          setOrders(ordersRes.data.orders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        setOrders([]);
      }
      setLoading(false);
    };

    fetchData();
    // Poll for latest dashboard data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [userVersion]); // Still depend on userVersion for live updates

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>;
    }

    let variant: "default" | "secondary" | "destructive" | "outline" | "success" | null | undefined = "default";
    switch (status.toLowerCase()) {
      case 'paid':
      case 'confirmed':
      case 'accepted':
        variant = 'secondary';
        break;
      case 'delivered':
        variant = 'success';
        break;
      case 'rejected':
      case 'failed':
        variant = 'destructive';
        break;
      case 'pending':
        variant = 'outline';
        break;
    }
    return <Badge variant={variant} className="capitalize">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
          {/* Debug log for rendered name */}
          {/* Debug log removed */}
          <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">Welcome, {user?.name || 'Guest'}!</h1>
          <p className="text-lg text-gray-600 mt-2">Here's a summary of your recent activity.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                <FaBox className="w-8 h-8 text-pink-500" />
                <div>
                  <CardTitle className="text-2xl">Order History</CardTitle>
                  <CardDescription>Your recent product purchases.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {orders.slice(0, 5).map(order => (
                      <AccordionItem value={`item-${order.id}`} key={order.id}>
                        <AccordionTrigger>
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="text-left">
                              <p className="font-semibold">Order #{order.id}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  timeZone: 'Asia/Kolkata'
                                })} - ₹{order.total_amount}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-2 border-l-2 border-pink-200">
                            <h4 className="font-semibold mb-2">Order Name:</h4> {order.name && order.name !== 'Anonymous' ? order.name : 'N/A'} | <h4 className="font-semibold mb-2">Order Phone:</h4> {order.phone ? order.phone : 'N/A'}
                            <h4 className="font-semibold mb-2">Order Items</h4>
                            {order.items && order.items.length > 0 ? (
                              <ul className="space-y-4">
                                {order.items.map((item, index) => {
                                  return (
                                    <li key={index} className="flex items-start gap-4 p-2 rounded-lg hover:bg-gray-50/50">
                                      <img
                                        src={item.product_image || '/default-image.png'}
                                        alt={item.product_name}
                                        className="w-24 h-24 object-cover rounded-lg border"
                                        onError={e => { e.currentTarget.src = '/default-image.png'; }}
                                      />
                                      <div className="flex-grow">
                                        <h4 className="font-semibold text-lg text-gray-800">{item.product_name}</h4>
                                        {item.color_name && item.color_name !== 'Default' && (
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-gray-600">Color:</span>
                                            <span className="font-medium text-xs">{item.color_name}</span>
                                            {item.hex_code && (
                                              <span className="inline-block w-4 h-4 rounded-full border ml-1" style={{ backgroundColor: item.hex_code }}></span>
                                            )}
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-600 line-clamp-2 mb-2">{item.category}</div>
                                        <div className="flex justify-between items-center text-sm text-gray-800 mt-2">
                                          <span><strong>Qty:</strong> {item.quantity}</span>
                                          <span className="font-semibold">₹{typeof item.price === 'number' && typeof item.quantity === 'number' ? (item.price * item.quantity).toFixed(2) : '0.00'}</span>
                                        </div>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 italic px-2">Item details are not available for this past order.</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-center text-gray-500 py-8">No orders found. <Link to="/shop" className="text-pink-500 hover:underline">Shop now!</Link></p>
                )}
              </CardContent>
              {orders.length > 0 && (
                <CardFooter>
                  <p className="text-xs text-gray-500">Showing last {orders.slice(0, 5).length} orders.</p>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
