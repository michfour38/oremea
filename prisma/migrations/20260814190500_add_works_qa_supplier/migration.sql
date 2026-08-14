-- Dedicated non-real provider record for end-to-end supplier claim QA.
-- It is intentionally obvious in the UI so no genuine business is used for testing.
WITH upserted_provider AS (
  INSERT INTO "works_providers" (
    "name",
    "slug",
    "legal_name",
    "website",
    "email",
    "phone",
    "description",
    "profile_status",
    "founding_provider",
    "last_profile_reviewed_at",
    "updated_at"
  )
  VALUES (
    'WORKS QA Supplier — Test only',
    'works-qa-supplier',
    'WORKS QA Supplier — Test only',
    NULL,
    NULL,
    NULL,
    'Internal Oremea QA listing used to test the supplier claim, provider workspace, inbox, review, insight and billing journeys without claiming a real business.',
    'RESEARCHED',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "legal_name" = EXCLUDED."legal_name",
    "website" = NULL,
    "email" = NULL,
    "phone" = NULL,
    "description" = EXCLUDED."description",
    "profile_status" = CASE
      WHEN "works_providers"."profile_status" = 'ARCHIVED' THEN 'RESEARCHED'::"WorksProviderProfileStatus"
      ELSE "works_providers"."profile_status"
    END,
    "updated_at" = CURRENT_TIMESTAMP
  RETURNING "id"
),
qa_provider AS (
  SELECT "id" FROM upserted_provider
  UNION ALL
  SELECT "id" FROM "works_providers" WHERE "slug" = 'works-qa-supplier'
  LIMIT 1
),
za_market AS (
  SELECT "id" FROM "works_markets" WHERE "code" = 'ZA' LIMIT 1
)
INSERT INTO "works_provider_markets" (
  "provider_id",
  "market_id",
  "administrative_area",
  "locality",
  "serves_nationally",
  "accepts_remote_clients",
  "exports",
  "export_regions",
  "active",
  "updated_at"
)
SELECT
  qa_provider."id",
  za_market."id",
  'Gauteng',
  'Johannesburg',
  true,
  true,
  false,
  ARRAY[]::TEXT[],
  true,
  CURRENT_TIMESTAMP
FROM qa_provider, za_market
ON CONFLICT ("provider_id", "market_id") DO UPDATE SET
  "administrative_area" = EXCLUDED."administrative_area",
  "locality" = EXCLUDED."locality",
  "serves_nationally" = EXCLUDED."serves_nationally",
  "accepts_remote_clients" = EXCLUDED."accepts_remote_clients",
  "active" = true,
  "updated_at" = CURRENT_TIMESTAMP;
