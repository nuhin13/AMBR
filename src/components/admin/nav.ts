import type { Permission } from "@/modules/auth/rbac";

export type AdminNavItem = { href: string; label: string; permission: Permission; icon: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", permission: "dashboard:view", icon: "LayoutDashboard" },
      { href: "/admin/reports", label: "Reports", permission: "reports:view", icon: "BarChart3" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", permission: "orders:manage", icon: "ShoppingBag" },
      { href: "/admin/customers", label: "Customers", permission: "customers:view", icon: "Users" },
      { href: "/admin/reviews", label: "Reviews", permission: "reviews:moderate", icon: "Star" },
      { href: "/admin/messages", label: "Messages", permission: "customers:view", icon: "Mail" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", permission: "catalog:manage", icon: "Package" },
      { href: "/admin/inventory", label: "Inventory", permission: "inventory:manage", icon: "Boxes" },
      { href: "/admin/categories", label: "Categories", permission: "catalog:manage", icon: "FolderTree" },
      { href: "/admin/collections", label: "Collections", permission: "catalog:manage", icon: "Layers" },
      { href: "/admin/taxonomy", label: "Families, notes & occasions", permission: "catalog:manage", icon: "Tags" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promotions/coupons", label: "Coupons", permission: "promotions:manage", icon: "TicketPercent" },
      { href: "/admin/promotions/campaigns", label: "Campaigns", permission: "promotions:manage", icon: "Megaphone" },
      { href: "/admin/newsletter", label: "Newsletter", permission: "promotions:manage", icon: "Send" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content/banners", label: "Banners", permission: "content:manage", icon: "Image" },
      { href: "/admin/content/homepage", label: "Homepage", permission: "content:manage", icon: "Home" },
      { href: "/admin/content/pages", label: "Pages & policies", permission: "content:manage", icon: "FileText" },
      { href: "/admin/content/faq", label: "FAQ", permission: "content:manage", icon: "HelpCircle" },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/shipping", label: "Shipping", permission: "shipping:manage", icon: "Truck" },
      { href: "/admin/payments", label: "Payments", permission: "settings:manage", icon: "CreditCard" },
      { href: "/admin/settings", label: "Settings", permission: "settings:manage", icon: "Settings" },
      { href: "/admin/staff", label: "Staff", permission: "staff:manage", icon: "ShieldCheck" },
      { href: "/admin/audit-log", label: "Audit log", permission: "audit:view", icon: "History" },
    ],
  },
];
