import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';

export default [prettier, ...svelte.configs.prettier];
