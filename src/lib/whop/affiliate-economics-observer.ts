import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { loadResonanceWhopCatalog } from "./resonance-catalog";
import { whopApiRequest } from "./whop-api";

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
export async function observeWhopVisitEconomics() {
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
  if (!rows.length) return report;
  const catalog = await loadResonanceWhopCatalog();
  // Limit outbound concurrency and omit every customer/payment identifier.
  for (let offset = 0; offset < Math.min(rows.length, 25); offset += 5) {
    const results = await Promise.allSettled(rows.slice(offset, Math.min(offset + 5, 25)).map(async row => {
      const id = row.whop_payment_id!;
      if (!/^pay_[a-zA-Z0-9]+$/.test(id)) throw new Error("Invalid payment identifier.");
      const [rawPayment, rawFees] = await Promise.all([
        whopApiRequest(`payments/${id}`), whopApiRequest(`payments/${id}/fees?first=100`),
      ]);
      const payment = paymentSchema.parse(rawPayment);
      const fees = feesSchema.parse(rawFees);
      if (payment.id !== id || payment.company.id !== catalog.companyId || payment.currency !== "usd" || payment.total === null || fees.page_info.has_next_page || fees.data.some(fee => fee.currency !== "usd")) {
        throw new Error("Incomplete or mismatched provider economics.");
      }
      return { payment, fees };
    }));
    for (const result of results) {
      if (result.status === "rejected") { report.unavailablePayments++; continue; }
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
  return report;
}
