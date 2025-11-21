export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  type: string;
  isActive: boolean;
  imageUrl: string;
  badges?: string[];
  sortOrder: number;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  tags: string[];
  category: string;
  publishedAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  _id: string;
  name: string;
  role: string;
  organization: string;
  quote: string;
  segment: 'b2b' | 'b2c' | 'b2e';
  isActive: boolean;
}

export interface PartnerLogo {
  _id: string;
  name: string;
  logoUrl: string;
  linkUrl?: string;
  type: 'press' | 'partner' | 'event';
  isActive: boolean;
}

export interface B2BLead {
  _id: string;
  name: string;
  company: string;
  email: string;
  employeeCount?: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  createdAt: string;
}

export interface EducationLead {
  _id: string;
  schoolName: string;
  contactName: string;
  role: string;
  email: string;
  cityCountry: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  createdAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  company?: string;
  topic: 'b2b_demo' | 'b2c_question' | 'education' | 'other';
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  createdAt: string;
}

export interface SiteSettings {
  _id: string;
  heroB2CTitle: string;
  heroB2CSubtext: string;
  heroB2BTitle: string;
  heroB2BSubtext: string;
  heroEducationTitle: string;
  heroEducationSubtext: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  founderQuote?: string;
  founderName?: string;
}

