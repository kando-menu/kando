{ inputs, ... }: {
	imports = [
		inputs.git_hook.flakeModule
	];

	# npm install

	perSystem = { config, pkgs, ... }: {
		devShells.default = pkgs.mkShell {
			inputsFrom = [
				config.pre-commit.devShell
			];

			nativeBuildInputs = [
			  pkgs.git
				pkgs.bash-language-server
				pkgs.nixd
				pkgs.nixpkgs-fmt
				pkgs.cocogitto
				pkgs.pre-commit
				pkgs.nodejs
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
	};
}
