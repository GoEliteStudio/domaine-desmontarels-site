import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://www.domaine-desmontarels.com',
  output: 'server', // hybrid: static pages + serverless API route
  adapter: vercel({
    runtime: 'nodejs20.x'
  }), // deploy /api/inquire with pinned Node 20 runtime
});
