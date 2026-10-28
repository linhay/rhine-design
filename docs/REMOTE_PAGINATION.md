# Remote choice pagination

Issue: https://github.com/linhay/rhine-design/issues/71

Combobox and RemoteMultiSelect accept `hasMore`, `onLoadMore`, `loadingMore`, `loadMoreError`, and `onRetry`. The caller owns server search, cursor, cancellation and stale-response rejection. Use `loading`/`error` for the first page and separate incremental states for later pages so existing choices remain usable.

Load more and retry live inside the popup, outside the ARIA listbox. Closing the popup hides both actions. Pending actions keep keyboard focus and cannot dispatch again. Tab visits pagination then completion; Shift+Tab returns to the input. Escape closes only the popup. The last page removes pagination and restores keyboard focus to the input.

## Host contract

Set incremental busy synchronously when dispatching, guard repeated dispatch in the host, and retain the cursor after a failed page. A new query cancels the previous request and advances a generation; ignore late responses even if transport abort is ignored. Deduplicate by stable choice key before appending. The component renders supplied pages only; it never fetches or filters a directory. Unmount/disable cleanup belongs to the host. Activation (`activeValue/onActivateValue`) only selects a detail target; selected values, independent drafts and fallback after removal remain controlled by the host.

## Interactive example and checks

The built gallery `#compact-filters` mounts `RemoteSelectionGallery`; `?fixture=remote-selection&theme=rhine&zoom=2` is its direct fixture. It provides 12 synthetic choices in pages of five, first-page failure, per-cursor failure/retry, slow cancellation, an abort-ignoring late response, disabled/read-only and independent object drafts. It also mounts the same example inside a Dialog. This is a local synthetic transport, not a production service.

Use `scripts/check-remote-selection.js` and `scripts/check-remote-selection-states.js` through the existing Playwright runner against the built gallery. They cover three themes, 400/520/880 widths, 100%/200% CSS zoom, Enter/Space tag activation, folding/removal, two-way Tab, nested Escape/return focus, first/incremental failures, last-page focus and stale responses. Browser native zoom and other engines require separate evidence.

## Source acceptance — 2026-10-28

- PASS: Node 24 full check (355 tests, types, production build, review builds and package check); final candidate rerun passed before commit.
- PASS: Chromium, three themes × three widths × two CSS zoom levels (18 combinations); normal/system and explicit reduced motion. Separate slow/stale tests use system-reduced motion.
- PASS: initial failure, page failure retaining five choices, retry same cursor, 5→10→12 terminal pagination, closed pending responses, unmount cleanup and per-object drafts.
- FAIL, corrected: the first nested keyboard run lost focus to body after Escape from the completion action. Radix handles Escape at the dismissable layer before the content's bubble handler; explicit `onEscapeKeyDown` and restoration after scope teardown fix this. Final matrix passed. Initial test harness also counted native select options and used unsupported Testing Library `exact`; these test errors were corrected, not treated as product failures.
- PASS: existing `check-multiselect-completion.js` 18-combination regression. Its first run exposed old-close restoration racing with an immediate new query; an open-revision guard prevents a stale teardown callback from closing the fresh popup. Both existing and new matrices passed again after the correction.
- Review correction: the Tab fallback inside `onCloseAutoFocus` must consume its restoration flag immediately. Otherwise the next outside close can steal focus. The 18-combination matrix now checks Tab exit → reopen → click another field, including focus after teardown; full checks and the extended matrix passed.
- SKIPPED: native browser zoom, WebKit/Firefox and screen-reader speech in this change; CSS zoom/DOM semantics do not prove them.
- N/A: animation playback/pause (these controls introduce no animation loop); npm release and consumer deployment are outside this source change. Published 0.11.2 remains unchanged; these APIs are available from 0.11.3. Release verification is recorded separately in [0.11.3](releases/0.11.3.md).
