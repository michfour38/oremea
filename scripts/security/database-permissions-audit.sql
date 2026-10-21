-- Metadata only. Run through a secure console with the intended application role.
BEGIN READ ONLY;
SELECT rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolreplication
FROM pg_roles WHERE rolname = current_user;

SELECT EXISTS (SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid() AND ssl) AS connection_tls;

SELECT count(*) AS checked_sensitive_tables,
       count(*) FILTER (WHERE c.relrowsecurity) AS rls_enabled,
       count(*) FILTER (WHERE c.relforcerowsecurity) AS rls_forced,
       count(*) FILTER (WHERE pg_has_role(current_user, c.relowner, 'USAGE')) AS owned_or_owner_inherited
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN
  ('recognition_messages','recognition_threads','compass_sessions','harmonize_entries','prompt_completions');

SELECT count(*) AS public_table_grants
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND grantee = 'PUBLIC';

SELECT count(*) AS public_schema_create_grants
FROM pg_namespace n, LATERAL aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
WHERE n.nspname = 'public' AND a.grantee = 0 AND a.privilege_type = 'CREATE';

SELECT count(*) AS executable_security_definer_functions
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef AND has_function_privilege(current_user, p.oid, 'EXECUTE');
COMMIT;
