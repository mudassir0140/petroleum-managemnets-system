export interface AdminSession {
  adminId: string;
  adminName: string;
  adminEmail: string;
  role: "admin";
}

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
}
