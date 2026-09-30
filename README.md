# Daniella-and-Anthony
Phishing Awareness System 

## PhishAware application

Employee Phishing Awareness and Simulation Platform for Daniella and Anthony.

### Run locally

Requires Node.js 22.13 or later and pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. Run `pnpm typecheck` and `pnpm build` for validation.

### Current stage

A working local application with administrator and employee previews, employee enrollment, phishing campaign templates, campaign launch into the training inbox, lessons and quizzes, awareness reports, CSV exports, in-app notifications and activity logs.

The application starts with clearly marked sample data and saves local review data in browser storage. Preview roles are demonstration controls, not authentication. No external email is sent.

### Remaining connections

Supabase will provide shared records and secure authentication. Hosting, Supabase project connection and external mail delivery remain pending. Production authorization will be enforced by Supabase policies and trusted server operations.

See [project documentation](docs/PROJECT.md) for workflows and validation.
