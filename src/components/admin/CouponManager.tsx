import React, { useState, useEffect } from 'react';
import { adminService, Coupon } from '../../services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, Eye, EyeOff, Plus, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CouponManager() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'add'>('list');

    // Form State
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [minOrder, setMinOrder] = useState('0');
    const [usageLimit, setUsageLimit] = useState('1');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await adminService.getCoupons();
            if (res.success && res.data) {
                setCoupons(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this coupon?")) return;
        try {
            await adminService.deleteCoupon(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await adminService.toggleCouponStatus(id, !currentStatus);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code) return alert("Please enter coupon code");
        if (!discountValue) return alert("Please enter discount value");

        const data = {
            code: code.toUpperCase(),
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            min_order_amount: parseFloat(minOrder),
            usage_limit_per_user: parseInt(usageLimit),
            is_active: true
        };

        try {
            const res = await adminService.addCoupon(data);
            if (res.success) {
                alert("Coupon created!");
                setView('list');
                // Reset form
                setCode('');
                setDiscountValue('');
                setMinOrder('0');
                setUsageLimit('1');
                fetchCoupons();
            } else {
                alert("Error: " + (res.error?.message || res.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create coupon");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
                {view === 'list' && (
                    <Button onClick={() => setView('add')} className="gap-2 bg-black text-white hover:bg-gray-800">
                        <Plus className="w-4 h-4" /> Add New Coupon
                    </Button>
                )}
                {view === 'add' && (
                    <Button variant="outline" onClick={() => setView('list')}>
                        Cancel
                    </Button>
                )}
            </div>

            {view === 'list' ? (
                <div className="grid gap-6">
                    {loading ? <div className="text-center py-10">Loading coupons...</div> : null}
                    {!loading && coupons.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl text-gray-400">
                            No coupons found. Create one to get started.
                        </div>
                    )}

                    <div className="grid gap-4">
                        {coupons.map((coupon) => (
                            <motion.div
                                key={coupon.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!coupon.is_active ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="flex items-center justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                                            <Tag className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{coupon.code}</h3>
                                            <p className="text-sm text-gray-500">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                                                {coupon.min_order_amount > 0 && ` • Min Order: ₹${coupon.min_order_amount}`}
                                                {` • Limit: ${coupon.usage_limit_per_user}/user`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                                            className={coupon.is_active ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-400"}
                                            title={coupon.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {coupon.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(coupon.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Coupon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form id="couponForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                        <Input
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="e.g. SUMMER2024"
                                            className="uppercase"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                            <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                                            <Input
                                                type="number"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(e.target.value)}
                                                placeholder={discountType === 'percentage' ? "e.g. 10" : "e.g. 500"}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
                                            <Input
                                                type="number"
                                                value={minOrder}
                                                onChange={(e) => setMinOrder(e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit Per User</label>
                                            <Input
                                                type="number"
                                                value={usageLimit}
                                                onChange={(e) => setUsageLimit(e.target.value)}
                                                placeholder="1"
                                                min="1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">How many times a single user can use this?</p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 bg-gray-50/50 border-t p-6">
                            <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>
                            <Button type="submit" form="couponForm" className="bg-black text-white hover:bg-gray-800">
                                Create Coupon
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
