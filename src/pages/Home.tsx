import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserAuth } from '../context/UserAuthContext';
import WhyChooseUs from '../components/WhyChooseUs';
import FeaturedProducts from '../components/FeaturedProducts';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import NewsletterSignup from '../components/NewsletterSignup';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Sparkles, Aperture, Crown, Gem, Gift } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';

const categories = [
    {
        label: 'Hair Clips',
        dbValue: 'Hair accessories',
        icon: <Sparkles className="w-8 h-8" />,
    },
    {
        label: 'Scrunchies',
        dbValue: 'Scrunchies',
        icon: <Aperture className="w-8 h-8" />,
    },
    {
        label: 'Headbands',
        dbValue: 'Headbands',
        icon: <Crown className="w-8 h-8" />,
    },
    {
        label: 'Jewelry Sets',
        dbValue: 'Jewelry Sets',
        icon: <Gem className="w-8 h-8" />,
    },
    {
        label: 'Gift Boxes',
        dbValue: 'Gift Boxes',
        icon: <Gift className="w-8 h-8" />,
    },
];

const Home = () => {
    const { isLoggedIn } = useUserAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const { scrollY } = useScroll();
    const smoothY = useSpring(scrollY, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // PARALLAX TUNING: Adjusted significantly to prevent section merging/overlap
    // Reduced movement range to ensure sections stay separated
    const yHeroContent = useTransform(smoothY, [0, 800], [0, 100]);
    const opacityHero = useTransform(smoothY, [0, 600], [1, 0]);
    const yHeroBadge = useTransform(smoothY, [0, 800], [0, 50]);
    const yBgItems = useTransform(smoothY, [0, 1000], [0, 200]);

    // Hero Floating Elements
    const yFloating1 = useTransform(smoothY, [0, 1000], [0, -250]);
    const yFloating2 = useTransform(smoothY, [0, 1000], [0, -350]);


    // Section 2: Categories
    // Reduced to prevent eating into the next section
    const yCategories = useTransform(smoothY, [500, 2000], [0, 100]);
    const ySection2Blob = useTransform(smoothY, [500, 2000], [0, 200]);
    const ySection2Star = useTransform(smoothY, [500, 2000], [0, -150]);

    // Section 3: Why Choose Us
    const yWhyChooseUs = useTransform(smoothY, [1000, 2500], [0, 120]);

    // Section 3b: How It Works
    const yHowItWorks = useTransform(smoothY, [1500, 3000], [0, 120]);

    // Section 3 Decor
    const ySection3Bg = useTransform(smoothY, [1500, 3000], [0, 120]);
    const ySection3Float = useTransform(smoothY, [1500, 3000], [0, -200]);

    // Section 4: Testimonials
    const yTestimonials = useTransform(smoothY, [2200, 4000], [0, 100]);
    const ySection4Star = useTransform(smoothY, [2000, 3500], [0, -200]);

    // --- PARALLAX IMAGES CONFIG ---
    // --- PARALLAX IMAGES CONFIG ---
    // Mapping scrollY to movement for background layers
    // Increased ranges and movement values for more visible parallax
    const yHeroBg = useTransform(smoothY, [0, 1000], [0, 400]);
    const yMiddleBg = useTransform(smoothY, [500, 2000], [0, -300]);
    const yFooterBg = useTransform(smoothY, [1500, 3500], [0, -400]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 200);
        return () => clearTimeout(timer);
    }, []);

    const handleShopClick = (category?: string) => {
        if (category) {
            navigate('/shop', { state: { category } });
        } else {
            navigate('/shop');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-gold-100 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gold-500 font-medium font-serif italic text-lg">ShopNest</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-transparent overflow-x-hidden relative">

            {/* --- PARALLAX BACKGROUND ACCENTS --- */}
            {/* Extended height to cover more page area, effectively creating a global background layer */}
            {/* --- GLOBAL PARALLAX BACKGROUND LAYERS --- */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                {/* Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-neutral-100 to-stone-50" />

                {/* Layer 1: Hero Background (Dark Navy/Charcoal) */}
                <motion.div
                    className="absolute top-0 inset-x-0 h-[100vh] opacity-90"
                    style={{
                        y: yHeroBg,
                        backgroundImage: 'url(/images/backgrounds/hero_bg_dark.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top'
                    }}
                />

                {/* Layer 2: Middle Section Pattern (Dark Seamless) */}
                <motion.div
                    className="absolute top-[80vh] inset-x-0 h-[150vh] opacity-10"
                    style={{
                        y: yMiddleBg,
                        backgroundImage: 'url(/images/backgrounds/middle_bg_pattern_dark.png)',
                        backgroundSize: '400px',
                        backgroundRepeat: 'repeat'
                    }}
                />

                {/* Layer 3: Footer/Testimonials (Dark Vanity) */}
                <motion.div
                    className="absolute top-[200vh] inset-x-0 h-[150vh] opacity-90"
                    style={{
                        y: yFooterBg,
                        backgroundImage: 'url(/images/backgrounds/footer_bg_dark.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Gradient overlay to fade it into the pattern above */}
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent to-[#1a1a1a]" />
                </motion.div>
            </div>

            {/* --- FOREGROUND PARALLAX DECOR --- */}
            {/* Extended height to cover more page area, effectively creating a global background layer */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">


                {/* --- HERO SECTION DECOR --- */}
                <motion.div
                    className="absolute top-[8%] left-[12%] text-4xl opacity-40 text-yellow-100"
                    style={{ y: yFloating1, opacity: opacityHero }}
                >✨</motion.div>
                <motion.div
                    className="absolute top-[18%] right-[18%] text-3xl opacity-40 text-yellow-100"
                    style={{ y: yFloating2, opacity: opacityHero }}
                >✨</motion.div>

                <div className="absolute top-10 left-[-5%] w-80 h-80 bg-blue-900/30 blur-[120px] rounded-full" />
                <div className="absolute top-20 right-[-5%] w-72 h-72 bg-purple-900/20 blur-[100px] rounded-full" />

                {/* --- SECTION 2 DECOR (Categories/Why Us) --- */}
                <motion.div
                    style={{ y: ySection2Blob }}
                    className="absolute top-[800px] left-[-100px] w-96 h-96 bg-blue-100/20 blur-[100px] rounded-full"
                />
                <motion.div
                    style={{ y: ySection2Star, rotate: 45 }}
                    className="absolute top-[1200px] right-[10%] text-6xl opacity-10 text-gold-300"
                >✦</motion.div>

                {/* --- SECTION 3 DECOR (How It Works) --- */}
                <motion.div
                    style={{ y: ySection3Float }}
                    className="absolute top-[1800px] left-[5%] text-4xl opacity-15 text-indigo-400"
                >●</motion.div>
                <motion.div
                    style={{ y: ySection3Bg }}
                    className="absolute top-[2000px] right-[-100px] w-[500px] h-[500px] bg-yellow-100/20 blur-[120px] rounded-full"
                />

                {/* --- SECTION 4 DECOR (Testimonials) --- */}
                <motion.div
                    style={{ y: ySection4Star }}
                    className="absolute top-[2800px] left-[20%] text-5xl opacity-10 text-purple-400"
                >✨</motion.div>
                <motion.div
                    style={{ y: ySection4Star, x: 200 }}
                    className="absolute top-[3200px] right-[15%] text-3xl opacity-20 text-gold-400"
                >★</motion.div>
            </div>

            {/* --- HERO SECTION: COMPACT & FIXED TOP SPACE --- */}
            {/* Added mb-20 to fix overlap issue with next section */}
            {/* --- HERO SECTION: COMPACT & FIXED TOP SPACE --- */}
            {/* Added mb-20 to fix overlap issue with next section */}
            <section className="relative pt-6 pb-24 md:pt-12 md:pb-32 flex flex-col items-center justify-start text-center px-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <motion.div
                        style={{ y: yHeroBadge, opacity: opacityHero }}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-sm text-xs font-bold text-gold-300 uppercase tracking-widest backdrop-blur-md"
                    >
                        <span>👑</span> Premium Korean Accessories
                    </motion.div>

                    <motion.div style={{ y: yHeroContent, opacity: opacityHero }} className="space-y-6">
                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter font-serif leading-[1.1]">
                            Elevate Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 via-amber-500 to-yellow-600">Style Story</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-700 max-w-xl mx-auto font-light leading-relaxed">
                            Discover the perfect blend of tradition and modern trend with our hand-curated hair essentials.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button
                                size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-6 md:px-8 rounded-full text-base md:text-lg font-bold shadow-xl transition-all hover:scale-105"
                                onClick={() => handleShopClick()}
                            >
                                Shop Now
                            </Button>
                            <Button
                                size="lg" variant="ghost" className="text-gray-900 hover:bg-black/5 border border-gray-900/30 px-8 py-6 rounded-full text-lg font-semibold"
                                onClick={() => { const el = document.getElementById('categories'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                            >
                                View Categories
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- DYNAMIC BANNERS SECTION --- */}
            <div className="container mx-auto px-4 relative z-10 mt-10 mb-8">
                <BannerCarousel />
            </div>

            {/* --- CATEGORIES SECTION --- */}
            <motion.section style={{ y: yCategories }} id="categories" className="py-8 md:py-10 bg-white/40 backdrop-blur-md relative z-10 rounded-[2rem] md:rounded-[2.5rem] mx-4 md:mx-16 border border-white/40 shadow-xl overflow-hidden">
                {/* Inner Glow - Warm/Gold */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-orange-100/20 pointer-events-none" />

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-12">
                        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 font-serif">Discover Collection</motion.h2>
                        <p className="text-stone-600 text-xs tracking-widest uppercase font-medium">Elegance in every detail</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        {categories.map((cat, idx) => (
                            <motion.div
                                key={cat.label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -8 }}
                                transition={{ delay: idx * 0.1, duration: 0.6, type: "spring", stiffness: 200 }}
                                viewport={{ once: true }}
                                className="group flex flex-col items-center justify-start cursor-pointer"
                                onClick={() => handleShopClick(cat.dbValue)}
                            >
                                {/* Minimalist Circular Icon Container - Light Theme */}
                                <div className="relative mb-6">
                                    {/* Animated Glow Ring (Behind) - Gold/Amber */}
                                    <div className="absolute inset-0 rounded-full bg-amber-200/60 blur-xl opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 ease-out" />

                                    {/* Main Circle - White with soft border */}
                                    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border border-stone-100 bg-white shadow-sm flex items-center justify-center transition-all duration-500 group-hover:border-amber-200 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                                        <div className="text-stone-500 group-hover:text-amber-600 group-hover:scale-110 transition-all duration-500">
                                            {React.cloneElement(cat.icon as React.ReactElement, { className: "w-10 h-10 stroke-[1.5]" })}
                                        </div>
                                    </div>
                                </div>

                                {/* Typography - Dark */}
                                <h3 className="text-sm md:text-base font-medium text-gray-700 tracking-[0.2em] uppercase text-center group-hover:text-amber-900 transition-colors duration-300">
                                    {cat.label}
                                </h3>
                                {/* Simple Gold Line Indicator */}
                                <div className="mt-3 w-0 h-[1.5px] bg-amber-300 group-hover:w-8 transition-all duration-500" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Spacer for Parallax Safety */}
            <div className="h-12 md:h-32"></div>

            {/* --- FEATURED PRODUCTS SECTION --- */}
            <div className="relative z-20 bg-white/60 backdrop-blur-sm py-12 border-y border-white/20">
                <FeaturedProducts />
            </div>

            {/* Spacer for Parallax Movement */}
            <div className="h-16 md:h-40"></div>

            <motion.div style={{ y: yWhyChooseUs }} className="bg-[#98aeb6]/90 backdrop-blur-lg relative z-20 rounded-[2rem] md:rounded-[2.5rem] mx-4 md:mx-16 shadow-2xl py-8 border border-white/10">
                <WhyChooseUs />
            </motion.div>

            {/* Spacer for Parallax Movement */}
            <div className="h-16 md:h-40"></div>

            <motion.div style={{ y: yHowItWorks }} className="relative z-30 mx-6 md:mx-12">
                <HowItWorks />
            </motion.div>

            {/* Spacer for Parallax Movement */}
            <div className="h-16 md:h-40"></div>

            <motion.section style={{ y: yTestimonials }} className="py-10 md:py-16 bg-[#1e1b4b]/80 backdrop-blur-sm overflow-hidden relative z-40 border-t border-white/5 rounded-[2rem] md:rounded-[3rem] mx-3 md:mx-8 shadow-2xl">
                <Testimonials />
            </motion.section>

            {/* Spacer to prevent Footer from eating Testimonials due to parallax lag */}
            <div className="h-24 md:h-32"></div>

            <div className="bg-white relative z-50">
                <NewsletterSignup />
            </div>
        </div>
    );
};

export default Home;
