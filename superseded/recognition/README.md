# Recognition — superseded boundary

Recognition's current live entrance is `https://recognition.oremea.com/begin`.

The current route chain must be verified before every change:

1. `middleware.ts`: `/begin` on the Recognition host rewrites to `/recognition`.
2. `app/recognition/page.tsx`: server page, access check, saved-message hydration.
3. `app/recognition/recognition-chat.tsx`: active conversation UI and composer.
4. `app/api/recognition/conversation/route.ts`: active conversation persistence and reply API.

## Known superseded composer behaviour

The older composer generation that used language such as `Enter to send`, `Shift + Enter for a new line`, and a primary `Send` action is superseded. It must not exist on the active Recognition surface.

The immediately previous tracked Recognition composer is preserved by Git history at commit `bd91220b81ebcf12e2493561f9fe5fa7a9688682`. The durable-refresh implementation was merged at `8c887e5841c07fa44dbd4a1a7088044df7fe635c`.

Do not create executable `.tsx`, `.ts`, `.js`, or CSS copies in this directory. Historical source belongs in Git history; this directory records which generation is obsolete and why.

## Current UX contract

- Plain Enter inserts a line break.
- Cmd/Ctrl+Enter may explicitly submit.
- Primary action is `Reflect`, not `Send`.
- The composer auto-expands within its height limit.
- Submitted participant words are saved before model generation.
- Refresh must restore saved conversation state and protect an unsent/in-flight draft.
- While Recognition is responding, animated dots appear in one human-facing location only.
