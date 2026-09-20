"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { formatPkr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Payment = {
  id: string;
  method: string;
  status: string;
  amountPaisa: number;
  invoiceNo: string;
  studentName: string;
};

export default function PayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<{ payment: Payment }>(`/api/fee-payments/${params.id}`)
      .then((payload) => setPayment(payload.payment))
      .catch((err) => setError(err.message));
  }, [params.id]);

  async function confirm() {
    setPending(true);
    try {
      await api(`/api/fee-payments/${params.id}/confirm`, { method: "POST" });
      router.push("/fees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPending(false);
    }
  }

  const provider = payment?.method === "EASYPAISA" ? "EasyPaisa" : "JazzCash";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{provider} checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {payment ? (
            <>
              <p className="text-sm text-muted-foreground">
                Pay {formatPkr(payment.amountPaisa)} for {payment.studentName} · invoice {payment.invoiceNo}
              </p>
              <p className="text-xs text-muted-foreground">
                Sandbox only. Live JazzCash / EasyPaisa credentials plug into the same gateway interface.
              </p>
              {payment.status === "PAID" ? (
                <p className="text-sm text-emerald-700">Already paid.</p>
              ) : (
                <Button className="w-full" onClick={confirm} disabled={pending}>
                  {pending ? "Processing…" : `Pay with ${provider}`}
                </Button>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
