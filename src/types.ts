export interface OrderItem {
  id: string;
  orderNumber: string;
  product: string;
  price: number;
  date: string;
  paymentMethod: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueProducts: number;
}

export interface ChartData {
  name: string;
  value: number;
}
