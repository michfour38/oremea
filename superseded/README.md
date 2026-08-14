# Superseded work

This directory is the explicit non-runtime home for product work that has been replaced but is still useful as a historical reference.

## Rules

- Nothing under `superseded/` may be imported by runtime application code, API routes, middleware, build configuration, or active contract tests as an implementation dependency.
- Active work must be traced from the current route on `main` before it is edited. A familiar filename from an earlier iteration is not sufficient evidence that it is live.
- When an implementation is replaced and a human-readable snapshot is worth retaining, store it here as Markdown or text, with the source commit and the reason it was superseded.
- Git history remains the authoritative byte-for-byte archive. This directory is a visible boundary so obsolete implementations cannot be mistaken for current ones.
- Superseded code must never be copied back into an active surface without being deliberately reviewed against the current product contract.

Product-specific notes live in subdirectories such as `superseded/recognition/`.
