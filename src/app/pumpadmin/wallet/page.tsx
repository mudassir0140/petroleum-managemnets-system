import { MethodRecordsView } from "@/components/khata/PaymentRecordsView";

export default function WalletPage() {
  return (
    <MethodRecordsView
      method="mobile-wallet"
      title="Mobile Wallet"
      urduTitle="موبائل والیٹ"
      groupTitle="Wallet provider"
      referenceTitle="Transaction ID"
    />
  );
}
