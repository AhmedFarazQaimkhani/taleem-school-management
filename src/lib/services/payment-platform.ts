/**
 * PlatformSubscriptionPayment gateway — the TENANT paying YOU for SaaS.
 * Keep this module independent of SchoolFeePayment so JazzCash school-fee
 * credentials never mix with platform billing.
 */
export type PlatformChargeInput = {
  tenantId: string;
  planId: string;
  amountPaisa: number;
  periodStart: Date;
  periodEnd: Date;
};

export type PlatformChargeResult = {
  ok: boolean;
  provider: string;
  providerRef?: string;
  error?: string;
};

export interface PlatformSubscriptionGateway {
  charge(input: PlatformChargeInput): Promise<PlatformChargeResult>;
}

export class ManualPlatformSubscriptionGateway implements PlatformSubscriptionGateway {
  async charge(input: PlatformChargeInput): Promise<PlatformChargeResult> {
    return {
      ok: true,
      provider: "manual",
      providerRef: `platform-${input.tenantId}-${Date.now()}`,
    };
  }
}

export function getPlatformSubscriptionGateway(): PlatformSubscriptionGateway {
  return new ManualPlatformSubscriptionGateway();
}
