import { LucideIcon, Smartphone, Home, Plane, Shirt, Book, Gift, Heart, MoreHorizontal, Watch } from "lucide-react";

export const CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
  'Electronics': { label: '3C電子', icon: Smartphone, color: 'text-[#71848e] bg-[#e2e8e7]' },
  'Home': { label: '居家生活', icon: Home, color: 'text-[#ad8e5d] bg-[#f9efd7]' },
  'Travel': { label: '旅行體驗', icon: Plane, color: 'text-[#7b8c7c] bg-[#e5ece4]' },
  'Fashion': { label: '時尚衣物', icon: Shirt, color: 'text-[#dfad9b] bg-[#fdf3ea]' },
  'Education': { label: '學習進修', icon: Book, color: 'text-[#8c8595] bg-[#e9e6ed]' },
  'Hobby': { label: '興趣愛好', icon: Heart, color: 'text-[#bb7a73] bg-[#fdf3f1]' },
  'Other': { label: '其他類別', icon: MoreHorizontal, color: 'text-gray-500 bg-gray-100' },
};

export const DEFAULT_CATEGORY = 'Other';