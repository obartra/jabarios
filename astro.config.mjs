// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jabarios.com',
  // Trip pages live at /<slug>/, and the old site's links used that shape.
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
});
