import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { OREMEA_OPERATOR } from "@/src/lib/legal/legal-links";

const sections: readonly LegalSection[] = [
  {
    title: "1. Scope",
    paragraphs: [
      "This policy applies to once-off purchases, subscriptions and other payments made for Oremea products and services, including Recognition, Resonance, Compass, Mirror and paid WORKS services.",
      "The product, price, currency, billing frequency, access period and material charges are displayed before an order is confirmed. Where a marketplace or third-party seller is the merchant of record, its payment and refund process may also apply.",
    ],
  },
  {
    title: "2. Supplier information",
    paragraphs: [
      `Oremea is operated by ${OREMEA_OPERATOR.name}, a ${OREMEA_OPERATOR.legalForm} trading as ${OREMEA_OPERATOR.tradingName}. Physical and legal-service address: ${OREMEA_OPERATOR.serviceAddress}. Contact: ${OREMEA_OPERATOR.email}, ${OREMEA_OPERATOR.telephone}.`,
    ],
  },
  {
    title: "3. Order review and confirmation",
    paragraphs: [
      "Before placing an order, a customer must be given a reasonable opportunity to review the transaction, correct mistakes and withdraw before final confirmation.",
      "A transaction is complete only when the identified payment provider confirms successful payment. Oremea will provide or make available an electronic record of the purchase and applicable terms.",
    ],
  },
  {
    title: "4. Statutory cooling-off rights",
    paragraphs: [
      "Where section 44 of the Electronic Communications and Transactions Act 25 of 2002 applies to an electronic transaction with a consumer, the consumer may cancel a services agreement without reason and without penalty within seven days after the agreement was concluded, and a qualifying refund must be made within the period required by law.",
      "Section 44 does not apply in circumstances excluded by section 42, including services that began with the consumer's consent before the end of that seven-day period. Oremea relies on an immediate-start request only where the law allows and does not use it to remove another mandatory consumer remedy.",
      "Where a transaction results from direct marketing and the Consumer Protection Act 68 of 2008 applies, the statutory direct-marketing cooling-off right remains available. This policy does not remove a mandatory consumer right or remedy.",
    ],
  },
  {
    title: "5. Immediate digital supply",
    paragraphs: [
      "Many Oremea products begin immediately when access is opened, an AI-supported output is generated, a course is entered, a digital record is created or a WORKS service starts processing a requirement.",
      "Where checkout offers immediate performance, the consumer is asked to request that immediate start expressly. For paid WORKS provider plans, the recurring checkout asks the subscriber to request paid access to begin immediately after verified payment and acknowledges that beginning the service during an applicable cooling-off period may affect that cooling-off right where the law permits.",
    ],
  },
  {
    title: "6. Once-off purchases",
    paragraphs: [
      "A once-off purchase provides the access described at checkout. Subject to mandatory law and the exceptions below, a completed purchase is ordinarily final once the requested digital service has been materially supplied or consumed.",
      "A change of mind, partial participation, dissatisfaction with an interpretive output or the absence of a hoped-for personal or commercial outcome does not by itself establish a refund right after supply has begun.",
    ],
  },
  {
    title: "7. Subscriptions and cancellation",
    paragraphs: [
      "A recurring subscription renews at the displayed frequency until cancelled. Cancellation stops the next renewal and access ordinarily continues until the end of the current paid billing period unless the product terms or law require another result.",
      "For a WORKS monthly provider plan, cancelling from WORKS Billing instructs PayFast to stop future renewals. The paid plan remains available through the paid-through date calculated from the most recent successful monthly payment, then the business returns to Free. A refund, reversal, failed payment or mandatory legal remedy may change that access period.",
      "The available cancellation method is shown before subscription and within WORKS Billing. A customer remains responsible for charges validly incurred before cancellation takes effect. Material changes to a recurring price or billing arrangement will be communicated in advance, allowing cancellation before the change takes effect.",
    ],
  },
  {
    title: "8. Duplicate charges and billing errors",
    paragraphs: [
      "Oremea will investigate duplicate payments, incorrect amounts, charges after an effective cancellation and other billing errors. Confirmed errors will be corrected or refunded through the appropriate payment channel.",
      "Send the purchase email, date, amount, product and transaction reference to support@oremea.com. Do not send complete card details, passwords or one-time codes.",
    ],
  },
  {
    title: "9. Failed or unavailable supply",
    paragraphs: [
      "Where Oremea cannot supply a purchased service within the agreed period, materially fails to provide access, or a persistent technical failure prevents use and cannot be remedied within a reasonable time, the customer may be entitled to repair, replacement access, credit, cancellation or refund under the agreement and applicable law.",
      "A brief outage, maintenance period, device-specific issue or third-party interruption that is resolved within a reasonable time may be remedied by restoring or extending access rather than refunding the full purchase.",
    ],
  },
  {
    title: "10. WORKS services",
    paragraphs: [
      "Fees for a paid WORKS plan or another separately disclosed WORKS service purchase access to the specific platform service described at checkout. They do not purchase a guaranteed customer, provider, quotation, contract, approval, verification result, suitability ranking or commercial outcome.",
      "Where a paid WORKS service was not supplied as described, Oremea will assess the request against the service record, checkout description, mandatory consumer law and this policy.",
    ],
  },
  {
    title: "11. Requesting a cancellation or refund",
    paragraphs: [
      "For an active WORKS subscription, use the cancellation control in WORKS Billing where available. For a refund, billing dispute or other cancellation request, email support@oremea.com with the subject 'Cancellation' or 'Refund request'. Include the account email, product, purchase date, amount, transaction reference, requested remedy and a clear description of the issue.",
      "Requests should be submitted promptly. Oremea may request proportionate information needed to verify the transaction, diagnose an access problem or prevent fraud.",
    ],
  },
  {
    title: "12. Decisions and processing",
    paragraphs: [
      "Oremea will assess requests reasonably and communicate the outcome. Where a refund is approved, it will ordinarily be returned through the original payment method or marketplace process.",
      "Processing times depend on the payment provider and banking system. Statutory refunds will be made within the legally required period; other approved refunds will be initiated within a reasonable period after approval.",
    ],
  },
  {
    title: "13. Chargebacks and disputes",
    paragraphs: [
      "Customers are encouraged to contact Oremea first so access, cancellation or billing issues can be investigated promptly. Oremea may provide the payment provider with transaction, access, acceptance and communication records when responding to a chargeback or payment dispute.",
      "This does not limit a customer's right to approach a payment provider, regulator, ombud, tribunal or court where the law permits it.",
    ],
  },
  {
    title: "14. Changes and contact",
    paragraphs: [
      "Oremea may update this policy when products, payment channels or legal requirements change. The policy applying at the time of purchase remains part of that transaction, subject to mandatory law.",
      `Questions and requests: ${OREMEA_OPERATOR.email}, ${OREMEA_OPERATOR.telephone}. Physical and legal-service address: ${OREMEA_OPERATOR.serviceAddress}.`,
    ],
  },
];

export default function RefundsPage() {
  return (
    <LegalDocument
      activePath="/refunds"
      title="Payments, Subscriptions, Cancellation & Refund Policy"
      summary="What happens before and after payment, how recurring access ends, and how cancellations, failed supply and refund requests are handled."
      updated="24 August 2026"
      sections={sections}
      references={[
        { label: "Electronic Communications and Transactions Act 25 of 2002", href: "https://www.gov.za/documents/electronic-communications-and-transactions-act" },
        { label: "Consumer Protection Act 68 of 2008", href: "https://www.gov.za/sites/default/files/32186_467.pdf" },
      ]}
    />
  );
}
