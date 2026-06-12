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
      name: 'no-circular',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
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
};
