import React, { useState, useEffect } from 'react';
import { adminService, Banner, BannerImage } from '../../services/adminService';
import { API_CONFIG } from '../../services/apiConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Eye, EyeOff, Plus, Upload, Image as ImageIcon, Link as LinkIcon, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BannerManager() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'add'>('list');

    // Form State
    const [files, setFiles] = useState<File[]>([]);
    const [linkUrls, setLinkUrls] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [template, setTemplate] = useState<'standard' | 'modern_overlay' | 'split' | 'glassmorphism'>('standard');

    // Derived state for previews
    const filePreviews = React.useMemo(() => {
        return files.map(f => URL.createObjectURL(f));
    }, [files]);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await adminService.getBanners(true);
            if (res.success && res.data) {
                setBanners(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch banners", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(newFiles);
            // Reset links to match new file count
            setLinkUrls(new Array(newFiles.length).fill(''));
        }
    };

    const handleLinkChange = (index: number, value: string) => {
        const newLinks = [...linkUrls];
        newLinks[index] = value;
        setLinkUrls(newLinks);
    };

    const buildRatioHint = () => {
        const count = files.length;
        if (count <= 0) return "Supported formats: JPG, PNG, WEBP";
        if (count === 1) return "Best fit: 1920x600px (3.2:1 Ratio)";
        if (count === 2) return "Best fit per image: 960x600px (Split view)";
        if (count === 3) return "Best fit per image: 640x600px (3-Col Grid)";
        return "Best fit: Evenly split grid";
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this banner?")) return;
        try {
            await adminService.deleteBanner(id);
            setBanners(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await adminService.toggleBannerStatus(id, !currentStatus);
            setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return alert("Please select at least one image");

        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', description);
        fd.append('style_template', template);
        fd.append('is_active', 'true');

        files.forEach((file) => {
            fd.append('images[]', file);
        });

        linkUrls.forEach((link) => {
            fd.append('link_urls[]', link);
        });

        try {
            const res = await adminService.addBanner(fd);
            if (res.success) {
                alert("Banner created!");
                setView('list');
                setFiles([]);
                setLinkUrls([]);
                setTitle('');
                setDescription('');
                fetchBanners();
            } else {
                alert("Error: " + (res.error?.message || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create banner");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Home Page Banners</h2>
                {view === 'list' && (
                    <Button onClick={() => setView('add')} className="gap-2 bg-black text-white hover:bg-gray-800">
                        <Plus className="w-4 h-4" /> Add New Banner
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
                    {loading ? <div className="text-center py-10">Loading banners...</div> : null}
                    {!loading && banners.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl text-gray-400">
                            No banners found. Create one to get started.
                        </div>
                    )}

                    <div className="grid gap-4">
                        {banners.map((banner) => (
                            <motion.div
                                key={banner.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!banner.is_active ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="flex flex-col md:flex-row h-full">
                                    {/* Preview Area */}
                                    <div className="w-full md:w-64 h-40 bg-gray-100 flex-shrink-0 relative overflow-hidden">
                                        {banner.images && banner.images.length > 0 ? (
                                            <div className={`grid w-full h-full ${banner.images.length > 1 ? 'grid-cols-' + Math.min(banner.images.length, 3) : ''}`}>
                                                {banner.images.slice(0, 3).map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img.image_url.startsWith('http') ? img.image_url : `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${img.image_url}`}
                                                        className="w-full h-full object-cover"
                                                        alt="Banner"
                                                        onError={(e) => {
                                                            console.error("Failed to load image:", e.currentTarget.src);
                                                            e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Error';
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                                            {banner.style_template}
                                        </div>
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-6 flex-1 flex flex-col justify-center">
                                        <h3 className="text-lg font-bold text-gray-900">{banner.title || "Untitled Banner"}</h3>
                                        {banner.description && <p className="text-sm text-gray-500 mt-1">{banner.description}</p>}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {banner.images.map((img, i) => (
                                                img.link_url ? (
                                                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                                        <LinkIcon className="w-3 h-3" /> Image {i + 1}: {img.link_url}
                                                    </span>
                                                ) : null
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l bg-gray-50/50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(banner.id, banner.is_active)}
                                            className={banner.is_active ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-gray-400"}
                                            title={banner.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(banner.id)}
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
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Banner</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form id="bannerForm" onSubmit={handleSubmit} className="space-y-8">

                                {/* 1. Image Upload Section */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Images</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-10 h-10 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-600">Click to upload images</p>
                                            <p className="text-xs text-gray-400">Supports JPG, PNG, WEBP</p>
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="mt-4 space-y-4">
                                            <div className="bg-blue-50 text-blue-800 text-xs px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                {buildRatioHint()}
                                            </div>

                                            <div className="grid gap-4">
                                                {files.map((file, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg border">
                                                        <img src={filePreviews[idx]} className="w-24 h-16 object-cover rounded bg-white" alt="Preview" />
                                                        <div className="flex-1 space-y-2">
                                                            <p className="text-xs font-medium text-gray-500 truncate">{file.name}</p>
                                                            <Input
                                                                placeholder="Target Link (e.g., /shop?category=hair-clips)"
                                                                value={linkUrls[idx] || ''}
                                                                onChange={(e) => handleLinkChange(idx, e.target.value)}
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Banner Details & Template */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title (Optional)</label>
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="e.g. Summer Sale"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Short text describing the banner..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Style Template</label>
                                            <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard (Full Width)</SelectItem>
                                                    <SelectItem value="modern_overlay">Modern Overlay</SelectItem>
                                                    <SelectItem value="split">Split Layout</SelectItem>
                                                    <SelectItem value="glassmorphism">Glassmorphism Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Choose how the text and image interact. If multiple images are uploaded, they will be arranged in a grid automatically.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 bg-gray-50/50 border-t p-6">
                            <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>
                            <Button type="submit" form="bannerForm" className="bg-black text-white hover:bg-gray-800">
                                Create Banner
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
