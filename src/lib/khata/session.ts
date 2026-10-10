import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface KhataClientSession {
  khataClientId: string;
  pumpId: string;
  clientName: string;
}

const KHATA_CLIENT_COOKIE_NAME = "khata_client_session";

export const getKhataClientSession = cache(async (): Promise<KhataClientSession> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(KHATA_CLIENT_COOKIE_NAME)?.value;

  if (!raw) {
    redirect("/khata-client/login");
  }

  try {
    const session: KhataClientSession = JSON.parse(raw);
    return session;
  } catch {
    redirect("/khata-client/login");
  }
});
