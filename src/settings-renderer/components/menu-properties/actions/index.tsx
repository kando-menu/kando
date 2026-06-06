//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { DelayActionConfig } from './DelayActionConfig';
import { ExecuteCommandActionConfig } from './ExecuteCommandActionConfig';
import { ExecuteMacroActionConfig } from './ExecuteMacroActionConfig';
import { OpenFileActionConfig } from './OpenFileActionConfig';
import { OpenMenuActionConfig } from './OpenMenuActionConfig';
import { OpenURIActionConfig } from './OpenURIActionConfig';
import { SetClipboardActionConfig } from './SetClipboardActionConfig';
import { SimulateHotkeyActionConfig } from './SimulateHotkeyActionConfig';
import { WorkflowAction } from '../../../../common';

/**
 * Returns a config component for the given action.
 *
 * @param action The action for which the config component should be created.
 * @param onUpdateAction Callback when the action is modified.
 * @param onUpdateItem Callback when the container menu item should be modified.
 * @returns The config component for the given action, or null if the type is unknown.
 */
export function getConfigComponent(
  action: WorkflowAction,
  onUpdateAction: (action: WorkflowAction) => void,
  onUpdateItem: (info: { name?: string; icon?: string; iconTheme?: string }) => void
): React.ReactElement | null {
  if (action.type === 'delay') {
    return <DelayActionConfig action={action} onUpdateAction={onUpdateAction} />;
  }

  if (action.type === 'execute-command') {
    return (
      <ExecuteCommandActionConfig
        action={action}
        onUpdateAction={onUpdateAction}
        onUpdateItem={onUpdateItem}
      />
    );
  }

  if (action.type === 'execute-macro') {
    return <ExecuteMacroActionConfig action={action} onUpdateAction={onUpdateAction} />;
  }

  if (action.type === 'open-file') {
    return (
      <OpenFileActionConfig
        action={action}
        onUpdateAction={onUpdateAction}
        onUpdateItem={onUpdateItem}
      />
    );
  }

  if (action.type === 'open-menu') {
    return (
      <OpenMenuActionConfig
        action={action}
        onUpdateAction={onUpdateAction}
        onUpdateItem={onUpdateItem}
      />
    );
  }

  if (action.type === 'open-uri') {
    return <OpenURIActionConfig action={action} onUpdateAction={onUpdateAction} />;
  }

  if (action.type === 'set-clipboard') {
    return <SetClipboardActionConfig action={action} onUpdateAction={onUpdateAction} />;
  }

  if (action.type === 'simulate-hotkey') {
    return <SimulateHotkeyActionConfig action={action} onUpdateAction={onUpdateAction} />;
  }

  return null;
}
