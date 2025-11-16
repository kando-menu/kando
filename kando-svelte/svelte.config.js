import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			'@kando/common': '../src/common',
			'@kando/schemata': '../src/common/settings-schemata',
			'@kando/menu': '../src/menu-renderer/menu.ts',
			'@kando/menu-theme': '../src/menu-renderer/menu-theme.ts',
			'@kando/gesture': '../src/menu-renderer/input-methods/gesture-detector.ts',
			'@kando/gamepad': '../src/menu-renderer/input-methods/gamepad.ts',
			'@kando/sound-theme': '../src/menu-renderer/sound-theme.ts',
			'@kando/base-css': '../src/menu-renderer/index.scss',
			'$lib': './src/lib'
		}
	}
};

export default config;
