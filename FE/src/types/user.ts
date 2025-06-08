export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  token: string;
} 