export enum TableStatus {
  Available = 'available',
  Pending = 'pending',
  Ordered = 'ordered',
  Billed = 'billed',
}

export type OrderItemStatus = 'pending' | 'commanded';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  note?: string;
  guest?: number;
}

export interface Table {
  id: number;
  name:string;
  x: number;
  y: number;
  status: TableStatus;
  order: OrderItem[];
  shape?: 'square' | 'round' | 'double';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
}

export interface Category {
    id: string;
    name: string;
}