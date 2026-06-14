/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-dal-to-ui',
      comment: 'DAL must not import from components or app (dependency direction rule)',
      severity: 'error',
      from: { path: '^src/dal' },
      to: { path: '^src/(components|app)' },
    },
    {
      name: 'no-domain-to-ui',
      comment: 'Domain must not import from components or app',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(components|app)' },
    },
    {
      name: 'no-domain-to-dal',
      comment: 'Domain defines interfaces; DAL implements them — domain must not depend on dal',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/dal' },
    },
    {
      name: 'no-ui-to-dal',
      comment: 'UI components must not directly query the DAL',
      severity: 'error',
      from: { path: '^src/components' },
      to: { path: '^src/dal' },
    },
    {
      name: 'no-ui-to-services',
      comment: 'UI components must not directly call services (email, rate-limit, etc.)',
      severity: 'error',
      from: { path: '^src/components' },
      to: { path: '^src/services' },
    },
    {
      name: 'no-lib-to-domain',
      comment: 'lib/config must not depend on domain or higher layers',
      severity: 'error',
      from: { path: '^src/lib' },
      to: { path: '^src/(domain|dal|services|components|app)' },
    },
    {
      name: 'no-domain-to-react',
      comment:
        'Domain is pure business logic — it must not import React or React DOM (CLAUDE.md, dependency-direction.md)',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: 'node_modules/(react|react-dom)/', dependencyTypes: ['npm'] },
    },
    {
      name: 'no-ui-to-supabase',
      comment:
        'UI components must not query Supabase directly — go through the DAL (ARCHITECTURE.md "No UI querying Supabase directly")',
      severity: 'error',
      from: { path: '^src/components' },
      to: {
        path: ['^src/lib/supabase', 'node_modules/@supabase/'],
        dependencyTypes: ['local', 'npm'],
      },
    },
    {
      name: 'no-client-to-service-role',
      comment:
        'The service-role helper bypasses RLS and is server-only; UI components must never import it (security merge blocker)',
      severity: 'error',
      from: { path: '^src/components' },
      to: { path: '^src/lib/supabase/service-role' },
    },
    {
      name: 'no-client-to-server-env',
      comment:
        'UI components must not import the server-only env accessor (src/lib/config/env.ts) — it is guarded by `server-only` and exposes server secrets. Client code must read public values via src/lib/config/env.public instead (AURA-005 secrets boundary). Scoped to env.ts exactly so env.public.ts stays allowed.',
      severity: 'error',
      from: { path: '^src/components' },
      to: { path: '^src/lib/config/env\\.ts$' },
    },
    {
      name: 'no-circular',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  required: [
    {
      name: 'api-route-requires-validation',
      comment:
        'Every API route handler must import validation explicitly — Zod or the shared src/lib/validation schemas — before any business logic (QUALITY_GATES architecture blocker). Statically enforced as an import requirement; the presence of validation logic in the handler body is verified in code review.',
      severity: 'error',
      module: { path: '^src/app/api/.+/route\\.tsx?$' },
      to: { path: ['^src/lib/validation', 'node_modules/zod/'] },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    // Resolve the `@/*` -> `./src/*` path alias so boundary rules see aliased imports,
    // which are the project's standard import style (dependency-direction.md examples use `@/...`).
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    moduleSystems: ['es6', 'cjs'],
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
    },
  },
}
