import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { apiService } from '../services/apiService';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

// Booking interface removed

interface Order {
  id: number;
  order_id: string;
  user_id: number;
  total_amount: number;
  subtotal: number;
  platform_fee: number;
  delivery_charge: number;
  status: string;
  created_at: string;
  payment_id?: string;
}

interface AdminStats {
  totalUsers: number;
  // totalBookings removed
  totalRevenue: number;
  totalPlatformFees: number;
  totalDeliveryCharges: number;
  totalSubtotal: number;
}

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'An error occurred';
}

const Admin = () => {
  const { admin, loading } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  // Bookings state removed
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!admin || !admin.isAdmin) return;

    const fetchData = async () => {
      try {
        // Fetch users
        const usersRes = await apiService.get<{ success: boolean; data: User[] }>('/admin/get_users.php');
        // Fetch orders
        const ordersRes = await apiService.get<{ success: boolean; data: Order[] }>('/admin/view_orders.php');

        const usersData = usersRes.success && Array.isArray(usersRes.data) ? usersRes.data : [];
        const ordersData = ordersRes.success && Array.isArray(ordersRes.data) ? ordersRes.data : [];

        setUsers(usersData);
        setOrders(ordersData);

        setStats({
          totalUsers: usersData.length,
          totalRevenue: ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          totalPlatformFees: ordersData.reduce((sum, order) => sum + (order.platform_fee || 0), 0),
          totalDeliveryCharges: ordersData.reduce((sum, order) => sum + (order.delivery_charge || 0), 0),
          totalSubtotal: ordersData.reduce((sum, order) => sum + (order.subtotal || order.total_amount || 0), 0),
        });
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    };

    fetchData();
  }, [admin?.id, admin?.isAdmin]);

  useEffect(() => {
    // Polling removed for now to fix connection issues
  }, []);

  // handleUpdateBookingStatus removed

  const handleDeleteUser = async (userId: number) => {
    try {
      const fd = new FormData();
      fd.append('id', String(userId));
      await apiService.post('/backend/admin/delete_user.php', fd);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!admin || !admin.isAdmin) {
    return <div>Unauthorized. Please <a href='/admin/login'>login</a> as admin.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {/* Stats */}
      {stats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Stats</h2>
          <ul>
            <li>Total Users: {stats.totalUsers}</li>
            {/* totalBookings removed */}
            <li>Total Revenue: ₹{stats.totalRevenue}</li>
            <li>Total Subtotal: ₹{stats.totalSubtotal}</li>
            <li>Total Platform Fees: ₹{stats.totalPlatformFees}</li>
            <li>Total Delivery Charges: ₹{stats.totalDeliveryCharges}</li>
          </ul>
        </div>
      )}
      {/* Users */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <ul>
          {users.map(user => (
            <li key={user.id} className="flex items-center gap-4 border-b py-2">
              <img src={user.avatar_url} alt={user.name} onError={e => { e.currentTarget.src = '/default-avatar.png'; }} />
              <span>{user.name} ({user.email})</span>
              <button onClick={() => handleDeleteUser(user.id)} className="bg-red-400 px-2 py-1 rounded text-white hover:bg-red-500">Delete</button>
            </li>
          ))}
        </ul>
      </div>
      {/* Bookings section removed */}
      {/* Orders */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Order ID</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Subtotal</th>
                <th className="border border-gray-300 px-4 py-2">Platform Fee</th>
                <th className="border border-gray-300 px-4 py-2">Delivery</th>
                <th className="border border-gray-300 px-4 py-2">Total</th>
                <th className="border border-gray-300 px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{order.order_id}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">₹{order.subtotal?.toFixed(2) || order.total_amount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-gray-300 px-4 py-2">₹{order.platform_fee?.toFixed(2) || '0.00'}</td>
                  <td className="border border-gray-300 px-4 py-2">₹{order.delivery_charge?.toFixed(2) || '0.00'}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">₹{order.total_amount?.toFixed(2) || '0.00'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;