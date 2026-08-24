import type { Metadata } from "next";

import {
  LegalDocument,
  type LegalSection,
} from "@/components/legal/legal-document";
import { worksUrl } from "@/lib/works/seo";
import { WORKS_RETURN_LINK } from "@/src/lib/legal/legal-links";

export const metadata: Metadata = {
  title: "Customer review policy | WORKS",
  description: "How WORKS links reviews to genuine provider interactions, handles reviewer privacy and moderates provider responses.",
  alternates: { canonical: worksUrl("/reviews-policy") },
};

const sections: readonly LegalSection[] = [
  {
    title: "1. Purpose",
    paragraphs: [
      "WORKS reviews are intended to help customers and providers understand genuine experiences connected to WORKS interactions. This policy governs eligibility, labels, identity choices, moderation, publication and provider responses.",
    ],
  },
  {
    title: "2. Who can leave a review",
    paragraphs: [
      "A review is available only through an eligible WORKS-linked interaction. The current product flow opens review access after a provider gives a substantive response to the relevant WORKS brief.",
      "A provider declining a brief because the work is outside its capability does not, by itself, create review eligibility. WORKS does not treat an honest decision not to take unsuitable work as a negative service event.",
      "WORKS may limit one active review per eligible provider interaction and may require the reviewer to use the account associated with the brief.",
    ],
  },
  {
    title: "3. Verified WORKS brief label",
    paragraphs: [
      "The 'Verified WORKS brief' label means Oremea's records connect the review to a WORKS brief and provider response. It verifies that platform relationship only.",
      "The label does not mean Oremea verified every statement, supervised the work, confirmed purchase or payment, inspected deliverables, or endorses the reviewer or provider.",
    ],
  },
  {
    title: "4. Honest and relevant content",
    items: [
      "Describe the reviewer's own experience and honestly held opinion.",
      "Keep the review relevant to the provider interaction, communication or resulting work.",
      "Distinguish opinion from factual claims and avoid claims the reviewer knows are false.",
      "Do not include unnecessary personal information, confidential specifications, trade secrets, account credentials or private communications.",
    ],
  },
  {
    title: "5. Prohibited review practices",
    items: [
      "Fabricated, duplicate, spam or review-ring content.",
      "Reviews written by a provider about itself or by a person with an undisclosed material conflict.",
      "Threats to post or remove a review in order to obtain money, discounts, unrelated work or another improper advantage.",
      "Harassment, hate speech, unlawful discrimination, impersonation or malicious disclosure of personal information.",
      "Incentivised content without clear disclosure, or incentives conditioned on a particular rating or sentiment.",
      "Content unrelated to an eligible WORKS interaction.",
    ],
  },
  {
    title: "6. Reviewer identity and privacy",
    paragraphs: [
      "A reviewer may choose whether their submitted name and company appear publicly. If public identity is not selected, the review may appear as 'WORKS customer'.",
      "Oremea may retain private account and brief-link information needed to confirm eligibility, operate the review, prevent abuse and handle disputes under the Privacy and POPIA Policy.",
    ],
  },
  {
    title: "7. Moderation and status",
    paragraphs: [
      "A review may be held, restricted, rejected, published, edited by its author, unpublished or removed according to product capability and this policy.",
      "WORKS may use automated signals and human assessment to identify policy risks. Moderation is not a general investigation of the underlying commercial dispute and publication does not mean Oremea adopts the review's statements.",
    ],
  },
  {
    title: "8. Provider responses",
    paragraphs: [
      "A provider may post a public response to a published review. Responses must be professional, relevant and must not reveal customer identity, contact details, confidential information or other personal information that the reviewer did not choose to publish.",
      "Providers may explain, correct or offer a resolution but may not harass the reviewer, make threats or manipulate review participation.",
    ],
  },
  {
    title: "9. Reporting and evidence",
    paragraphs: [
      "A reviewer, provider or affected person may report content to support@oremea.com and identify the review, disputed material and reason. WORKS may request limited supporting information where needed.",
      "Submitting a report does not guarantee removal. WORKS considers the review's relevance, the stated experience, available records, privacy, legal duties, public-interest context and the rights of the people involved.",
    ],
  },
  {
    title: "10. Corrections, removal and retention",
    paragraphs: [
      "WORKS may remove private information, correct an obvious platform or attribution error, ask the author to revise content, restrict visibility or remove the full review where a proportionate correction is not possible.",
      "A removed review and related evidence may be retained for a limited period where reasonably necessary for fraud prevention, legal compliance, safety, complaint handling or dispute records.",
    ],
  },
  {
    title: "11. No paid preference",
    paragraphs: [
      "Providers cannot buy a favourable review, higher rating, removal of honest critical feedback or exemption from this policy. A provider's plan does not determine review sentiment or moderation outcome.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Review questions, reports and reconsideration requests may be sent to support@oremea.com.",
    ],
  },
];

export default function WorksReviewsPolicyPage() {
  return (
    <LegalDocument
      activePath="/works/reviews-policy"
      title="WORKS Reviews Policy"
      summary="How genuine brief-linked reviews, reviewer privacy, provider responses and moderation work on WORKS."
      updated="24 August 2026"
      sections={sections}
      returnLink={WORKS_RETURN_LINK}
    />
  );
}
