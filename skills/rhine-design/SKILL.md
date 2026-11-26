---
name: rhine-design
description: Design, implement, review, or integrate React interfaces using Rhine Design components, themes, typography, and motion. Use when the project uses Rhine Design or the user requests its design language. Capture design feedback and submit it when authorized.
metadata:
  version: "0.18.2"
---

# Rhine Design · 莱茵设计

Use the installed version's components and contracts to build consistent interfaces. This is an independently versioned, general design system; retain the host product's identity and data ownership.

**Proactively capture project design specifications, preferences and details during design discussions, user corrections, implementation, validation and task wrap-up, including successful practices and component/style/state gaps. Submit them to `linhay/rhine-design` issues when the current user or project instructions authorize that feedback; honor existing authorization without asking again. Copying or automatically loading this skill does not transfer another project’s authorization. Without authorization, prepare the sanitized report and obtain permission before posting. Follow the [design feedback workflow](#continuous-design-feedback), identifying gaps before implementing around them.**

## Locate the matching source

Package `@linhey/rhine-design` and GitHub repository `linhay/rhine-design` use different account spellings. This skill was checked against the release candidate identifying itself as `0.18.2`. Treat the actual installed artifact as the source of available features, including when two artifacts report the same version.

Find the installed package in the host's dependencies or identify the source checkout being maintained. Verify `package.json` for package identity and subpath exports, then check `components/index.ts` for root exports and the named component's contract and implementation. Read the installed types and source when using a different artifact. If the package is unavailable, use the task's supplied design sources and state which implementation evidence is missing.

Relative Markdown links stay inside this portable skill folder. Package-root paths are written as code, not as links relative to the installed skill. Any online contract fallback identifies a fixed source revision; it does not follow main or replace the installed version's contract.

## Route the task

- Choosing, adding, or classifying a component: start with the seven categories in `components/CATALOG.md` at the package root. It lists root value exports and points to recipes and independent entry points. Use the documented Rhine contract for same-named components and reuse existing components or recipes when they cover the task.
- Screen design, interaction, typography, motion: start with [TASK_MAP.md](references/TASK_MAP.md), then read only the relevant contract.
- A named component or prop: use [API_MAP.md](references/API_MAP.md), then inspect its exported type and implementation.
- First integration, linking, theme or missing styles: read [integration.md](references/integration.md).
- Design decisions, preferences, details and validation findings: apply [continuous design feedback](#continuous-design-feedback), even when no component is missing.

## Design before implementation

1. Identify the task, interruption cost, information lifetime and recovery path using `docs/INTERACTION_PATTERNS.md`. Choose the relevant patterns and compose existing components and tokens first. For a genuine capability gap, use the feedback workflow below.
2. For a shared UI change, update the contract and a usable example in the library's `preview/` showcase. For a host design change, validate the affected states and interaction in the host's preview or implementation as authorized.
3. For library code changes, use `npm run check`. For visual changes, check the affected container widths, 200% zoom, keyboard/focus and reduced motion as applicable. For consumer changes, use that project's checks. For edits to this skill, use the link, version and installation checks in `CONTRIBUTING.md`.

## Continuous design feedback

Capture new specifications, user preferences/corrections, design details, successful compositions and validation findings encountered in the current project task. Do not wait for a defect or require a local preference to become a universal rule before reporting it. Cover layout/density, typography/hierarchy, responsive containers, state presentation, keyboard/focus, preserved visuals/motion and reduced motion when relevant. This is task-driven feedback, not a scheduled monitor or an unsolicited historical audit.

1. **Establish context.** Record the anonymous scenario, design intent, platform and applicable scope. Distinguish explicit user preferences, product constraints, general proposals, verified facts and unverified hypotheses. Inspect relevant contracts/examples and the actual consumed version or fixed artifact; write unknown or N/A where appropriate. Do not infer release availability from main, an issue closure or a showcase. Web and UIKit retain independent contracts and validation.
2. **Check for duplicates.** Before any external request, sanitize search terms and other outbound metadata as well as report content: replace private project/person names, internal URLs, credentials, machine paths and device identifiers with public component names or synthetic descriptions. Search open and closed issues in [linhay/rhine-design](https://github.com/linhay/rhine-design/issues) by topic, component and behavior; read matching issues and relevant decisions. Add only new requirements, evidence or superseding decisions to the matching issue, even if closed. If it already covers the conclusion, retain its URL without another comment. Keep independently actionable topics separate; do not accumulate specific design feedback in the process issue [#100](https://github.com/linhay/rhine-design/issues/100).
3. **Submit in this task when authorized.** Create an issue when no existing one covers the topic; otherwise supplement the existing issue. Current user/project authorization for this feedback does not cover unrelated messages, code commits/pushes, merges, publication or consumer upgrades. Prefer available GitHub tools, otherwise an authenticated CLI; pass multiline bodies through a file. Sanitize the title, body, links, attachment filenames/content and all other outbound fields before sending: use synthetic examples, exclude private product documents/data, internal URLs, credentials, machine paths and device identifiers. Preserve the design meaning while keeping original product artifacts in the host project.
4. **Keep the report actionable.** Name the design topic and intended outcome in the title. Use the short template below, adapting it to the finding; a successful practice or preference does not require an invented bug. Cite safe evidence and superseded decisions. A local preference remains scoped even if accepted; existing components may need only a contract, composition recipe or example, not a new API.
5. **Confirm and continue.** Read back the created/updated issue and retain its confirmed URL in the task's existing records and final response. If authentication, permission or network access blocks submission, save the complete sanitized draft in the task's local records with the failure and pending status; continue independent work. After an ambiguous result, search/read back before retrying; if still uncertain, leave it pending instead of repeatedly posting. Never equate a local note with submitted feedback.
6. **Close the learning loop.** Before finishing, check that each new conclusion is submitted, already covered, or explicitly pending with its draft and missing authorization/failure. In later related tasks or authorized upgrades, read the issue outcome and actual package capability, then add new validation or remaining gaps. Distinguish reported, accepted, implemented, released and consumer-validated. Record reasons/scope and alternatives when a proposal is not adopted as the default. Update local preferences or memory where applicable; do not start background polling or treat feedback authorization as permission to change the library or upgrade a product.

Short issue template:

- **Kind and basis:** specification / preference / detail / successful practice / validation finding / gap; explicit user decision, product constraint, proposal or observed fact.
- **Context and version:** anonymous synthetic scenario, platform, scope, actual consumed version/artifact (unknown or N/A if applicable), and relevant component/contract.
- **Current and desired behavior:** design intent, what to preserve, proposed behavior or effective composition, and why it matters; link superseded decisions when present.
- **Evidence and acceptance:** what was checked, minimal example or sanitized visual evidence, observable acceptance conditions and unverified items. Do not claim implementation or UI validation from a documentation change.
- **Impact and follow-through:** blocking status, safe related links, proposed contract/recipe/showcase/validation destination and known delivery stage.

## Report missing components and styles

For absent components, variants, tokens, layout/typography/theme/motion rules or interaction states, apply the workflow above **before implementing around the gap**. Inspect installed exports, contracts and examples first: an incorrect import, missing theme root or version mismatch is not automatically a missing feature. If source has the capability but the consumed release does not, identify the availability gap.

Include what was checked, why supported composition cannot satisfy the need, expected states and a minimal reproduction. A new shared capability needs public contract and real showcase acceptance criteria. Do not recreate it in the host, hard-code substitute design values or copy private component CSS to bypass the gap. Supported product composition remains valid. Continue authorized library work through contract, showcase and validation; issue submission alone grants no implementation, release or migration authorization.

## Preserve these contracts

- Use public exports, the `.rhine-theme` root and existing tokens. Use the `rhine-` namespace for CSS variables, classes, animation names and motion data attributes; do not introduce host-product prefixes.
- Read the actual component signature before using it. Keep semantic headings separate from visual text variants.
- Host state determines data, selection and operation outcomes. Search and pagination remain host/server responsibilities; busy indicators never imply success.
- For multi-field failures, preserve input and focus `ErrorSummary` only after failed submission. Its links return to fields without changing routing. Read `components/PROVIDED_COMPONENTS.md` for the current limits of `Form` and its controls.
- Monitoring shows units, freshness and stale/unknown states; errors must not rely on color, flashing or transient toasts.
- Keep identity, available actions, results and consequences visible. Use `docs/COMPACT_ACCOUNT_PATTERNS.md` for nested read-only summaries and paired facts. Preserve business text, unknown/error states and distinct meanings when an interface gets dense.
- Use `docs/OBJECT_READING.md` for the centered object-reading composition and focus handoff. Respect the host's presentation preferences. Use an independent split or page when the task requires background interaction. Reading preserves browser context, reading position and permission boundaries.
- Motion explains a change. Respect reduced motion, cancellation and replay; startup decoration never blocks real readiness. Preview-only experiments are not exported components.
- Keep independent release boundaries: do not change unrelated products or publish packages merely because this skill was invoked.
