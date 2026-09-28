import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { loadResonanceWhopCatalog } from "./resonance-catalog";
import { WhopApiError, whopApiRequest } from "./whop-api";

const paymentSchema = z.object({
  id: z.string(), company: z.object({ id: z.string() }), currency: z.string(),
  amount_after_fees: z.number().finite(), total: z.number().finite().nullable(),
  tax_amount: z.number().finite().nullable(), refunded_amount: z.number().finite().nullable(),
});
const feesSchema = z.object({
  data: z.array(z.object({ amount: z.number().finite(), currency: z.string(), type: z.string() })),
  page_info: z.object({ has_next_page: z.boolean() }),
});

/** Read-only, bounded, no PII. Provider fields are not re-labelled as final net.
 * Whop fees can include commission-related costs; never subtract an estimated
 * commission again from amount_after_fees. No account/balance endpoint is used.
 */
type Diagnostic = {
  stage: "payment" | "fees" | "validation";
  reason: "http_error" | "schema_mismatch" | "incomplete_or_mismatched" | "request_failed";
  status?: number;
  missingScope?: string;
  fields?: string[];
};

class ObservationFailure extends Error {
  constructor(readonly diagnostic: Diagnostic) { super("Provider economics unavailable."); }
}

async function readProvider<T>(stage: "payment" | "fees", path: string, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(await whopApiRequest(path));
  } catch (error) {
    const diagnostic: Diagnostic = { stage, reason: "request_failed" };
    if (error instanceof WhopApiError) {
      diagnostic.reason = "http_error";
      diagnostic.status = error.status;
      // Only a scope name, never the provider's body, path, IDs or customer data.
      const scope = error.details.message?.match(/(?:for the |requires?\s+)([a-z_]+(?::[a-z_]+){1,3})\s+scope/i)?.[1];
      if (scope) diagnostic.missingScope = scope;
    } else if (error instanceof z.ZodError) {
      diagnostic.reason = "schema_mismatch";
      diagnostic.fields = [...new Set(error.issues.map(issue => issue.path.filter(part => typeof part === "string").join(".")))].slice(0, 10);
    }
    throw new ObservationFailure(diagnostic);
  }
}

export async function observeWhopVisitEconomics(options: { includeDiagnostics?: boolean } = {}) {
  const rows = await prisma.resonance_visit_orders.findMany({
    where: { whop_payment_id: { not: null }, status: { in: ["paid", "refunded"] } },
    select: { whop_payment_id: true }, orderBy: { created_at: "desc" }, take: 26,
  });
  const report = {
    source: "whop_payment_and_fee_records", scope: "latest_25_resonance_visit_payments",
    availability: "available", observedAt: new Date().toISOString(), currency: "USD",
    financialExecution: false, morePaymentsExist: rows.length > 25,
    observedPayments: 0, unavailablePayments: 0,
    providerAmountAfterFeesCents: 0, providerGrossCents: 0,
    confirmedCommissionCents: null, finalRetainedRevenueCents: null,
    reconciliation: "commission_tax_refund_dispute_reconciliation_required",
    feeBreakdownCents: {} as Record<string, number>,
  };
  const diagnostics: Diagnostic[] = [];
  if (!rows.length) return report;
  const catalog = await loadResonanceWhopCatalog();
  // Limit outbound concurrency and omit every customer/payment identifier.
  for (let offset = 0; offset < Math.min(rows.length, 25); offset += 5) {
    const results = await Promise.allSettled(rows.slice(offset, Math.min(offset + 5, 25)).map(async row => {
      const id = row.whop_payment_id!;
      if (!/^pay_[a-zA-Z0-9]+$/.test(id)) throw new Error("Invalid payment identifier.");
      const [rawPayment, rawFees] = await Promise.all([
        readProvider("payment", `payments/${id}`, paymentSchema), readProvider("fees", `payments/${id}/fees?first=100`, feesSchema),
      ]);
      const payment = paymentSchema.parse(rawPayment);
      const fees = feesSchema.parse(rawFees);
      if (payment.id !== id || payment.company.id !== catalog.companyId || payment.currency !== "usd" || payment.total === null || fees.page_info.has_next_page || fees.data.some(fee => fee.currency !== "usd")) {
        throw new ObservationFailure({ stage: "validation", reason: "incomplete_or_mismatched" });
      }
      return { payment, fees };
    }));
    for (const result of results) {
      if (result.status === "rejected") {
        report.unavailablePayments++;
        if (options.includeDiagnostics && diagnostics.length < 5) {
          diagnostics.push(result.reason instanceof ObservationFailure ? result.reason.diagnostic : { stage: "validation", reason: "request_failed" });
        }
        continue;
      }
      report.observedPayments++;
      report.providerAmountAfterFeesCents += Math.round(result.value.payment.amount_after_fees * 100);
      report.providerGrossCents += Math.round(result.value.payment.total! * 100);
      for (const fee of result.value.fees.data) {
        // Provider-defined types only; names/descriptions may contain PII.
        const type = /^[a-z][a-z0-9_]{0,99}$/.test(fee.type) && !["constructor", "prototype", "__proto__"].includes(fee.type) ? fee.type : "unclassified_fee";
        report.feeBreakdownCents[type] = (report.feeBreakdownCents[type] ?? 0) + Math.round(fee.amount * 100);
      }
    }
    if (results.every(result => result.status === "rejected")) {
      report.unavailablePayments += Math.max(0, Math.min(rows.length, 25) - offset - results.length);
      break;
    }
  }
  if (report.unavailablePayments) report.availability = report.observedPayments ? "partial" : "unavailable";
  return {
    ...report,
    // No successful observations is unknown, not zero revenue or zero fees.
    providerAmountAfterFeesCents: report.observedPayments ? report.providerAmountAfterFeesCents : null,
    providerGrossCents: report.observedPayments ? report.providerGrossCents : null,
    feeBreakdownCents: report.observedPayments ? report.feeBreakdownCents : null,
    ...(options.includeDiagnostics ? { diagnostics } : {}),
  };
}
