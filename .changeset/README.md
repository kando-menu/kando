# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs for published packages.

How to add a changeset:

1. Run:
   ```
   pnpm changeset
   ```
2. Select the package(s) that changed (e.g. `@kando/core`) and choose the bump type.
3. Write a brief release note. Commit the created file in `.changeset/`.

On merge to `main`, a “Version Packages” PR will be opened; merging it will publish changed packages to npm and create/update `CHANGELOG.md` files.

