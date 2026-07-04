# ShopNest

A modern web application for balloon decoration services and product sales, built with React, TypeScript, and PHP.

## Domain Configuration

This application is configured to work with the domain `shopnest.example.com`. All API endpoints and image URLs have been updated to use this domain.

### Key Configuration Files Updated:

1. **Frontend API Configuration** (`src/services/apiConfig.ts`)
   - Updated base URL to use `https://shopnest.example.com`
   - Maintains localhost support for development

2. **Backend CORS Configuration** (`backend/cors.php`)
   - Added `shopnest.example.com` to allowed origins
   - Maintains localhost support for development

3. **Vite Configuration** (`vite.config.ts`)
   - Updated proxy target to `https://shopnest.example.com`
   - Enabled secure HTTPS connections

4. **Image URLs**
   - All product, service, and avatar images now use `https://shopnest.example.com/backend/uploads/`
   - Updated across all PHP backend files

## Development Setup

1. **Frontend (React/TypeScript)**
   ```bash
   npm install
   npm run dev
   ```

2. **Backend (PHP)**
   - Ensure XAMPP/WAMP is running
   - Place backend files in your web server directory
   - Configure database connection in `backend/config/db.php`

3. **Database**
   - Create database named `shopnest_db`
   - Import the database schema

## Production Deployment

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your web server
3. Ensure the domain points to the correct directory

### Backend Deployment
1. Upload all backend files to your server
2. Configure the database connection
3. Set up SSL certificate for HTTPS
4. Ensure proper file permissions for uploads directory

### Environment Variables
- Database credentials are now loaded from environment variables in `backend/config/db.php`
- Email settings are now loaded from environment variables in `backend/config/email.php`
- Razorpay credentials are now loaded from environment variables in `backend/config/razorpay.php`

Example variables:
- `SHOPNEST_DB_HOST`
- `SHOPNEST_DB_USER`
- `SHOPNEST_DB_PASSWORD`
- `SHOPNEST_DB_NAME`
- `SHOPNEST_EMAIL_USER`
- `SHOPNEST_EMAIL_PASS`
- `SHOPNEST_RAZORPAY_KEY`
- `SHOPNEST_RAZORPAY_SECRET`
- `SHOPNEST_JWT_SECRET`
- `SHOPNEST_ENCRYPTION_KEY`
- `SHOPNEST_PRODUCTION_ORIGIN`

## Features

- **User Authentication**: Registration, login, password reset
- **Product Management**: Browse, search, add to cart, wishlist
- **Service Bookings**: Book balloon decoration services
- **Payment Integration**: Razorpay payment gateway
- **Admin Panel**: Manage products, services, orders, and bookings
- **Responsive Design**: Mobile-friendly interface

## API Endpoints

All API endpoints are prefixed with `/backend/` and include:
- Authentication: `/backend/auth/`
- User operations: `/backend/user/`
- Admin operations: `/backend/admin/`
- Payments: `/backend/payments/`

## Security

- JWT-based authentication
- CORS protection
- Input validation and sanitization
- Secure file upload handling
- HTTPS enforcement in production

## Support

For technical support or questions, please contact the development team.

---
Built with ❤️ using React, TypeScript, and Tailwind CSS
