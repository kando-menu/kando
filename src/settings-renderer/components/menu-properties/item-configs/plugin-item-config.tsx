//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import i18next from 'i18next';

import { useAppState, useMenuSettings, getSelectedChild } from '../../../state';
import { Dropdown } from '../../common';
import { PluginItemData } from '../../../../common/item-types/plugin-item-type';

// Import the window API type for accessing plugin list
import { WindowWithAPIs } from '../../../settings-window-api';
declare const window: WindowWithAPIs;

/**
 * Simple tip display component for plugin configuration.
 * This replaces RandomTip to avoid crashes when tip translations are missing.
 */
function PluginTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="plugin-tip" style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.9em' }}>
      {children}
    </div>
  );
}

/**
 * Represents a plugin option for the dropdown selector.
 */
interface IPluginOption {
  value: string;
  label: string;
}

/**
 * The configuration component for plugin items displays a dropdown to select
 * which installed plugin should be executed when this menu item is activated.
 */
export default function PluginItemConfig() {
  // Get state from Kando's state management
  const menus = useMenuSettings((state) => state.menus);
  const selectedMenu = useAppState((state) => state.selectedMenu);
  const selectedChildPath = useAppState((state) => state.selectedChildPath);
  const editMenuItem = useMenuSettings((state) => state.editMenuItem);
  const { selectedItem } = getSelectedChild(menus, selectedMenu, selectedChildPath);

  // Local state for plugin options - ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  const [pluginOptions, setPluginOptions] = useState<IPluginOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available plugins from the main process on mount
  useEffect(() => {
    // Guard: Don't fetch if no valid plugin item is selected
    if (!selectedItem || selectedItem.type !== 'plugin') {
      setIsLoading(false);
      return;
    }

    const loadPlugins = async () => {
      try {
        // First check if API exists
        if (!window.settingsAPI) {
          console.error('[PluginItemConfig] settingsAPI not available on window');
          setError('Settings API not available');
          setIsLoading(false);
          return;
        }

        if (!window.settingsAPI.getPlugins) {
          console.error('[PluginItemConfig] getPlugins method not available');
          setError('Plugin API not available');
          setIsLoading(false);
          return;
        }

        console.log('[PluginItemConfig] Calling getPlugins...');
        const plugins = await window.settingsAPI.getPlugins();
        console.log('[PluginItemConfig] Got plugins:', plugins);

        const options = plugins.map((plugin) => ({
          value: plugin.id,
          label: plugin.name,
        }));
        setPluginOptions(options);
      } catch (err) {
        console.error('[PluginItemConfig] Failed:', err);
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadPlugins();
  }, [selectedItem]);

  // ============================================================================
  // CONDITIONAL RETURNS - Only after all hooks have been called
  // ============================================================================

  // Sanity check: Return null if no valid plugin item is selected
  if (!selectedItem || selectedItem.type !== 'plugin') {
    return null;
  }

  // Now it's safe to access selectedItem.data
  const data = selectedItem.data as PluginItemData;

  // Show error state if something went wrong
  if (error) {
    return (
      <PluginTip>
        <span className="plugin-config-error">Error: {error}</span>
      </PluginTip>
    );
  }

  // Show loading state while fetching plugins
  if (isLoading) {
    return (
      <PluginTip>
        {i18next.t('menu-items.plugin.loading', 'Loading plugins...')}
      </PluginTip>
    );
  }

  // Show message if no plugins are installed
  if (pluginOptions.length === 0) {
    return (
      <PluginTip>
        {i18next.t(
          'menu-items.plugin.no-plugins',
          'No plugins installed. Import a plugin ZIP file to get started.'
        )}
      </PluginTip>
    );
  }

  // Render the plugin selector dropdown
  return (
    <>
      <Dropdown
        initialValue={data.pluginId}
        options={pluginOptions}
        placeholder={i18next.t('menu-items.plugin.placeholder', 'Select a plugin...')}
        onChange={(pluginId) => {
          // Find the selected plugin to update the menu item's display name
          const selectedPlugin = pluginOptions.find((p) => p.value === pluginId);

          editMenuItem(selectedMenu, selectedChildPath, (item) => {
            // Update the plugin ID in the item data
            (item.data as PluginItemData).pluginId = pluginId;

            // Optionally update the item name to match the plugin name
            if (selectedPlugin && !item.name) {
              item.name = selectedPlugin.label;
            }

            return item;
          });
        }}
      />
      <PluginTip>
        {i18next.t(
          'menu-items.plugin.tip',
          'Plugins extend Kando with custom functionality. Select which plugin to run when this menu item is activated.'
        )}
      </PluginTip>
    </>
  );
}
