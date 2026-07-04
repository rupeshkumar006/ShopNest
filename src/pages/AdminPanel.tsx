import React, { useEffect, useState, useMemo } from "react";
import { apiService } from "../services/apiService";
import { useNavigate } from "react-router-dom";
import { Toast } from "../components/Toast";
import { useAdminAuth } from '../context/AdminAuthContext';
import { FaBoxOpen, FaConciergeBell, FaChartBar, FaSignOutAlt, FaEdit, FaTrash, FaPlus, FaShoppingCart, FaUsers, FaClipboardList, FaStar, FaEye, FaEyeSlash, FaDollarSign, FaPalette, FaEnvelope, FaTicketAlt } from "react-icons/fa";
// ServiceBookings import removed
import Orders from '../components/Orders';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AdminNewsletter from './AdminNewsletter';
import { adminService } from '../services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  delivery_days: number;
  has_color_variations: boolean;
  color_variations: ColorVariation[];
  gallery: string[];
  material?: string;
  is_featured?: boolean | number;
}

// Service interface removed

interface ColorVariation {
  id: number;
  color_name: string;
  hex_code: string;
  price: number;
  stock: number;
  images: string[];
}

interface ProductFormData {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  delivery_days: number;
  has_color_variations: boolean;
  color_variations: ColorVariation[];
  images?: File[];
  image_url: string;
  gallery: string[];
  newImages?: File[];
  existingImages?: string[];
  colorImages?: { [idx: number]: { existing: string[]; new: File[] } };
  unit_type?: 'pieces' | 'packets';
  packet_size?: number | null;
  material?: string;
}

// ServiceFormData interface removed

interface Stats {
  total_users: number;
  total_orders: number;
  total_products: number;
  total_revenue: number;
}

type ToastType = { message: string; type: "success" | "error" };

function ProductForm({
  onSubmit,
  product,
  loading,
}: {
  onSubmit: (data: ProductFormData) => void;
  product?: ProductFormData;
  loading?: boolean;
}) {
  const [form, setForm] = useState<ProductFormData>(
    product || {
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      delivery_days: 7,
      has_color_variations: false,
      color_variations: [],
      images: [],
      image_url: '',
      gallery: [],
      unit_type: 'pieces',
      packet_size: null,
      material: ''
    }
  );
  const [existingImages, setExistingImages] = useState<string[]>(product?.gallery || (product?.image_url ? [product.image_url] : []));
  const [newImages, setNewImages] = useState<File[]>([]);
  const [colorImages, setColorImages] = useState<{ [idx: number]: { existing: string[]; new: File[] } }>({});

  useEffect(() => {
    setForm(
      product || {
        name: '',
        description: '',
        price: 0,
        category: '',
        stock: 0,
        delivery_days: 7,
        has_color_variations: false,
        color_variations: [],
        images: [],
        image_url: '',
        gallery: [],
        unit_type: 'pieces',
        packet_size: null,
        material: ''
      }
    );
    if (product?.has_color_variations) {
      const colorMap: { [idx: number]: { existing: string[]; new: File[] } } = {};
      (product.color_variations || []).forEach((variation, idx) => {
        colorMap[idx] = {
          existing: variation.images || [],
          new: []
        };
      });
      setColorImages(colorMap);
    } else {
      setExistingImages(product?.gallery || (product?.image_url ? [product.image_url] : []));
      setNewImages([]);
    }
  }, [product]);

  useEffect(() => {
    if (form.has_color_variations) {
      setColorImages(prev => {
        const newColorImages = { ...prev };
        form.color_variations.forEach((variation, idx) => {
          if (!newColorImages[idx]) {
            newColorImages[idx] = { existing: variation.images || [], new: [] };
          }
        });
        Object.keys(newColorImages).forEach(idx => {
          if (!form.color_variations[idx]) {
            delete newColorImages[idx];
          }
        });
        return newColorImages;
      });
    }
  }, [form.color_variations, form.has_color_variations]);

  const handleSingleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
  };

  const handleSingleImageRemove = (idx: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== idx));
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSingleImageReorder = (from: number, to: number, isExisting: boolean) => {
    if (isExisting) {
      const arr = [...existingImages];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      setExistingImages(arr);
    } else {
      const arr = [...newImages];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      setNewImages(arr);
    }
  };

  const handleColorImageAdd = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setColorImages(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        new: [...(prev[idx]?.new || []), ...files]
      }
    }));
  };

  const handleColorImageRemove = (idx: number, imgIdx: number, isExisting: boolean) => {
    setColorImages(prev => {
      const entry = prev[idx] || { existing: [], new: [] };
      if (isExisting) {
        return { ...prev, [idx]: { ...entry, existing: entry.existing.filter((_, i) => i !== imgIdx) } };
      } else {
        return { ...prev, [idx]: { ...entry, new: entry.new.filter((_, i) => i !== imgIdx) } };
      }
    });
  };

  const handleColorImageReorder = (idx: number, from: number, to: number, isExisting: boolean) => {
    setColorImages(prev => {
      const entry = prev[idx] || { existing: [], new: [] };
      if (isExisting) {
        const arr = [...entry.existing];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return { ...prev, [idx]: { ...entry, existing: arr } };
      } else {
        const arr = [...entry.new];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        return { ...prev, [idx]: { ...entry, new: arr } };
      }
    });
  };

  const addColorVariation = () => {
    setForm(prevForm => {
      const newColorVariations = [
        ...prevForm.color_variations,
        {
          id: -(Date.now() + Math.random()), // Negative ID to indicate it's new
          color_name: '',
          hex_code: '#000000',
          price: 0,
          stock: 0,
          images: []
        }
      ];
      setColorImages(prev => ({
        ...prev,
        [newColorVariations.length - 1]: { existing: [], new: [] }
      }));
      return {
        ...prevForm,
        color_variations: newColorVariations
      };
    });
  };

  const removeColorVariation = (index: number) => {
    setForm(prevForm => {
      const newColorVariations = prevForm.color_variations.filter((_, i) => i !== index);
      setColorImages(prev => {
        const newColorImages = { ...prev };
        delete newColorImages[index];
        // Re-index colorImages to match new color_variations
        const reIndexed: { [idx: number]: { existing: string[]; new: File[] } } = {};
        newColorVariations.forEach((_, i) => {
          reIndexed[i] = newColorImages[i] || { existing: [], new: [] };
        });
        return reIndexed;
      });
      return {
        ...prevForm,
        color_variations: newColorVariations
      };
    });
  };

  const updateColorVariation = (index: number, field: keyof ColorVariation, value: any) => {
    const updatedVariations = [...form.color_variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setForm({ ...form, color_variations: updatedVariations });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, has_color_variations: !!e.target.checked });
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit({
          ...form,
          newImages,
          existingImages,
          colorImages
        });
      }}
      className="flex flex-col gap-4 mb-4"
    >
      <input
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="Product Name"
        required
        className="input"
      />

      <ReactQuill
        value={form.description}
        onChange={desc => setForm({ ...form, description: desc })}
        placeholder="Description"
        className="mb-2"
      />

      <div className="grid grid-cols-2 gap-3 mb-2">
        <input
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          placeholder="Category"
          className="input"
        />
        <input
          value={form.material || ''}
          onChange={e => setForm({ ...form, material: e.target.value })}
          placeholder="Material (e.g., Cotton, Metal)"
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Unit Type</label>
          <select
            value={form.unit_type || 'pieces'}
            onChange={e => setForm({ ...form, unit_type: e.target.value as any, packet_size: e.target.value === 'packets' ? (form.packet_size || 1) : null })}
            className="input mt-1"
          >
            <option value="pieces">Pieces</option>
            <option value="packets">Packets</option>
          </select>
        </div>
        {form.unit_type === 'packets' && (
          <div>
            <label className="text-sm font-medium text-gray-700">Packet Size (pcs per packet)</label>
            <input
              value={form.packet_size || ''}
              onChange={e => setForm({ ...form, packet_size: Number(e.target.value) })}
              placeholder="e.g., 6"
              type="number"
              min="1"
              className="input mt-1"
              required
            />
          </div>
        )}
      </div>

      <input
        value={form.delivery_days || ''}
        onChange={e => setForm({ ...form, delivery_days: Number(e.target.value) })}
        placeholder="Delivery Days (default: 7)"
        type="number"
        min="1"
        className="input"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="has_color_variations"
          checked={!!form.has_color_variations}
          onChange={handleCheckboxChange}
          className="w-4 h-4"
        />
        <label htmlFor="has_color_variations" className="text-sm font-medium">
          Has Color Variations
        </label>
      </div>

      {form.has_color_variations ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Unit Type</label>
              <select
                value={form.unit_type || 'pieces'}
                onChange={e => setForm({ ...form, unit_type: e.target.value as any, packet_size: e.target.value === 'packets' ? (form.packet_size || 1) : null })}
                className="input mt-1"
              >
                <option value="pieces">Pieces</option>
                <option value="packets">Packets</option>
              </select>
            </div>
            {form.unit_type === 'packets' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Packet Size (pcs per packet)</label>
                <input
                  value={form.packet_size || ''}
                  onChange={e => setForm({ ...form, packet_size: Number(e.target.value) })}
                  placeholder="e.g., 6"
                  type="number"
                  min="1"
                  className="input mt-1"
                  required
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold">Color Variations</h4>
            <Button type="button" onClick={addColorVariation} size="sm" className="bg-green-500 hover:bg-green-600">
              <FaPlus className="mr-1" /> Add Color
            </Button>
          </div>

          {form.color_variations.map((variation, index) => (
            <div key={variation.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Color {index + 1}</h5>
                <Button
                  type="button"
                  onClick={() => removeColorVariation(index)}
                  size="sm"
                  variant="destructive"
                >
                  <FaTrash />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Color Name</label>
                  <input
                    value={variation.color_name}
                    onChange={e => updateColorVariation(index, 'color_name', e.target.value)}
                    placeholder="e.g., Red, Blue, Gold"
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      value={variation.hex_code}
                      onChange={e => updateColorVariation(index, 'hex_code', e.target.value)}
                      type="color"
                      className="h-10 w-16 rounded border"
                      required
                    />
                    <input
                      value={variation.hex_code}
                      onChange={e => updateColorVariation(index, 'hex_code', e.target.value)}
                      placeholder="#FF0000"
                      className="input flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      title="Enter a valid hex color code (e.g., #FF0000)"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Price (₹)</label>
                  <input
                    value={variation.price || ''}
                    onChange={e => updateColorVariation(index, 'price', Number(e.target.value))}
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Stock</label>
                  <input
                    value={variation.stock || ''}
                    onChange={e => updateColorVariation(index, 'stock', Number(e.target.value))}
                    placeholder="0"
                    type="number"
                    min="0"
                    className="input mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Images for this color:</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => handleColorImageAdd(index, e)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                />
                {colorImages[index]?.existing?.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {colorImages[index].existing.map((src, imgIdx) => (
                      <div key={imgIdx} className="relative inline-block">
                        <img
                          src={src}
                          alt={`Color ${index + 1} Preview ${imgIdx + 1}`}
                          className="h-20 w-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                          onClick={() => handleColorImageRemove(index, imgIdx, true)}
                          title="Remove image"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {colorImages[index]?.new?.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {colorImages[index].new.map((file, imgIdx) => (
                      <div key={imgIdx} className="relative inline-block">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Color ${index + 1} New Preview ${imgIdx + 1}`}
                          className="h-20 w-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                          onClick={() => handleColorImageRemove(index, imgIdx, false)}
                          title="Remove image"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Unit Type</label>
              <select
                value={form.unit_type || 'pieces'}
                onChange={e => setForm({ ...form, unit_type: e.target.value as any, packet_size: e.target.value === 'packets' ? (form.packet_size || 1) : null })}
                className="input mt-1"
              >
                <option value="pieces">Pieces</option>
                <option value="packets">Packets</option>
              </select>
            </div>
            {form.unit_type === 'packets' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Packet Size (pcs per packet)</label>
                <input
                  value={form.packet_size || ''}
                  onChange={e => setForm({ ...form, packet_size: Number(e.target.value) })}
                  placeholder="e.g., 6"
                  type="number"
                  min="1"
                  className="input mt-1"
                  required
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Price (₹)</label>
            <input
              value={form.price || ''}
              onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              required
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Stock</label>
            <input
              value={form.stock || ''}
              onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
              placeholder="0"
              type="number"
              min="0"
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Product Images</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleSingleImageAdd}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            />
            {existingImages.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {existingImages.map((src, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="h-24 w-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                      onClick={() => handleSingleImageRemove(idx, true)}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            {newImages.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {newImages.map((file, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New Preview ${idx + 1}`}
                      className="h-24 w-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                      onClick={() => handleSingleImageRemove(idx, false)}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-4 py-2"
        disabled={loading}
      >
        {product ? 'Update' : 'Add'} Product
      </button>
    </form>
  );
}

// ServiceForm component removed

import BannerManager from "../components/admin/BannerManager";
import CouponManager from "../components/admin/CouponManager";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  // services state removed
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_orders: 0,
    total_products: 0,
    // total_services removed
    total_revenue: 0,
    // total_bookings removed
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  // editingService state removed
  const { admin, isAdmin, loading: authLoading, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState<any[]>([]);
  // serviceReviews state removed
  const [featuredCount, setFeaturedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const editingProductForm = useMemo(() => {
    if (!editingProduct) return undefined;
    return {
      ...editingProduct,
      price: editingProduct.price,
      stock: editingProduct.stock,
      image: null,
    };
  }, [editingProduct]);

  // editingServiceForm (useMemo) removed

  // Move fetch functions here so they're defined before useEffect
  const fetchProducts = async () => {
    try {
      const res = await apiService.get<Product[]>("/backend/admin/get_products.php");
      if (res.error && (res.error.status === 401 || res.error.status === 403)) {
        const errorMessage = res.error?.message || "Failed to fetch products";
        showToast(errorMessage, "error");
        logout();
        return;
      }
      if (res.success && Array.isArray(res.data)) {
        setProducts(
          res.data.map((p: Product) => ({
            ...p,
            id: Number(p.id),
            price: Number(p.price),
            stock: Number(p.stock),
            delivery_days: Number(p.delivery_days || 7),
            image_url: p.image_url || '/default-image.png',
            material: p.material || '',
            is_featured: p.is_featured == 1 || p.is_featured === true
          }))
        );
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiService.get<Stats>("/backend/admin/get_stats.php");
      console.log('Stats API response:', res);
      if (res.success && res.data) {
        console.log('Setting stats:', res.data);
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast("Failed to fetch stats", "error");
    }
  };

  // Orders fetching and state removed (handled within Orders component now)

  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews...');
      const [productRes] = await Promise.all([
        adminService.getAllReviews()
      ]);

      console.log('Product reviews API response:', productRes);

      const allReviews = [];

      if (productRes.success && Array.isArray(productRes.data)) {
        const productReviews = productRes.data.map((review: any) => ({ ...review, type: 'product' }));
        allReviews.push(...productReviews);
        console.log('Product reviews set:', productReviews.length);
      }

      setReviews(allReviews);
      setFeaturedCount(allReviews.filter((r: any) => r.is_homepage_featured == 1).length);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setFeaturedCount(0);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchStats()]);
      setIsLoading(false);
    };
    initializeData();
  }, []);


  useEffect(() => {
    // On mount, if no admin token, redirect to login
    if (!localStorage.getItem('admin_token')) {
      window.location.href = '/admin/login';
    }
  }, []);

  // Add polling for products
  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Services polling removed

  // Add polling for stats
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  if (!admin || !isAdmin) {
    return <div>Unauthorized. Please <a href='/admin/login'>login</a> as admin.</div>;
  }

  // Product CRUD
  const handleAddProduct = async (form: ProductFormData & { newImages?: File[]; existingImages?: string[]; colorImages?: any }) => {
    setLoading(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("delivery_days", String(form.delivery_days));
    fd.append("has_color_variations", form.has_color_variations ? '1' : '0');
    if (form.unit_type) fd.append('unit_type', form.unit_type);
    if (form.unit_type === 'packets' && form.packet_size) fd.append('packet_size', String(form.packet_size));
    fd.append('material', form.material || '');

    if (form.has_color_variations) {
      fd.append("color_variations", JSON.stringify(form.color_variations));
      const colorImgs = form.colorImages || {};
      Object.entries(colorImgs).forEach(([idx, imgs]: any) => {
        (imgs.new || []).forEach((file: File) => {
          fd.append(`color_images_${idx}[]`, file);
        });
        (imgs.existing || []).forEach((filename: string) => {
          fd.append(`existing_images_${idx}[]`, filename);
        });
      });
    } else {
      fd.delete('color_variations');
      fd.append("price", String(form.price));
      fd.append("stock", String(form.stock));
      (form.newImages || []).forEach(file => {
        fd.append('images[]', file);
      });
      (form.existingImages || []).forEach(filename => {
        fd.append('existing_images[]', filename);
      });
    }

    const response = await apiService.post<{ success: boolean; error?: any }>("/backend/admin/add_product.php", fd);
    setLoading(false);
    if (response.success) {
      showToast("Product added successfully!", "success");
      await fetchProducts();
      await fetchStats();
    } else {
      showToast(response.error?.message || "Failed to add product", "error");
    }
  };

  const handleEditProduct = async (form: ProductFormData & { newImages?: File[]; existingImages?: string[]; colorImages?: any }) => {
    if (!editingProduct) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('id', String(form.id));
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('category', form.category);
    formData.append('delivery_days', String(form.delivery_days));
    formData.append('has_color_variations', form.has_color_variations ? '1' : '0');
    if (form.unit_type) formData.append('unit_type', form.unit_type);
    if (form.unit_type === 'packets' && form.packet_size) formData.append('packet_size', String(form.packet_size));
    formData.append('material', form.material || '');

    if (form.has_color_variations) {
      // Always include all existing images for each color variant
      const colorVariationsPayload = form.color_variations.map((variation, idx) => {
        const colorImgs = form.colorImages && form.colorImages[idx] ? form.colorImages[idx] : { existing: [], new: [] };
        const imagesToKeep = [...(colorImgs.existing || [])];
        return {
          ...variation,
          images: imagesToKeep
        };
      });
      formData.append('color_variations', JSON.stringify(colorVariationsPayload));
      // Attach new images for each color variant
      Object.entries(form.colorImages || {}).forEach(([idx, imgs]: any) => {
        if (imgs.new && imgs.new.length > 0) {
          imgs.new.forEach((file: File) => {
            formData.append(`color_images_${idx}[]`, file);
          });
        }
      });
    } else {
      formData.delete('color_variations');
      formData.append('price', String(form.price));
      formData.append('stock', String(form.stock));
      // Attach new images for single-color product
      (form.newImages || []).forEach(file => {
        formData.append('images[]', file);
      });
      // Always attach existing images to keep
      (form.existingImages || []).forEach(filename => {
        formData.append('existing_images[]', filename);
      });
    }

    const res = await apiService.post<{ success: boolean; error?: any }>('/backend/admin/edit_product.php', formData);
    setLoading(false);
    if (res.success) {
      showToast("Product updated successfully!", "success");
      setEditingProduct(null);
      await fetchProducts();
      await fetchStats();
    } else {
      showToast(res.error?.message || "Failed to edit product", "error");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("id", String(id));
    const res = await apiService.post<{ success: boolean; error?: any }>("/backend/admin/delete_product.php", formData);
    setLoading(false);
    if (res.success) {
      showToast("Product deleted successfully!", "success");
      await fetchProducts();
      await fetchStats();
    } else {
      showToast(res.error?.message || "Failed to delete product", "error");
    }
  };

  // Service CRUD handlers removed

  const handleStatClick = async (label: string) => {
    if (label === 'Total Products') setActiveTab('products');
    else if (label === 'Total Orders') setActiveTab('orders');
    // Service/Booking stat clicks removed
    else if (label === 'Newsletter') setActiveTab('newsletter');
    else if (label === 'Reviews') setActiveTab('reviews');
    else if (label === 'Total Users') {
      setShowUsers(true);
      setUsersLoading(true);
      setError(null);
      try {
        const res = await apiService.get<{ success: boolean; data: any[]; error?: any }>('/backend/admin/get_users.php');
        if (res.success && Array.isArray(res.data)) {
          setUsers(res.data);
          setError(null);
        } else {
          setUsers([]);
          setError(typeof res.error === 'string' ? res.error : (res.error?.message || 'Failed to fetch users.'));
        }
      } catch (err) {
        setUsers([]);
        setError('Failed to fetch users.');
      } finally {
        setUsersLoading(false);
      }
    }
  };

  const handleToggleFeatured = async (reviewId: number, isFeatured: boolean) => {
    const res = await adminService.setReviewFeatured(reviewId, !isFeatured);

    if (res.success) {
      fetchReviews();
      showToast("Review status updated successfully!", "success");
    } else {
      showToast(typeof res.error === 'string' ? res.error : (res.error?.message || "Failed to update review status"), "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="container mx-auto py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-lg shadow-sm">
            {[
              { value: "dashboard", icon: FaChartBar, label: "Dashboard" },
              { value: "products", icon: FaBoxOpen, label: "Products" },
              { value: "orders", icon: FaShoppingCart, label: "Orders" },
              { value: "banners", icon: FaPalette, label: "Banners" },
              { value: "coupons", icon: FaTicketAlt, label: "Coupons" },
              { value: "newsletter", icon: FaUsers, label: "Newsletter" },
              { value: "reviews", icon: FaStar, label: "Reviews" }
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Icon className="mr-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
                >
                  <FaSignOutAlt /> Logout
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: FaBoxOpen, label: "Total Products", value: stats.total_products, color: "emerald", tab: "products" },
                  { icon: FaChartBar, label: "Total Orders", value: stats.total_orders, color: "violet", tab: "orders" },
                  { icon: FaUsers, label: "Total Users", value: stats.total_users, color: "sky", tab: "users" },
                  { icon: FaEnvelope, label: "Newsletter", value: '', color: "rose", tab: "newsletter" },
                  { icon: FaStar, label: "Reviews", value: '', color: "teal", tab: "reviews" },
                ].map(({ icon: Icon, label, value, color, tab }) => {
                  const getColorClasses = (color: string) => {
                    switch (color) {
                      case 'emerald': return { border: 'border-emerald-500', text: 'text-emerald-500' };
                      case 'blue': return { border: 'border-blue-500', text: 'text-blue-500' };
                      case 'violet': return { border: 'border-violet-500', text: 'text-violet-500' };
                      case 'sky': return { border: 'border-sky-500', text: 'text-sky-500' };
                      case 'amber': return { border: 'border-amber-500', text: 'text-amber-500' };
                      case 'rose': return { border: 'border-rose-500', text: 'text-rose-500' };
                      case 'teal': return { border: 'border-teal-500', text: 'text-teal-500' };
                      default: return { border: 'border-gray-400', text: 'text-gray-400' };
                    }
                  };

                  const colorClasses = getColorClasses(color);

                  return (
                    <motion.div
                      key={label}
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                      className={`bg-white overflow-hidden shadow rounded-lg transition-all duration-200 border-t-4 ${colorClasses.border} cursor-pointer`}
                      onClick={() => handleStatClick(label)}
                    >
                      <div className="p-5 flex items-center">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex-shrink-0"
                        >
                          <Icon className={`h-8 w-8 ${colorClasses.text}`} />
                        </motion.div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                            <dd className="text-2xl font-bold text-gray-900">{value}</dd>
                          </dl>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="products">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Products</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingProduct({
                    name: "",
                    description: "",
                    price: 0,
                    category: "",
                    stock: 0,
                    delivery_days: 7,
                    has_color_variations: false,
                    color_variations: [],
                    images: [],
                    image_url: "",
                    gallery: [],
                    unit_type: 'pieces',
                    packet_size: null
                  } as ProductFormData)}
                  className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
                >
                  <FaPlus /> Add Product
                </motion.button>
              </div>

              <AnimatePresence>
                {editingProduct && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <h3 className="text-xl font-semibold mb-4">
                      {editingProduct.id ? 'Edit Product' : 'Add Product'}
                    </h3>
                    <ProductForm
                      product={editingProduct}
                      onSubmit={editingProduct.id ? handleEditProduct : handleAddProduct}
                      loading={loading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                      className="bg-white border rounded-lg overflow-hidden"
                    >
                      <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={e => { e.currentTarget.src = '/default-image.png'; }}
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                        <div className="prose prose-pink max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                        <p className="text-pink-500 font-bold mb-2">₹{product.price}</p>
                        <p className="text-sm text-gray-500 mb-4">
                          Category: {product.category} | Stock: {product.stock}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          Delivery: {product.delivery_days} days
                        </p>
                        {product.has_color_variations && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <FaPalette className="text-pink-500" />
                              <span className="text-sm text-gray-600">
                                {product.color_variations.length} color variations
                              </span>
                            </div>
                            <div className="space-y-2">
                              {product.color_variations.map((variation, vIdx) => (
                                <div key={variation.id} className="border rounded p-2 flex flex-col md:flex-row md:items-center gap-2 bg-gray-50">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: variation.hex_code }} title={variation.hex_code}></span>
                                    <span className="font-medium text-sm">{variation.color_name}</span>
                                    <span className="text-xs text-gray-500">({variation.hex_code})</span>
                                  </div>
                                  <span className="text-xs text-gray-700">Price: <span className="font-semibold">₹{variation.price}</span></span>
                                  <span className={`text-xs ${variation.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>Stock: {variation.stock}</span>
                                  {variation.images && variation.images.length > 0 ? (
                                    <img
                                      src={variation.images[0]}
                                      alt={variation.color_name}
                                      className="w-8 h-8 object-cover rounded border"
                                      style={{ border: variation.images[0] === product.image_url ? '2px solid #ec4899' : undefined }}
                                      title={variation.images[0] === product.image_url ? 'Default product image' : undefined}
                                      onError={e => { e.currentTarget.src = '/default-image.png'; }}
                                    />
                                  ) : (
                                    <img
                                      src="/default-image.png"
                                      alt="No image"
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={async () => {
                              try {
                                const newStatus = !product.is_featured;
                                const res = await apiService.post('/backend/admin/update_product_featured.php', {
                                  product_id: product.id,
                                  is_featured: newStatus
                                });
                                if (res.success) {
                                  setProducts(products.map(p =>
                                    p.id === product.id ? { ...p, is_featured: newStatus } : p
                                  ));
                                  showToast(`Product ${newStatus ? 'featured' : 'unfeatured'} successfully`, 'success');
                                } else {
                                  showToast(res.error?.message || 'Failed to update featured status', 'error');
                                }
                              } catch (err) {
                                showToast('Failed to update featured status', 'error');
                              }
                            }}
                            className={`p-2 rounded-full transition-colors ${product.is_featured
                              ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                              : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
                              }`}
                            title={product.is_featured ? "Unfeature Product" : "Feature Product"}
                          >
                            <FaStar size={18} />
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditingProduct({
                              ...product,
                              color_variations: product.color_variations || []
                            })}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <FaEdit /> Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <FaTrash /> Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Stock Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded shadow">
                      <div className="font-semibold">{product.name}</div>
                      <div>Stock: <span className={product.stock <= 5 ? "text-red-500" : "text-green-600"}>{product.stock}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Services tab content removed */}

          {/* Bookings tab content removed */}

          <TabsContent value="orders" className="space-y-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Orders />
            </motion.div>
          </TabsContent>

          <TabsContent value="newsletter">
            <AdminNewsletter />
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <BannerManager />
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <CouponManager />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold mb-6">Product Reviews</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review: any) => (
                  <div key={`${review.type}-${review.id}`} className="bg-white rounded-lg shadow p-4 border border-pink-100">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={review.avatar_url || '/default-avatar.png'} alt="avatar" className="h-10 w-10 rounded-full object-cover border" />
                      <div>
                        <div className="font-semibold">{review.user_name}</div>
                        <div className="text-xs text-gray-400">{review.user_email}</div>
                        <div className="text-xs text-gray-500 mb-1">
                          Product: {review.product_name || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    <div className="text-gray-700 mb-2">{review.review}</div>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        {review.images.map((imgUrl: string, idx: number) => (
                          <img key={idx} src={imgUrl} alt="Review" className="h-16 w-16 object-cover rounded border" />
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleToggleFeatured(review.id, review.is_homepage_featured === 1)}
                        className={`px-2 py-1 text-xs rounded ${review.is_homepage_featured === 1
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                          }`}
                      >
                        {review.is_homepage_featured === 1 ? 'Featured' : 'Feature'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {reviews.length === 0 && <div className="text-center text-gray-500 py-8">No reviews found.</div>}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">All Users</DialogTitle>
          </DialogHeader>
          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-pink-100">
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2">Last Used Address</th>
                    <th className="px-4 py-2">Avatar</th>
                    <th className="px-4 py-2">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-pink-50">
                      <td className="px-4 py-2 text-center">{user.id}</td>
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.address}</td>
                      <td className="px-4 py-2">{user.last_used_address}</td>
                      <td className="px-4 py-2 text-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `https://shopnest.example.com${user.avatar_url}`} alt="avatar" className="h-10 w-10 rounded-full mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">{user.created_at ? new Date(user.created_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Kolkata'
                      }) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div >
  );
}
