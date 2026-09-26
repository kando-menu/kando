{ inputs, ... }: {
	imports = [
		inputs.git_hook.flakeModule
	];

	# once loaded into the devshell for the first time, set up the project
	# pnpm approve-builds
	# pnpm install
	# npm i --save-dev

	perSystem = { config, pkgs, ... }: {
		devShells.default = pkgs.mkShell {
			inputsFrom = [
				config.pre-commit.devShell
			];

			nativeBuildInputs = [
				pkgs.bash-language-server
				pkgs.nixd
				pkgs.nixpkgs-fmt
				pkgs.git
				pkgs.git-lfs
				pkgs.cocogitto
				pkgs.pre-commit
				pkgs.nodejs
				pkgs.pnpm
				pkgs.pkg-config
				pkgs.glib
				pkgs.gcc
				pkgs.gnumake
				pkgs.ninja
				pkgs.libdrm
				pkgs.libxkbcommon
				pkgs.cmake

				# wayland
				pkgs.wayland
				pkgs.wayland-protocols
				pkgs.wayland-scanner
			];

			shellHook = ''
				${pkgs.git-lfs}/bin/git-lfs install --local --skip-repo --quiet > /dev/null 2>&1

				${config.pre-commit.installationScript} > /dev/null 2>&1

				export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
          pkgs.glib
          pkgs.nspr
          pkgs.nss
          pkgs.mesa
          pkgs.expat
          pkgs.libgbm
          pkgs.libx11
          pkgs.libXcomposite
          pkgs.libXdamage
          pkgs.libXext
          pkgs.libXtst
          pkgs.libxcb
          pkgs.libXfixes
          pkgs.libXrandr
          pkgs.libxkbcommon
          pkgs.libdrm
          pkgs.dbus
          pkgs.mesa
          pkgs.alsa-lib
          pkgs.cups
          pkgs.atk
          pkgs.at-spi2-atk
          pkgs.at-spi2-core
          pkgs.pango
          pkgs.cairo
          pkgs.gtk3
        ]}"
			'';
		};

		pre-commit.check.enable = true;

		pre-commit.settings.hooks.check-symlinks.enable = true;
		pre-commit.settings.hooks.check-merge-conflicts.enable = true;
		pre-commit.settings.hooks.check-added-large-files.enable = true;
		pre-commit.settings.hooks.check-added-large-files.args = [
			"--maxkb=50"
			"--enforce-all"
		];

		pre-commit.settings.hooks.cog.enable = true;
		pre-commit.settings.hooks.cog.entry = "${pkgs.cocogitto}/bin/cog verify --file";
		pre-commit.settings.hooks.cog.stages = [
			"commit-msg"
		];

		pre-commit.settings.hooks.ripsecrets.enable = true;

		pre-commit.settings.hooks.check-yaml.enable = true;
		pre-commit.settings.hooks.check-json.enable = true;
		pre-commit.settings.hooks.check-toml.enable = true;

		pre-commit.settings.hooks.trim-trailing-whitespace.enable = true;

		pre-commit.settings.hooks.end-of-file-fixer.enable = true;
		pre-commit.settings.hooks.end-of-file-fixer.excludes = [
			"^target/"
			"^build/"
			"^node_modules/"
			"^vendor/"
			"^\\.git/"
			"\\.min\\.js$"
			"\\.min\\.css$"
			"\\.svg$"
			"\\.png$"
			"\\.jpg$"
			"\\.ico$"
		];
	};
}
