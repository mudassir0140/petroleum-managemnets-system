import { pumpOwnerLogout } from "@/lib/pump-owner/actions";

export default async function LogoutPage() {
  await pumpOwnerLogout();
  return null;
}
