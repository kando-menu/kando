//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { INode, IKeySequence } from '../index';
import { INodeAction } from '../node-action-registry';
import { Backend } from '../../main/backends/backend';
import { DeepReadonly } from '../../main/settings';

interface INodeData {
  hotkey: string;
  delayed: boolean;
}

export class HotkeyNodeAction implements INodeAction {
  delayedExecution(node: DeepReadonly<INode>) {
    return (node.data as INodeData).delayed;
  }

  execute(node: DeepReadonly<INode>, backend: Backend): void {
    // We convert some common key names to the corresponding left key names.
    const keyNames = (node.data as INodeData).hotkey.split('+').map((name) => {
      // There are many different names for the Control key. We convert them all
      // to "ControlLeft".
      if (
        name === 'CommandOrControl' ||
        name === 'CmdOrCtrl' ||
        name === 'Command' ||
        name === 'Control' ||
        name === 'Cmd' ||
        name === 'Ctrl'
      ) {
        return 'ControlLeft';
      }

      if (name === 'Shift') return 'ShiftLeft';
      if (name === 'Meta' || name === 'Super') return 'MetaLeft';
      if (name === 'Alt') return 'AltLeft';

      // If the key name is only one character long, we assume that it is a
      // single character which should be pressed. In this case, we prefix it
      // with "Key".
      if (name.length === 1) return 'Key' + name.toUpperCase();

      return name;
    });

    // We simulate the key press by first pressing all keys and then releasing
    // them again. We add a small delay between the key presses to make sure
    // that the keys are pressed in the correct order.
    const keys: IKeySequence = [];

    // First press all keys.
    for (const key of keyNames) {
      keys.push({ name: key, down: true, delay: 10 });
    }

    // Then release all keys.
    for (const key of keyNames) {
      keys.push({ name: key, down: false, delay: 10 });
    }

    // Finally, we simulate the key presses using the backend.
    backend.simulateKeys(keys);
  }
}
