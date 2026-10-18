1. Follow @scratch_test.sh instructions for all test invocation 
2. `npm test` must be passing at 100% in order for work to be considered complete
3. `./rexxt tests/dogfood/*` must be passing at 100% in order work to be considered complete
4. `npm run test:web` must be passing for web or DOM involved work to be considered complete 
5. Prefix playwright test invocations with `PLAYWRIGHT_HTML_OPEN=never`
6. If you are about to code "fallback" or "fall back" logic, quit immediately then tell me your rationale and ask me yes/no
7. It is OK and generally good to ask me to git-stash so we can solve something more fine-grained then ask me to git-stash-pop to get back to something we were working on
8. When pushing a batch of commits, put a code commit last, never a `[skip actions]` docs commit: a skipped head commit skips CI for the whole push, and hid a red build for weeks
