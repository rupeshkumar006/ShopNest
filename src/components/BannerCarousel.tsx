import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService, Banner } from '../services/adminService';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_CONFIG } from '../services/apiConfig';

export default function BannerCarousel() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            const res = await adminService.getBanners(false); // Fetch only active
            if (res.success && res.data) {
                setBanners(res.data);
            }
        };
        fetch();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            handleNext();
        }, 5000); // 5s for better readability, requested 3s but 3s is very fast for text. Can adjust to 3000 if strict.
        // Adjusting to 3000 as per request
        return () => clearInterval(timer);
    }, [currentIndex, banners.length]);

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const handleBannerClick = (link?: string) => {
        if (!link) return;
        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else {
            navigate(link);
        }
    };

    if (banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    // Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div className="relative w-full h-[250px] md:h-[400px] overflow-hidden bg-gray-50 mb-8 rounded-2xl mx-auto max-w-[98%] shadow-lg group">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* --- RENDER TEMPLATES --- */}
                    {renderTemplate(currentBanner, handleBannerClick)}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            {banners.length > 1 && (
                <>
                    <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full shadow transition-all opacity-0 group-hover:opacity-100 z-10">
                        <ChevronLeft className="w-5 h-5 text-current" />
                    </button>
                    <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/60 backdrop-blur-sm p-2 rounded-full shadow transition-all opacity-0 group-hover:opacity-100 z-10">
                        <ChevronRight className="w-5 h-5 text-current" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setDirection(idx > currentIndex ? 1 : -1);
                                    setCurrentIndex(idx);
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Separate Template Logic
function renderTemplate(banner: Banner, onLink: (url?: string) => void) {
    const images = banner.images || [];

    // Fallback if no images
    if (images.length === 0) return <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>;

    // --- SINGLE IMAGE TEMPLATES (Grid removed for cleaner look) ---
    // Use the first image as the main banner image.
    const img = images[0];
    const imgSrc = img.image_url.startsWith('http') ? img.image_url : `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${img.image_url}`;

    // 1. Modern Overlay (Center Gradient)
    if (banner.style_template === 'modern_overlay') {
        return (
            <div className="relative w-full h-full cursor-pointer" onClick={() => onLink(img.link_url)}>
                <img src={imgSrc} className="w-full h-full object-cover" alt={banner.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end pb-12 px-4 text-center">
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        {banner.title && <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-wide drop-shadow-md">{banner.title}</h2>}
                        {banner.description && <p className="text-sm md:text-base text-gray-100 max-w-lg mx-auto drop-shadow-sm">{banner.description}</p>}
                    </motion.div>
                </div>
            </div>
        );
    }

    // 2. Glassmorphism (Floating Card)
    if (banner.style_template === 'glassmorphism') {
        return (
            <div className="relative w-full h-full cursor-pointer" onClick={() => onLink(img.link_url)}>
                <img src={imgSrc} className="w-full h-full object-cover" alt={banner.title} />
                <div className="absolute inset-0 flex items-center justify-start px-8 md:px-16">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/20 backdrop-blur-md border border-white/30 p-6 md:p-8 rounded-2xl max-w-md shadow-xl"
                    >
                        {banner.title && <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{banner.title}</h2>}
                        {banner.description && <p className="text-white/90 text-sm md:text-base mb-4">{banner.description}</p>}
                        <span className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                            Shop Now
                        </span>
                    </motion.div>
                </div>
            </div>
        );
    }

    // 3. Split (Image Left, Text Right - Simulated with overlay if single image)
    if (banner.style_template === 'split') {
        return (
            <div className="relative w-full h-full cursor-pointer bg-neutral-900" onClick={() => onLink(img.link_url)}>
                <div className="absolute inset-0">
                    <img src={imgSrc} className="w-full h-full object-cover opacity-60" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent"></div>
                </div>
                <div className="absolute inset-y-0 left-0 flex items-center px-8 md:px-16 max-w-2xl">
                    <div className="text-left z-10 border-l-4 border-gold-400 pl-6">
                        {banner.title && <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 uppercase tracking-wider">{banner.title}</h2>}
                        {banner.description && <p className="text-gray-200 text-sm md:text-lg">{banner.description}</p>}
                    </div>
                </div>
            </div>
        );
    }

    // Default: Standard Full Width (Cleaner)
    return (
        <div className="relative w-full h-full cursor-pointer group" onClick={() => onLink(img.link_url)}>
            <img src={imgSrc} className="w-full h-full object-cover" alt={banner.title} />
            {(banner.title || banner.description) && (
                <div className="absolute bottom-6 left-6 right-6 md:left-10 md:right-auto md:max-w-md">
                    <div className="bg-white/90 backdrop-blur px-5 py-3 rounded-lg shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        {banner.title && <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>}
                        {banner.description && <p className="text-gray-600 text-xs mt-1">{banner.description}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
