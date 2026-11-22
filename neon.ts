import { defineConfig } from "@neon/config/v1";

/**
 * AEROVÉL Neon infrastructure:
 *  - Lakebase Postgres on the production branch (pooled DATABASE_URL in .env)
 *  - Object Storage bucket for archived e-tickets (AWS_* env vars in .env)
 *
 * `neon deploy` / `neon config apply` reconciles these services and pulls the
 * branch-scoped env vars down locally.
 */
export default defineConfig({
  auth: false,
  buckets: {
    "aerovel-tickets": {}, // private by default; tickets are served via the app
  },
  branch: (branch) => {
    if (branch.isDefault) return {};
    if (!branch.exists) return { ttl: "7d" };
    return {};
  },
});
