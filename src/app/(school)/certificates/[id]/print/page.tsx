import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSchoolPage } from "@/lib/school-page";
import { PrintDocument } from "@/components/print-document";

const LABELS: Record<string, { en: string; ur: string }> = {
  BONAFIDE: { en: "Bonafide Certificate", ur: "بونا فائیڈ سرٹیفکیٹ" },
  CHARACTER: { en: "Character Certificate", ur: "کردار سرٹیفکیٹ" },
  LEAVING: { en: "School Leaving Certificate", ur: "چھوڑنے کا سرٹیفکیٹ" },
};

export default async function CertificatePrintPage({ params }: { params: { id: string } }) {
  const { db, tenant } = await requireSchoolPage(["ADMIN"], "certificates");
  const certificate = await db.certificate.findFirst({
    where: { id: params.id },
    include: { student: { include: { class: true, section: true } } },
  });
  if (!certificate) notFound();
  const print = await getTranslations("print");
  const label = LABELS[certificate.type] ?? { en: certificate.type, ur: certificate.type };

  return (
    <PrintDocument brand={tenant} title={label.en} titleUr={label.ur}>
      <p className="text-center text-sm leading-8 text-emerald-950">
        This is to certify that <strong>{certificate.student.name}</strong>
        {certificate.student.nameUrdu ? ` (${certificate.student.nameUrdu})` : ""} admission no{" "}
        <span className="font-mono">{certificate.student.admissionNo}</span> is / was a student of{" "}
        {certificate.student.class?.name ?? "this school"} {certificate.student.section?.name ?? ""} at {tenant.name}.
      </p>
      <p className="text-center text-sm leading-8 text-emerald-950" dir="rtl">
        تصدیق کی جاتی ہے کہ <strong>{certificate.student.name}</strong> داخلہ نمبر {certificate.student.admissionNo}{" "}
        {tenant.name} کے طالب علم ہیں۔
      </p>
      <p className="text-center text-xs text-muted-foreground">
        {print("issued", { date: certificate.issuedAt.toISOString().slice(0, 10) })}
      </p>
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-10 pt-6 text-center text-xs text-emerald-900">
        <div>
          <div className="mb-8 border-b border-emerald-900/40" />
          {print("principal")}
        </div>
        <div>
          <div className="mb-8 border-b border-emerald-900/40" />
          {print("stamp")}
        </div>
      </div>
    </PrintDocument>
  );
}
