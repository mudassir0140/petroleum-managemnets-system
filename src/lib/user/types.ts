export interface UserSession {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}
