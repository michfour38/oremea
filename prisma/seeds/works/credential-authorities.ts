import {
  PrismaClient,
  WorksCredentialAuthorityType,
  WorksVerificationMethod,
} from "@prisma/client";

const prisma = new PrismaClient();

const authorities = [
  {
    key: "SAQA",
    name: "South African Qualifications Authority",
    shortName: "SAQA",
    authorityType: WorksCredentialAuthorityType.QUALIFICATION_AUTHORITY,
    website: "https://saqa.org.za/",
    verificationUrl: "https://saqa.org.za/verification-services/private-sector-clients/",
    verificationMethod: WorksVerificationMethod.QUALIFICATION_AUTHORITY,
    requiresHolderConsent: true,
  },
  {
    key: "SACNASP",
    name: "South African Council for Natural Scientific Professions",
    shortName: "SACNASP",
    authorityType: WorksCredentialAuthorityType.PROFESSIONAL_REGULATOR,
    website: "https://www.sacnasp.org.za/",
    verificationUrl: "https://www.sacnasp.org.za/scientists",
    verificationMethod: WorksVerificationMethod.PUBLIC_REGISTER,
    requiresHolderConsent: false,
  },
  {
    key: "ECSA",
    name: "Engineering Council of South Africa",
    shortName: "ECSA",
    authorityType: WorksCredentialAuthorityType.PROFESSIONAL_REGULATOR,
    website: "https://www.ecsa.co.za/",
    verificationUrl: "https://www.ecsa.co.za/ecsa-registration/",
    verificationMethod: WorksVerificationMethod.SOURCE_REVIEW,
    requiresHolderConsent: false,
  },
  {
    key: "HPCSA",
    name: "Health Professions Council of South Africa",
    shortName: "HPCSA",
    authorityType: WorksCredentialAuthorityType.PROFESSIONAL_REGULATOR,
    website: "https://www.hpcsa.co.za/",
    verificationUrl: "https://practitioners.hpcsa.co.za/",
    verificationMethod: WorksVerificationMethod.PUBLIC_REGISTER,
    requiresHolderConsent: false,
  },
  {
    key: "SANAS",
    name: "South African National Accreditation System",
    shortName: "SANAS",
    authorityType: WorksCredentialAuthorityType.ACCREDITATION_BODY,
    website: "https://www.sanas.co.za/",
    verificationUrl: "https://www.sanas.co.za/pages/index.aspx?page=Accredited-Facilities",
    verificationMethod: WorksVerificationMethod.PUBLIC_REGISTER,
    requiresHolderConsent: false,
  },
] as const;

export async function seedWorksCredentialAuthorities() {
  const southAfrica = await prisma.works_markets.findUniqueOrThrow({
    where: { code: "ZA" },
    select: { id: true },
  });

  for (const definition of authorities) {
    const authority = await prisma.works_credential_authorities.upsert({
      where: { key: definition.key },
      update: {
        name: definition.name,
        short_name: definition.shortName,
        authority_type: definition.authorityType,
        website: definition.website,
        verification_url: definition.verificationUrl,
        verification_method: definition.verificationMethod,
        requires_holder_consent: definition.requiresHolderConsent,
        active: true,
      },
      create: {
        key: definition.key,
        name: definition.name,
        short_name: definition.shortName,
        authority_type: definition.authorityType,
        website: definition.website,
        verification_url: definition.verificationUrl,
        verification_method: definition.verificationMethod,
        requires_holder_consent: definition.requiresHolderConsent,
        active: true,
      },
      select: { id: true },
    });

    await prisma.works_credential_authority_markets.upsert({
      where: {
        authority_id_market_id: {
          authority_id: authority.id,
          market_id: southAfrica.id,
        },
      },
      update: { active: true },
      create: {
        authority_id: authority.id,
        market_id: southAfrica.id,
        active: true,
      },
    });
  }
}
