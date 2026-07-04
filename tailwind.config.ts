import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
        gold: {
          100: '#F9F1D8',
          200: '#F3E5AB', // Vanilla
          300: '#EBD77C',
          400: '#D4AF37', // Metallic Gold
          500: '#C5A028',
          600: '#A6851C',
          700: '#856911',
          800: '#634D09',
          900: '#423204',
        }
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'marquee': {
					'0%': {
						transform: 'translateX(100%)'
					},
					'100%': {
						transform: 'translateX(-100%)'
					}
				},
				'marquee-slow': {
					'0%': {
						transform: 'translateX(100%)'
					},
					'100%': {
						transform: 'translateX(-100%)'
					}
				},
				'balloon-flicker': {
					'0%': { opacity: '0', transform: 'scale(0.8)' },
					'10%': { opacity: '1', transform: 'scale(1.1)' },
					'20%': { opacity: '0.7', transform: 'scale(0.95)' },
					'30%': { opacity: '1', transform: 'scale(1.05)' },
					'40%': { opacity: '0.85', transform: 'scale(0.98)' },
					'50%': { opacity: '1', transform: 'scale(1)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
				'preloader-netflix': {
					'0%': { opacity: '0', transform: 'scale(0.8)' },
					'60%': { opacity: '1', transform: 'scale(1.1)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
				'preloader-rest-in': {
					'0%': { opacity: '0', transform: 'translateX(60px) scale(0.8)' },
					'60%': { opacity: '1', transform: 'translateX(0) scale(1.08)' },
					'100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
				},
				'cursive-write': {
					'0%': { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
					'100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
				},
				'neon-glow': {
					'0%': { opacity: '0', filter: 'blur(0px)' },
					'100%': { opacity: '1', filter: 'blur(8px)' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'float-slow': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'50%': { transform: 'translateY(-15px) rotate(5deg)' },
				},
				'handwriting-stroke': {
					'0%': { strokeDashoffset: '2400' },
					'100%': { strokeDashoffset: '0' },
				},
				'handwriting-fill': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'sparkle-fadein': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'reveal-mask': {
					'0%': { width: '0' },
					'100%': { width: '900px' },
				},
				'pen-tip': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(700px)' },
				},
				'neon-pulse': {
					'0%': { filter: 'blur(8px)', opacity: '0.7' },
					'20%': { filter: 'blur(16px)', opacity: '1' },
					'60%': { filter: 'blur(16px)', opacity: '1' },
					'100%': { filter: 'blur(8px)', opacity: '0.7' },
				},
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'marquee': 'marquee 15s linear infinite',
				'marquee-slow': 'marquee-slow 30s linear infinite',
				'balloon-flicker': 'balloon-flicker 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards',
				'preloader-netflix': 'preloader-netflix 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards',
				'preloader-rest-in': 'preloader-rest-in 1.2s cubic-bezier(0.23, 1, 0.32, 1) 0.5s forwards',
				'cursive-write': 'cursive-write 0.3s ease-out forwards',
				'neon-glow': 'neon-glow 0.8s ease-out forwards',
				'float': 'float 3s ease-in-out infinite',
				'float-slow': 'float-slow 4s ease-in-out infinite',
				'handwriting-stroke': 'handwriting-stroke 2.2s ease-in-out forwards',
				'handwriting-fill': 'handwriting-fill 0.7s 2.2s ease-in forwards',
				'sparkle-fadein': 'sparkle-fadein 0.7s 2.8s ease-in forwards',
				'reveal-mask': 'reveal-mask 2.2s ease-in-out forwards',
				'pen-tip': 'pen-tip 2.2s ease-in-out forwards',
				'neon-pulse': 'neon-pulse 1.2s 2.2s ease-in-out forwards',
        'shimmer': 'shimmer 3s linear infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
