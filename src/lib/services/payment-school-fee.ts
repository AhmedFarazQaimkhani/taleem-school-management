/**
 * SchoolFeePayment gateway — students paying a TENANT school.
 * Architecturally distinct from PlatformSubscriptionPayment.
 * JazzCash / EasyPaisa adapters plug in here without changing fee services.
 */
export type SchoolFeeMethod = "JAZZCASH" | "EASYPAISA" | "CASH" | "BANK";

export type SchoolFeeChargeInput = {
  schoolId: string;
  invoiceId: string;
  paymentId: string;
  amountPaisa: number;
  studentRef: string;
  method: SchoolFeeMethod;
  returnUrl?: string;
};

export type SchoolFeeChargeResult = {
  ok: boolean;
  provider: string;
  immediate: boolean;
  providerRef?: string;
  checkoutUrl?: string;
  error?: string;
};

export interface SchoolFeePaymentGateway {
  charge(input: SchoolFeeChargeInput): Promise<SchoolFeeChargeResult>;
  verify(providerRef: string): Promise<{ paid: boolean; amountPaisa: number }>;
}

export class ManualSchoolFeeGateway implements SchoolFeePaymentGateway {
  constructor(private provider: "cash" | "bank") {}

  async charge(input: SchoolFeeChargeInput): Promise<SchoolFeeChargeResult> {
    return {
      ok: true,
      immediate: true,
      provider: this.provider,
      providerRef: `${this.provider}-${input.paymentId}`,
    };
  }

  async verify(): Promise<{ paid: boolean; amountPaisa: number }> {
    return { paid: true, amountPaisa: 0 };
  }
}

export class JazzCashGateway implements SchoolFeePaymentGateway {
  async charge(input: SchoolFeeChargeInput): Promise<SchoolFeeChargeResult> {
    return {
      ok: true,
      immediate: false,
      provider: "jazzcash",
      providerRef: `JC-${input.paymentId}`,
      checkoutUrl: `/pay/${input.paymentId}`,
    };
  }

  async verify(): Promise<{ paid: boolean; amountPaisa: number }> {
    return { paid: false, amountPaisa: 0 };
  }
}

export class EasyPaisaGateway implements SchoolFeePaymentGateway {
  async charge(input: SchoolFeeChargeInput): Promise<SchoolFeeChargeResult> {
    return {
      ok: true,
      immediate: false,
      provider: "easypaisa",
      providerRef: `EP-${input.paymentId}`,
      checkoutUrl: `/pay/${input.paymentId}`,
    };
  }

  async verify(): Promise<{ paid: boolean; amountPaisa: number }> {
    return { paid: false, amountPaisa: 0 };
  }
}

export function getSchoolFeePaymentGateway(method: SchoolFeeMethod): SchoolFeePaymentGateway {
  if (method === "JAZZCASH") return new JazzCashGateway();
  if (method === "EASYPAISA") return new EasyPaisaGateway();
  if (method === "BANK") return new ManualSchoolFeeGateway("bank");
  return new ManualSchoolFeeGateway("cash");
}
