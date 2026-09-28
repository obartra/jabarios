/**
 * Lighthouse CI, run against the built dist/ on every PR. Mobile settings,
 * one run per page: accessibility, best practices and SEO are deterministic
 * enough to hold at a hard floor; performance is noisier between runs, so its
 * floor sits a margin below today's scores and should be raised as the images
 * get lighter.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // Every page, not just the first five it finds.
      maxAutodiscoverUrls: 0,
      numberOfRuns: 1,
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            'categories:performance': ['error', { minScore: 0.8 }],
          },
        },
        {
          // The date night page and the 404 are noindex on purpose, which
          // Lighthouse scores as an SEO failure.
          matchingUrlPattern: '^(?!.*(date-night|404)).*$',
          assertions: {
            'categories:seo': ['error', { minScore: 0.95 }],
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-report' },
  },
};
