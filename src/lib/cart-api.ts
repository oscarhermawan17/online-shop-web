import api from "@/lib/api"

export interface ServerCartItem {
  productId: string
  variantId: string
  quantity: number
}

export const cartApi = {
  getCart: async (): Promise<ServerCartItem[]> => {
    const res = await api.get<{ data: ServerCartItem[] }>("/customer/cart")
    return res.data.data
  },

  addItem: async (productId: string, variantId: string, quantity = 1) => {
    await api.post("/customer/cart", { productId, variantId, quantity })
  },

  setQuantity: async (
    productId: string,
    variantId: string,
    quantity: number,
  ) => {
    await api.put(`/customer/cart/${productId}/${variantId}`, { quantity })
  },

  removeItem: async (productId: string, variantId: string) => {
    await api.delete(`/customer/cart/${productId}/${variantId}`)
  },

  clearCart: async () => {
    await api.delete("/customer/cart")
  },

  mergeCart: async (items: ServerCartItem[]): Promise<ServerCartItem[]> => {
    const res = await api.post<{ data: ServerCartItem[] }>(
      "/customer/cart/merge",
      { items },
    )
    return res.data.data
  },
}
