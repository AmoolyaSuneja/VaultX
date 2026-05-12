import {
  Briefcase,
  CreditCard,
  Folder,
  ShoppingBag,
  User,
  Users,
  type LucideIcon
} from 'lucide-react';

const categoryIconMap: Record<string, LucideIcon> = {
  Finance: CreditCard,
  Personal: User,
  Work: Briefcase,
  Social: Users,
  Shopping: ShoppingBag,
  General: Folder
};

export function getCategoryIcon(category?: string): LucideIcon {
  if (!category) return Folder;
  return categoryIconMap[category] ?? Folder;
}
