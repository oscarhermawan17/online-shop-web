export interface AppNotification {
  id: string
  orderId: string
  message: string
  isRead: boolean
  createdAt: string
  updatedAt: string
  order: {
    publicOrderId: string
    status: string
  }
}

export interface NotificationsResponse {
  notifications: AppNotification[]
  unreadCount: number
  totalCount: number
  totalPages: number
  page: number
}
