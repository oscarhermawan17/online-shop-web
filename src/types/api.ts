export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: 'owner' | 'manager' | 'staff';
    storeId: string;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'owner' | 'manager' | 'staff';
  storeId: string;
}

export interface CustomerUser {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

export interface CustomerLoginResponse {
  token: string;
  customer: CustomerUser;
}
