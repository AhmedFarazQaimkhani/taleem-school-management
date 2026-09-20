import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSchoolPage } from "@/lib/school-page";
import { formatPkr } from "@/lib/money";
import { PrintDocument } from "@/components/print-document";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const { db, tenant } = await requireSchoolPage(["ADMIN", "ACCOUNTANT"]);
  const invoice = await db.feeInvoice.findFirst({
    where: { id: params.id },
    include: {
      student: { include: { class: true, section: true } },
      payments: { where: { status: "PAID" }, orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();
  const last = invoice.payments[0];
  const print = await getTranslations("print");
  const fees = await getTranslations("feesPage");

  return (
    <PrintDocument brand={tenant} title={print("receipt")} titleUr={print("receiptUr")}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">{fees("receipt")}</dt>
          <dd className="font-mono">{last?.receiptNo ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Invoice</dt>
          <dd className="font-mono">{invoice.invoiceNo}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Student</dt>
          <dd>
            {invoice.student.name} ({invoice.student.admissionNo})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Class</dt>
          <dd>
            {invoice.student.class?.name ?? "—"} {invoice.student.section?.name ?? ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Period</dt>
          <dd>{invoice.periodLabel ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paid</dt>
          <dd>{formatPkr(last?.amountPaisa ?? invoice.paidPaisa)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Method</dt>
          <dd>{last?.method ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Balance</dt>
          <dd>{formatPkr(Math.max(0, invoice.amountPaisa - invoice.paidPaisa))}</dd>
        </div>
      </dl>
    </PrintDocument>
  );
}
