export interface Material {
  id: string;
  factory_name: string;
  owner_name: string;
  owner_phone: string;
  rate: number;
  images: string[];
  status: 'available' | 'sold';
  created_at: string;
  updated_at: string;
  created_by: string;
  description?: string;
  notes?: string;
}

// Camel case version for frontend (if needed)
export interface MaterialCamelCase {
  id: string;
  factoryName: string;
  ownerName: string;
  ownerPhone: string;
  rate: number;
  images: string[];
  status: 'available' | 'sold';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  description?: string;
  notes?: string;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  role: 'admin' | 'buyer';
  displayName?: string;
  companyName?: string;
  phone?: string;
}

export interface BuyRequest {
  id: string;
  materialId: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
  timestamp: Date;
  status: 'pending' | 'contacted' | 'completed';
}
