export interface UserSession {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name?: string;
  email: string;
  password: string;
  role: string;
  phoneNumber?: string;
  createdAt: string;
  createdBy?: string; // admin ID who created this account
  enabled?: boolean; // false if admin disabled the account
}
