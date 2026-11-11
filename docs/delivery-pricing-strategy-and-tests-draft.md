# Delivery Request & Fee: pricing strategy and test-case draft

**Status: proposal for discussion, not team agreement or an implemented contract.**
All rules, interfaces, error names, rates, and numeric examples below are
unconfirmed proposals or explicitly isolated test fixtures. No production prices
are defined here. Per current team context, the target is Spring Boot with
**Java 21**, Member 8 owns zone/pricing configuration, and the shared backend
repository is empty. The earlier [API-contract draft](customer-delivery-request-api-contract-draft.md)
also references Java 21, consistent with the current team context.
The design report's zone/weight Strategy pattern is the starting proposal here,
not evidence of an agreed algorithm or deployed pricing service.

## Existing frontend constraints

- `/customer/create-delivery` collects free-text pickup/drop-off addresses,
  positive weight in kg, positive dimensions in cm, and recipient details. It
  supports local review/editing; fee estimation and submission remain unavailable.
- `/get-a-quote` collects pickup/drop-off cities and positive weight in kg.
  City validation checks for nonblank text containing letters, not serviceability.
  Valid submission reports unavailable pricing without calling an API.
- Neither screen establishes zone membership, maximum weight, supported precision,
  rates, or currency. Dimensions are absent from the public form; whether they
  affect price or eligibility remains unresolved. This draft changes neither UI.

## 1. Proposed location resolution and rule selection

1. Validate and normalize location input without discarding address information.
   Load one consistent, active zone/pricing revision and use it throughout the
   calculation, including Member 8's authoritative location-to-zone mapping.
   Options to agree:
   canonical city/postal-area IDs, or coordinates matched against zone boundaries.
   Free-text aliases may resolve to canonical IDs, but ambiguous names should
   request clarification rather than silently selecting a zone. Resolve pickup
   and drop-off independently; distinguish unresolved input from known locations
   outside coverage.
2. Resolve a route key such as `(pickupZoneId, dropoffZoneId)`. **Proposal:** treat
   direction as significant unless configuration explicitly defines symmetry.
   Same-zone routes also need an explicit rule; they are not inherently free.
3. From that same revision, match a configured rule for the route and weight range at the
   quote time. Require exactly one match: a gap, overlap, expired rule, or unknown
   strategy key must not produce an arbitrary/default price. Validate these
   conditions when publishing configuration and guard them at runtime too.
4. Select a registered Strategy by the matched rule's strategy key. The rule
   supplies approved parameters, not hardcoded city names or production rates.
   Return the amount/currency with the selected zone IDs, rule ID, configuration
   revision, normalized inputs, and proposed expiry for an auditable quote.

**Public versus customer quotes:** city-only input could produce an indicative
estimate if Member 8 confirms cities resolve sufficiently. Do not assume it is
binding for a full-address delivery. Re-resolve and quote the complete delivery
inputs before confirmation. Public endpoint/access policy is separate from the
authenticated quote endpoint proposed in the earlier API draft.

## 2. Proposed Strategy boundary and pricing service

Illustrative Java 21 signatures only; these types are not implemented:

```java
public interface PricingStrategy {
    String key();
    Money calculate(PricingInput input, PricingRule rule);
}
// Proposed value types, shown only to explain the boundary:
// Money: BigDecimal amount, Currency currency
// PricingInput: resolved pickup/drop-off zone IDs, BigDecimal billableWeightKg
// PricingRule: immutable validated parameters and rule/configuration identifiers
```

The Strategy performs deterministic arithmetic for one selected rule, such as a
configured weight-band or base-plus-weight formula. Those algorithms are options,
not agreed business rules. It does not resolve addresses, query repositories,
read the clock, create orders, or choose fallback rates.

The pricing application service validates requests, resolves zones, loads a
consistent configuration snapshot, determines billable weight, selects the
rule/Strategy, applies the agreed money policy, validates the result, and returns
a quote or a typed failure. Keep currency/rounding policy explicit and shared
across strategies. A quote service may persist quote snapshots; an order service
checks quote validity and customer acceptance before creating a delivery.
These can be ordinary components/modules in one Spring Boot application;
separate microservices are not assumed.

## 3. Proposed failures and money policy

| Condition | Proposed behavior |
| --- | --- |
| Missing, malformed, zero, or negative weight | Field validation error; no Strategy call. Reject non-finite textual values during decimal parsing and enforce agreed magnitude/precision limits. |
| Unknown/ambiguous location | Location clarification error; do not guess a zone. |
| Known location or route outside coverage | Unsupported-service response; do not label a configuration outage as unsupported coverage. |
| Supported route with no matching rule, overlapping matches, or unknown Strategy | Pricing-configuration failure; report estimate unavailable and record internal diagnostics. Never return a zero/free/default fee. |
| Configuration store unavailable or no usable active revision | Pricing unavailable/retry response; no invented estimate. Using cached configuration requires an explicitly agreed freshness/version policy. |

Error names and HTTP mappings remain proposals; align with the earlier draft's
validation, service-area, and pricing-unavailable cases before integration.

**Proposed money policy:** use `BigDecimal` for Java amounts, rates, and decimal
weights; construct from decimal strings, not binary `double` values. Carry a
currency with every amount. Agree supported currency, storage precision/scale,
intermediate precision, tax/surcharge order, and the final rounding mode/point.
Division needs an explicit precision/rounding policy. Avoid rounding at each
intermediate step unless the chosen rule requires it. Distinguish billable-weight
rounding from money rounding; do not round weight into another band implicitly.
Reject unrepresentable amounts and invalid configured parameters; whether a
zero fee is permitted needs explicit policy rather than fallback behavior.

Propose decimal strings at the JSON boundary. Numeric comparison of
`BigDecimal` values should use `compareTo`; `equals` also compares scale. Test
serialized scale separately once agreed. Currency minor units and rounding
must be configured/validated, not assumed to be the same for every currency.

## 4. Proposed tests (not implemented)

**Synthetic unit-test fixtures only:** zones `A` and `B`; weight precision
`0.001 kg`; bands `(0, 1]` and `(1, 5] kg`; fixture maximum `5 kg`.
Fixture flat band amounts for `A -> A`: `10.00`, `15.00`; for `A -> B`:
`20.00`, `25.00`. Fixture currency `USD`, scale `2`, rounding `HALF_UP`.
These values, bands, limits, and currency are arbitrary test data, not proposed
production prices or an assertion that USD will be used.

| Test scope/scenario | Expected outcome under the fixtures/proposal |
| --- | --- |
| Strategy boundaries: `0.001`, `0.999`, `1.000`, `1.001`, `5.000 kg` on `A -> A` | Respectively `10.00`, `10.00`, `10.00`, `15.00`, `15.00` fixture amounts; exact boundaries match one band. |
| Maximum/precision: `5.001 kg`, excess decimal places, extreme magnitude | Reject against explicit fixture limits; no silent truncation or clamping. |
| Same weight on `A -> A` versus `A -> B` | Select different configured rules and return the respective fixture band amounts. |
| `B -> A` missing while `A -> B` exists | Do not reuse the reverse rule unless symmetry is explicitly configured. |
| Missing/null/blank, malformed text, `NaN`, infinity, zero, negative weight | Validation failure before calculation; test parsing separately from the BigDecimal domain API. |
| Whitespace/aliases, non-Latin names, ambiguous names, unknown/outside-zone locations | Canonical resolution or the appropriate typed failure; no guessed city/zone. |
| Missing rule, gap, overlap, inactive rule, unsupported Strategy key | Configuration failure, no amount; do not pick the first match or fallback to another zone. |
| Configuration timeout/missing revision; concurrent revision change | Unavailable result, or one complete valid snapshot; never mix revisions. |
| Determinism and decimal equality | Same inputs/rule revision give the same result; `1.0` and `1.000 kg` select the same band. |
| Money-policy fixture: raw `10.005` at fixture scale `2`, `HALF_UP` | `10.01`; test alternative modes independently if supported. Verify currency and serialized scale. |
| Bad configured rate/currency; arithmetic overflow/storage limits | Reject configuration or return a controlled failure; no malformed quote. |

Keep pure Strategy tests independent of Spring. Unit-test the pricing service
using fake zone/configuration providers and an injected clock. Add separate
quote/order service tests for expiry, ownership, changed revisions and fees,
and no order creation on a rejected quote. Frontend tests should cover edit
invalidation, stale responses, unavailable states, and explicit reacceptance.

## 5. Proposed estimate invalidation and confirmation

- Editing pickup/drop-off city or address, weight, or dimensions clears any
  earlier estimate/acceptance and disables confirmation until a fresh quote is
  displayed and accepted. Conservatively invalidate on dimension edits until
  their pricing role is settled. Ignore responses for older input/request
  versions. Recipient-only edits may retain pricing if recipients do not affect it.
- Store the canonical inputs, zones, rule/configuration revision, amount/currency,
  and expiry in an immutable server quote snapshot. Do not trust client-supplied
  zone IDs or amounts as pricing authority. Agree whether public estimates are
  persisted or must be replaced by customer-owned quotes after login.
- At order confirmation, check ownership, expiry and validity against the current
  configuration. **Proposed revalidation policy:** stale pricing returns a
  conflict with no order creation. Obtain a replacement quote, show the old and
  new server-provided fees/currency with an explanation, and require explicit
  acceptance even if the fee decreased. Never silently replace the accepted fee.
  Changed revisions may require reacceptance even when the amount is unchanged.
- Make quote validation and order creation consistent under concurrent updates.
  Whether a quote instead locks a price until expiry is a team decision. Until
  integrated, preserve the current unavailable fee/submission UI.

## 6. Decisions to coordinate

**With Member 8:** authoritative zones and aliases/boundaries; ambiguous-address
handling; directional versus symmetric routes; same-zone coverage; rule schema
and Strategy keys; band inclusivity, gaps/overlaps, maximum/precision and billable
weight; dimensional pricing; approved rates/currency, taxes, rounding; effective
dates, configuration publication, versioning and outage/cache policy.

**With backend/auth/product owners:** confirm Java 21/Spring Boot setup;
module ownership and shared value/error types;
public estimate versus authenticated quote contracts; location identifiers and
validation limits; decimal serialization/storage; expiry and locked versus
revalidated prices; public-to-customer quote transition; changed-fee acceptance,
transaction boundaries, and test-fixture ownership. The empty backend repository
provides no existing implementation or agreed endpoint to depend on.
