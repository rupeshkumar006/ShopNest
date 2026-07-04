import { apiService } from './apiService';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  image_url: string;
  description: string;
  category: string;
  stock?: number;
  delivery_days?: number;
  has_color_variations?: boolean;
  color_variations?: ColorVariation[];
  unit_type?: 'pieces' | 'packets';
  packet_size?: number | null;
}

export interface ColorVariation {
  id: number;
  color_name: string;
  hex_code: string;
  price: number;
  stock: number;
  images: string[];
}

export interface ProductResponse {
  success: boolean;
  data?: Product[];
  error?: string;
}

class ProductService {
  private validateProduct(product: Product): void {
    if (!product.name?.trim()) {
      throw new Error('Product name is required');
    }
    if (!product.description?.trim()) {
      throw new Error('Product description is required');
    }
    if (product.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }
    if (!product.category?.trim()) {
      throw new Error('Product category is required');
    }
    if (product.stock !== undefined && product.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
    if (!product.image_url?.trim()) {
      throw new Error('Product image URL is required');
    }
  }

  async getAllProducts(): Promise<ProductResponse> {
    try {
      const response = await apiService.get<{ success: boolean; data: Product[] }>("/backend/user/get_products.php");
      // Handle both {data: [...]} and just [...] for backward compatibility
      let products: Product[] = [];
      if (Array.isArray((response as any).data)) {
        products = (response as any).data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        products = (response.data as any).data;
      }
      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        data: []
      };
    }
  }

  async getProductById(id: number): Promise<ProductResponse> {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }
      const response = await apiService.get<Product>(`/backend/user/get_product.php?id=${id}`);
      return {
        success: true,
        data: response.data ? [response.data] : []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        data: []
      };
    }
  }

  async getProductsByCategory(category: string): Promise<ProductResponse> {
    try {
      if (!category?.trim()) {
        throw new Error('Category is required');
      }
      const response = await apiService.get<Product[]>(`/backend/user/get_products.php?category=${encodeURIComponent(category)}`);
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products by category',
        data: []
      };
    }
  }

  async searchProducts(query: string): Promise<ProductResponse> {
    try {
      if (!query?.trim()) {
        throw new Error('Search query is required');
      }
      const response = await apiService.get<Product[]>(`/backend/user/search_products.php?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search products',
        data: []
      };
    }
  }

  async submitReview(productId: number, rating: number, review: string, images: File[] = []): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('product_id', productId.toString());
      formData.append('rating', rating.toString());
      formData.append('review', review);
      
      images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      const response = await apiService.post('/backend/user/submit_review.php', formData);
      
      // Return the response as-is, let the calling component handle success/error
      return response;
    } catch (error) {
      console.error('Error submitting review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit review'
      };
    }
  }

  async getReviews(productId: number): Promise<any> {
    try {
      const response = await apiService.get(`/backend/user/get_reviews.php?product_id=${productId}`);
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to fetch reviews');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async buyNow(productId: number, quantity: number, colorVariationId?: number, userDetails?: { name?: string, phone?: string }): Promise<any> {
    try {
      const payload: any = {
        product_id: productId,
        quantity: quantity,
        color_variation_id: colorVariationId
      };
      if (userDetails) {
        if (userDetails.name) payload.name = userDetails.name;
        if (userDetails.phone) payload.phone = userDetails.phone;
      }
      const response = await apiService.post('/backend/user/buy_now.php', payload);
      if (response.success) {
        return response;
      }
      throw new Error(response.error?.message || 'Failed to create order');
    } catch (error) {
      console.error('Error in buy now:', error);
      throw error;
    }
  }
}

export const productService = new ProductService(); 