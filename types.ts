export enum WishType {
  INDEFINITE = 'INDEFINITE',
  LIMITED = 'LIMITED',
}

export enum WishStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

export interface WishItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  type: WishType;
  deadline?: string; // ISO string
  status: WishStatus;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  order: number; // For manual sorting of indefinite items
  
  // New fields
  imageUrl?: string;
  link?: string;
  note?: string;
}
