import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://www.domaine-desmontarels.com',
  output: 'server',        // hybrid: static pages + serverless API route
  adapter: vercel(),       // deploy /api/inquire as a Vercel function
});
