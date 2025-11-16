<script lang="ts">
	let { children } = $props();
</script>

<!-- No favicon asset bundled; rely on app.html icon or host app -->

{@render children?.()}
