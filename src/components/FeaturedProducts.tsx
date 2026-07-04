import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DOMPurify from 'dompurify';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    is_featured: boolean | number;
}

const FeaturedProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                const response = await apiService.get('/backend/user/get_products.php');
                if (response.success && Array.isArray((response as any).data)) {
                    const allProducts = (response as any).data;
                    // Filter for featured products
                    const featured = allProducts.filter((p: any) => p.is_featured == 1 || p.is_featured === true);

                    const formattedProducts = featured.map((p: any) => ({
                        ...p,
                        id: Number(p.id),
                        price: Number(p.price),
                        image_url: p.image_url || '/default-image.png'
                    }));
                    setProducts(formattedProducts);
                }
            } catch (err) {
                console.error('Error fetching featured products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);



    // Determine how many items to show based on screen width (responsive)
    // Helper to get window width (simple hook-like behavior)
    const getVisibleCount = () => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth < 640) return 1;
            if (window.innerWidth < 1024) return 2;
            return 4;
        }
        return 1;
    };

    const isFirst = currentIndex === 0;
    const isLast = currentIndex + getVisibleCount() >= products.length;

    const nextSlide = () => {
        const count = getVisibleCount();
        if (currentIndex + count < products.length) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    if (loading || products.length === 0) return null;



    // We will slice the products array to show 'visibleCount' items starting from currentIndex
    // We need to handle wrapping around the end of the array
    // We will slice the products array to show 'visibleCount' items starting from currentIndex
    // We need to handle wrapping around the end of the array
    const getVisibleProducts = () => {
        const count = getVisibleCount();

        // If we have fewer products than visible slots, just show what we have without duplication
        if (products.length <= count) {
            return products;
        }

        const visible = [];
        for (let i = 0; i < count; i++) {
            const index = (currentIndex + i) % products.length;
            visible.push(products[index]);
        }
        return visible;
    };

    return (
        <section className="py-20 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold font-serif text-gray-900 mb-4 tracking-tight"
                    >
                        Featured Collections
                    </motion.h2>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '6rem' }}
                        viewport={{ once: true }}
                        className="h-1 bg-gradient-to-r from-amber-400 to-yellow-600 mx-auto rounded-full"
                    />
                </div>

                <div className="relative group px-4 md:px-12">
                    {/* Buttons positioned absolutely on sides */}
                    {products.length > getVisibleCount() && (
                        <>
                            <div className={`absolute top-1/2 -translate-y-1/2 left-0 z-30 ${isFirst ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={prevSlide}
                                    disabled={isFirst}
                                    className="rounded-full bg-white/80 backdrop-blur-sm border-stone-200 shadow-lg hover:bg-amber-50 text-stone-700 h-12 w-12 hidden md:flex"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className={`absolute top-1/2 -translate-y-1/2 right-0 z-30 ${isLast ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={nextSlide}
                                    disabled={isLast}
                                    className="rounded-full bg-white/80 backdrop-blur-sm border-stone-200 shadow-lg hover:bg-amber-50 text-stone-700 h-12 w-12 hidden md:flex"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Mobile buttons inside/below or smaller */}
                    <div className="flex md:hidden justify-between absolute top-1/2 -translate-y-1/2 w-full left-0 px-2 z-30 pointer-events-none">
                        {products.length > getVisibleCount() && (
                            <>
                                <div className={isFirst ? 'opacity-0' : 'pointer-events-auto'}>
                                    <Button variant="outline" size="icon" onClick={prevSlide} disabled={isFirst} className="rounded-full bg-white/80 backdrop-blur-sm border-stone-200 shadow-lg h-10 w-10">
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className={isLast ? 'opacity-0' : 'pointer-events-auto'}>
                                    <Button variant="outline" size="icon" onClick={nextSlide} disabled={isLast} className="rounded-full bg-white/80 backdrop-blur-sm border-stone-200 shadow-lg h-10 w-10">
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>


                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${products.length < 4 ? 'justify-center lg:flex lg:flex-wrap' : ''}`}>
                        <AnimatePresence mode='popLayout'>
                            {getVisibleProducts().map((product) => (
                                <motion.div
                                    key={`${product.id}-${currentIndex}`} // Unique key to force re-render/animate on slide
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="cursor-pointer w-full max-w-[260px] md:max-w-[280px] mx-auto"
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    <Card className="h-full bg-white border-stone-100 hover:border-amber-300 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl group/card">
                                        <div className="relative aspect-[4/5] overflow-hidden bg-stone-50">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                onError={(e) => (e.currentTarget.src = '/default-image.png')}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                        </div>

                                        <CardContent className="p-5">
                                            <h3 className="text-lg font-bold font-serif text-gray-900 truncate mb-2 group-hover/card:text-amber-700 transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-stone-500 text-sm line-clamp-2 mb-4 h-10">
                                                <span dangerouslySetInnerHTML={{ __html: product.description ? DOMPurify.sanitize(product.description.substring(0, 60)) : '' }} />
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-stone-900">₹{product.price}</span>
                                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover/card:bg-amber-500 group-hover/card:text-white transition-colors">
                                                    <ShoppingBag size={14} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
