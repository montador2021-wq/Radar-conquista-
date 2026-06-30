export interface User {
  id: string;
  firstName: string;
  lastName: string;
  store: string;
  password: string;
  role: 'vendedor' | 'admin' | 'supervisor' | 'gerente';
  photoUrl?: string;
  lastLogin?: string;
  email?: string;
  status?: 'ativo' | 'bloqueado';
  accessToken?: string;
  tenantId?: string;
  tenantName?: string;
  plan?: 'pequeno' | 'medio' | 'empresarial';
  createdAt?: string;
  expirationDate?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  store: string;
  timestamp: string;
  action: 'login' | 'logout' | 'access';
}
