# ShopNest

ShopNest is a web application for balloon decoration services and product sales, built with React, TypeScript, Tailwind CSS, and a PHP backend.

## Quick start (development)

Frontend
1. Install dependencies and start the dev server:
```bash
npm install
npm run dev
```

Backend
1. Run a PHP server (XAMPP/WAMP or PHP built-in) and place the `backend/` folder in your web root.
2. Configure database and other credentials via environment variables (see Configuration).

Database
1. Create a database named `shopnest_db` and import the provided schema.

## Configuration
Set these environment variables on your server or in a local .env file:

- SHOPNEST_DB_HOST
- SHOPNEST_DB_USER
- SHOPNEST_DB_PASSWORD
- SHOPNEST_DB_NAME
- SHOPNEST_EMAIL_USER
- SHOPNEST_EMAIL_PASS
- SHOPNEST_RAZORPAY_KEY
- SHOPNEST_RAZORPAY_SECRET
- SHOPNEST_JWT_SECRET
- SHOPNEST_ENCRYPTION_KEY
- SHOPNEST_PRODUCTION_ORIGIN (e.g. https://shopnest.example.com)

## API
Backend endpoints are under `/backend/`:
- Authentication: `/backend/auth/`
- User: `/backend/user/`
- Admin: `/backend/admin/`
- Payments: `/backend/payments/`

## Deployment (production)
Frontend
- Build: `npm run build`
- Deploy the `dist/` folder to your web server and point your domain to it.

Backend
- Upload backend files, configure environment variables, secure the uploads directory, and enable HTTPS with a valid SSL certificate.

## Features (high level)
- User authentication (register, login, password reset)
- Product catalog, cart, wishlist
- Razorpay payment integration
- Admin panel to manage products, orders, and bookings

## Security
- JWT-based authentication (keep secrets safe)
- Restrict CORS to trusted origins in production
- Validate and sanitize user input on the server
- Use HTTPS in production

## Support
For questions or support, open an issue in this repository.
