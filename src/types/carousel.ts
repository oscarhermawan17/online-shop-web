export interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  backgroundColor?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CarouselSlideInput {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  backgroundColor?: string;
  isActive: boolean;
  sortOrder?: number;
}
