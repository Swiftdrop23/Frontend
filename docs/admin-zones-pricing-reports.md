# Admin zones, pricing, and reports

The admin screens use `/api/admin` when `VITE_API_URL=/api`; without an API URL,
they use browser-local demo data. The Vite development server proxies `/api` to
`http://127.0.0.1:8080`.

## Local setup

1. Set the backend datasource in the ignored `Backend/local.properties` file.
   Use verified TLS, `spring.flyway.enabled=false`, and
   `spring.jpa.hibernate.ddl-auto=validate` for normal application runs.
2. Configure a backend-only admin account with `SWIFTDROP_ADMIN_EMAIL` and
   `SWIFTDROP_ADMIN_PASSWORD`, or the equivalent `swiftdrop.admin.*` local
   properties. Never put these values in frontend variables or Git.
3. Copy the frontend `.env.example` to `.env.local` so `VITE_API_URL=/api`.
4. Start the backend from `Backend/` and the frontend from the project root.
5. Sign in with the configured admin email and password.

Admin sessions are random, process-local tokens that expire after eight hours
by default. Admin endpoints reject requests without a valid session. Configure
the same server-side account on the deployed backend; do not use demo/mock
login for database writes.

## Database

Migration V5 creates `delivery_zones` and `delivery_pricing_rules`. It does not
seed the screenshot's sample prices. Zone and rule changes are stored in Neon;
all clients using the same backend/database see those saved changes. The
reports endpoints aggregate parcel records and count `CANCELLED` as failed
because the current parcel status model has no separate `FAILED` value.

The admin tariff table is not yet the delivery quote engine's configuration:
the latter expects approved zone-pair and weight-band rules, while this screen
stores one zone, parcel size, base fee, and fee-per-kg. Agree on the parcel-size
and route mapping before using admin rates to calculate customer quotes.

Pushing these branches shares source code, not a running backend. For teammates
to see the same database data, either each local backend must use the same
approved database, or the team must deploy the backend and point the frontend
at that service. Database secrets must stay on the backend.
