import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@kando/common': r('../src/common'),
			'@kando/schemata': r('../src/common/settings-schemata'),
			'@kando/gesture': r('../src/menu-renderer/input-methods/gesture-detector.ts'),
			'@kando/gamepad': r('../src/menu-renderer/input-methods/gamepad.ts'),
			'@kando/sound-theme': r('../src/menu-renderer/sound-theme.ts')
		}
	}
});
