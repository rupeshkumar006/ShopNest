import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '../services/apiService';
import { useUserAuth } from '../context/UserAuthContext';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_image: string;
  color_name?: string;
  hex_code?: string;
  color_variations?: { id: number; images: string[] }[];
  color_variation_id?: number;
}

interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  payment_id: string;
  order_id: string;
  name: string;
  phone: string;
  shipping_address: string;
  billing_address: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  email?: string;
  guest_email?: string;
}

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'An error occurred';
}

const Orders = () => {
  const { toast } = useToast();
  const { user } = useUserAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await apiService.get('/backend/admin/get_orders.php');
      const data = response as { success: boolean; data?: Order[], error?: { message?: string } };
      if (data.success) {
        setOrders(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(getErrorMessage(err));
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (orderId: number) => {
    try {
      const response = await apiService.post('/backend/admin/update_order_status.php', {
        orderId,
        status: 'delivered',
      });
      if (response.success) {
        toast({
          title: 'Order marked as delivered',
          description: 'The user has been notified by email.',
          variant: 'default',
        });
        fetchOrders();
      } else {
        throw new Error(response.error?.message || 'Failed to update order status');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchOrders(); // initial fetch
    const interval = setInterval(fetchOrders, 5000); // fetch every 5 seconds
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'paid': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'failed': 'bg-red-500',
      'delivered': 'bg-blue-500'
    };
    return (
      <Badge className={`${statusColors[status.toLowerCase() as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-spin" role="status" aria-label="Loading">⏳</div>
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Orders Management</h1>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Order #{order.id} - {new Date(order.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'Asia/Kolkata'
                  })}
                </CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <p>Name: {order.name && order.name !== 'Anonymous' ? order.name : 'N/A'}</p>
                  <p>Email: {order.email || order.guest_email || 'N/A'}</p>
                  <p>Phone: {order.phone ? order.phone : 'N/A'}</p>
                  <p className="mt-2">Shipping Address: {order.shipping_address}</p>
                  <p>Billing Address: {order.billing_address}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <p>Total Amount: ₹{order.total_amount}</p>
                  <p>Payment ID: {order.payment_id || 'N/A'}</p>
                  <p>Order ID: {order.order_id}</p>
                  <p>Total Quantity: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                  <p>Products:</p>
                  <ul className="pl-4 list-disc">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 mb-1">
                        <img src={item.product_image || '/default-image.png'} alt={item.product_name} className="w-8 h-8 object-cover rounded border" onError={e => { e.currentTarget.src = '/default-image.png'; }} />
                        <span className="font-medium text-sm">{item.product_name}</span>
                        {/* Show color name and swatch if available */}
                        {item.color_name && item.color_name !== 'Default' && (
                          <span className="ml-2 text-xs text-gray-600">Color: {item.color_name}</span>
                        )}
                        {item.hex_code && (
                          <span className="inline-block w-4 h-4 rounded-full border ml-1" style={{ backgroundColor: item.hex_code }} title={item.hex_code}></span>
                        )}
                        <span className="ml-2 text-xs text-gray-500">Qty: {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {order.status !== 'delivered' && (
                    <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={() => markAsDelivered(order.id)}>
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders; 