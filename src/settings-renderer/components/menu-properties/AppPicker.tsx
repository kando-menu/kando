//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import i18next from 'i18next';
import { TbCheck, TbX, TbBackspaceFilled } from 'react-icons/tb';

import { Modal, Button, Scrollbox, ThemedIcon, Note, Swirl } from '../common';
import { AppDescription } from '../../../common';
import { useAppState } from '../../state';

import * as classes from './AppPicker.module.scss';

type Props = {
  /** Function to call when a new window is selected. */
  onSelect: (value: AppDescription) => void;

  /** Function to call when the dialog should be closed. */
  onClose: () => void;

  /** Visibility of the modal. */
  visible: boolean;
};

/**
 * This component allows the user to select an application from a list of all installed
 * applications.
 */
export default function AppPicker(props: Props) {
  const [value, setValue] = React.useState<AppDescription | null>(null);
  const [filterTerm, setFilterTerm] = React.useState('');
  const installedApps = useAppState((state) => state.installedApps);

  // Filter the installed apps based on the search term.
  const filteredApps = installedApps.filter((app) =>
    app.name.toLowerCase().includes(filterTerm.toLowerCase())
  );

  // Clear the value when the modal is shown.
  React.useEffect(() => {
    if (props.visible) {
      setValue(null);
    }
  }, [props.visible]);

  return (
    <Modal visible={props.visible} onClose={props.onClose} maxWidth={450} paddingTop={15}>
      <div className={classes.container}>
        <Note center marginLeft="10%" marginRight="10%" markdown>
          {i18next.t('settings.app-picker.hint')}
        </Note>

        <Swirl variant="2" width={350} marginBottom={10} />
        <div className={classes.searchInput}>
          <input
            type="text"
            placeholder={i18next.t('settings.app-picker.search-placeholder')}
            value={filterTerm}
            onChange={(event) => {
              setFilterTerm(event.target.value);
            }}
          />
          <Button
            grouped
            icon={<TbBackspaceFilled />}
            onClick={() => {
              setFilterTerm('');
            }}
          />
        </div>
        <Scrollbox width="100%" paddingLeft={0}>
          <div>
            {filteredApps.map((app) => (
              <Button
                key={app.id}
                label={app.name}
                block
                variant={app.id === value?.id ? 'secondary' : 'flat'}
                align="left"
                icon={<ThemedIcon name={app.icon} theme={app.iconTheme} size={24} />}
                onClick={() => {
                  setValue(app);
                }}
              />
            ))}
          </div>
        </Scrollbox>
        <div className={classes.buttons}>
          <Button
            label={i18next.t('settings.cancel')}
            icon={<TbX />}
            block
            onClick={() => {
              props.onClose();
            }}
          />
          <Button
            label={i18next.t('settings.app-picker.use-selected')}
            variant="primary"
            disabled={!value}
            icon={<TbCheck />}
            block
            onClick={() => {
              props.onSelect(value);
              props.onClose();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
