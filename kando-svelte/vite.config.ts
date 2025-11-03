import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Use SvelteKit kit.alias from svelte.config.js; avoid duplicating aliases here
	server: {
		fs: {
			// Allow serving parent repo paths (../node_modules) for dev-only font assets
			allow: ['..']
		}
	}
});
