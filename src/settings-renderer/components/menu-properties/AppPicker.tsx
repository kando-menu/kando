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
  readonly onSelect: (value: AppDescription) => void;

  /** Function to call when the dialog should be closed. */
  readonly onClose: () => void;

  /** Visibility of the modal. */
  readonly isVisible: boolean;
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
    app.name && app.name.toLowerCase().includes(filterTerm.toLowerCase())
  );

  // Clear the value when the modal is shown.
  React.useEffect(() => {
    if (props.isVisible) {
      setValue(null);
    }
  }, [props.isVisible]);

  return (
    <Modal
      isVisible={props.isVisible}
      maxWidth={450}
      paddingTop={15}
      onClose={props.onClose}>
      <div className={classes.container}>
        <Note isCentered useMarkdown marginLeft="10%" marginRight="10%">
          {i18next.t('settings.app-picker.hint')}
        </Note>

        <Swirl marginBottom={10} variant="2" width={350} />
        <div className={classes.searchInput}>
          <input
            placeholder={i18next.t('settings.app-picker.search-placeholder')}
            type="text"
            value={filterTerm}
            onChange={(event) => {
              setFilterTerm(event.target.value);
            }}
          />
          <Button
            isGrouped
            icon={<TbBackspaceFilled />}
            onClick={() => {
              setFilterTerm('');
            }}
          />
        </div>
        <Scrollbox paddingLeft={0} width="100%">
          <div>
            {filteredApps.map((app) => (
              <Button
                key={app.id}
                isBlock
                align="left"
                icon={<ThemedIcon name={app.icon} size={24} theme={app.iconTheme} />}
                label={app.name}
                variant={app.id === value?.id ? 'secondary' : 'flat'}
                onClick={() => {
                  setValue(app);
                }}
              />
            ))}
          </div>
        </Scrollbox>
        <div className={classes.buttons}>
          <Button
            isBlock
            icon={<TbX />}
            label={i18next.t('settings.cancel')}
            onClick={() => {
              props.onClose();
            }}
          />
          <Button
            isBlock
            icon={<TbCheck />}
            isDisabled={!value}
            label={i18next.t('settings.app-picker.use-selected')}
            variant="primary"
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
