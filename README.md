# React + Vite

## Public delivery quotes

Open `/get-a-quote` without signing in, or follow **Get a Quote** from login.
The screen collects pickup city, drop-off city, and packed parcel weight in kg.
It validates nonblank city names containing letters and finite, positive weight,
including decimal weights. Errors are associated with their fields and submitting
invalid details focuses the first error.

Fee estimates are explicitly unavailable. Valid submissions announce that no fee
was calculated or delivery placed; they make no network requests. Visitors can
follow **Log in to place a delivery** to the existing login screen. The customer
delivery form still supports local review only; submission remains unavailable.

Integration requires an agreed **public** quote endpoint, city/service-area
resolution, parcel limits, request/response and error schemas, and fee currency.
Then replace the unavailable state with real request/loading/error handling and
server-provided estimates, clearing estimates on edits and ignoring stale
responses. The authenticated quote proposal in
`docs/customer-delivery-request-api-contract-draft.md` is not a public API contract.
Authentication and customer delivery submission require their existing separate
integration work.

## Frontend tests

Run `npm test` for a single run, or `npm run test:watch` while editing.
The tests use Vitest, React Testing Library, user-event, and jsdom to exercise
the delivery form's validation, keyboard review flow, retained edits, and
unavailable fee/submission states. Public quote tests cover validation, keyboard
submission, unavailable messaging without a network call, editing, and login
navigation. Route regressions cover public access, customer protection, and each
role's dashboard redirect. No backend is required.

Run `npm run lint` and `npm run build` for the other project checks.
These DOM tests do not replace browser checks for responsive layout.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
