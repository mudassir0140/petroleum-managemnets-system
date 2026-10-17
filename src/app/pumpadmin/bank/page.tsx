import { MethodRecordsView } from "@/components/khata/PaymentRecordsView";

export default function BankPage() {
  return (
    <MethodRecordsView
      method="bank-transfer"
      title="Bank"
      urduTitle="بینک"
      groupTitle="Bank account"
      referenceTitle="Transaction ID"
    />
  );
}
