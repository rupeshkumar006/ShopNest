import { apiService } from './apiService';
import { productService } from './productService';

export interface CartItem {
  id: number;
  product_id: number;
  color_variation_id?: number;
  quantity: number;
  price: number;
  name: string;
  color_name?: string;
  hex_code?: string;
  image_url: string;
  description: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

class CartService {
  private readonly MAX_ITEMS = 5;
  private readonly GUEST_CART_KEY = 'guest_cart';

  private isGuest(): boolean {
    return !localStorage.getItem('user_token');
  }

  private getGuestCart(): CartItem[] {
    const stored = localStorage.getItem(this.GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveGuestCart(cart: CartItem[]): void {
    localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(cart));
  }

  async getCart(): Promise<CartResponse> {
    if (this.isGuest()) {
      const items = this.getGuestCart();
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items, total };
    }

    try {
      const response = await apiService.get<CartResponse>('/backend/user/get_cart.php');
      if (response.success && response.data) {
        return {
          items: response.data.items || [],
          total: response.data.total || 0
        };
      }
      return { items: [], total: 0 };
    } catch (error) {
      console.error('Error fetching cart:', error);
      return { items: [], total: 0 };
    }
  }

  async addToCart(productId: number, quantity: number, colorVariationId?: number): Promise<CartResponse> {
    if (this.isGuest()) {
      const items = this.getGuestCart();
      const existingItemIndex = items.findIndex(item =>
        item.product_id === productId &&
        (item.color_variation_id === colorVariationId || (!item.color_variation_id && !colorVariationId))
      );

      if (existingItemIndex > -1) {
        // Update quantity
        items[existingItemIndex].quantity += quantity;
      } else {
        // Fetch product details to create new item
        try {
          const productRes = await productService.getProductById(productId);
          if (productRes.success && productRes.data && productRes.data.length > 0) {
            const product = productRes.data[0];
            let price = product.price;
            let imageUrl = product.image_url;
            let colorName = '';

            if (colorVariationId && product.color_variations) {
              const variant = product.color_variations.find(v => v.id === colorVariationId);
              if (variant) {
                price = variant.price;
                if (variant.images && variant.images.length > 0) imageUrl = variant.images[0];
                colorName = variant.color_name;
              }
            }

            const newItem: CartItem = {
              id: Date.now(), // Fake ID for guest item
              product_id: productId,
              color_variation_id: colorVariationId,
              quantity,
              price,
              name: product.name,
              color_name: colorName,
              image_url: imageUrl,
              description: product.description || ''
            };
            items.push(newItem);
          }
        } catch (e) {
          console.error("Failed to fetch product details for guest cart", e);
          throw new Error('Failed to add item to cart');
        }
      }

      this.saveGuestCart(items);
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items, total };
    }

    try {
      const response = await apiService.post<CartResponse>('/backend/user/add_to_cart.php', {
        product_id: productId,
        quantity: quantity,
        color_variation_id: colorVariationId
      });

      if (response.success && response.data) {
        return {
          items: response.data.items || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.error?.message || 'Failed to add to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async updateQuantity(productId: number, quantity: number, colorVariationId?: number): Promise<CartResponse> {
    if (this.isGuest()) {
      const items = this.getGuestCart();
      const index = items.findIndex(item =>
        item.product_id === productId &&
        (item.color_variation_id === colorVariationId || (!item.color_variation_id && !colorVariationId))
      );

      if (index > -1) {
        if (quantity <= 0) {
          items.splice(index, 1);
        } else {
          items[index].quantity = quantity;
        }
        this.saveGuestCart(items);
      }
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items, total };
    }

    try {
      const response = await apiService.post<CartResponse>('/backend/user/update_cart_quantity.php', {
        product_id: productId,
        quantity: quantity,
        color_variation_id: colorVariationId
      });

      if (response.success && response.data) {
        return {
          items: response.data.items || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.error?.message || 'Failed to update quantity');
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw error;
    }
  }

  async removeFromCart(productId: number, colorVariationId?: number): Promise<CartResponse> {
    if (this.isGuest()) {
      let items = this.getGuestCart();
      items = items.filter(item =>
        !(item.product_id === productId &&
          (item.color_variation_id === colorVariationId || (!item.color_variation_id && !colorVariationId)))
      );
      this.saveGuestCart(items);
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items, total };
    }

    try {
      const response = await apiService.post<CartResponse>('/backend/user/remove_from_cart.php', {
        product_id: productId,
        color_variation_id: colorVariationId
      });

      if (response.success && response.data) {
        return {
          items: response.data.items || [],
          total: response.data.total || 0
        };
      }
      throw new Error(response.error?.message || 'Failed to remove from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    if (this.isGuest()) {
      this.saveGuestCart([]);
      return;
    }

    try {
      const cart = await this.getCart();
      for (const item of cart.items) {
        await this.removeFromCart(item.product_id, item.color_variation_id);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  getCartItemCountFromCart(cartItems: CartItem[]): number {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  async getCartItemCount(): Promise<number> {
    try {
      const cartResponse = await this.getCart(); // This now handles guest logic
      const cartItems = Array.isArray(cartResponse?.items) ? cartResponse.items : [];
      return this.getCartItemCountFromCart(cartItems);
    } catch {
      return 0;
    }
  }

  // Helper to get default color variation ID
  getDefaultColorVariationId(product: any): number | undefined {
    if (product && Array.isArray(product.color_variations) && product.color_variations.length > 0) {
      return product.color_variations[0].id;
    }
    return undefined;
  }
}

export const cartService = new CartService(); 