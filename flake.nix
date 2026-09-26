{
	inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
	inputs.flake-parts.url = "github:hercules-ci/flake-parts";
	inputs.git_hook.url = "github:cachix/git-hooks.nix";
	inputs.git_hook.inputs.nixpkgs.follows = "nixpkgs";

	outputs = inputs @ { nixpkgs, flake-parts, ... }:
	flake-parts.lib.mkFlake {
		inherit inputs;
	} {
		systems = nixpkgs.lib.systems.flakeExposed;

		imports = [
			./nix/dev
		];
	};
}
