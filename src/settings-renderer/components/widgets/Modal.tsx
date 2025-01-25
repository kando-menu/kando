//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';
import { CSSTransition } from 'react-transition-group';
import { RiCloseLargeFill } from 'react-icons/ri';

import Headerbar from './Headerbar';
import Button from './Button';

import * as classes from './Modal.module.scss';

interface IProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: number;
}

export default (props: IProps) => {
  const ref = React.useRef(null);

  const closeButton = (
    <Button icon={<RiCloseLargeFill />} onClick={props.onClose} variant="flat" />
  );

  return (
    <CSSTransition
      in={props.visible}
      nodeRef={ref}
      timeout={200}
      classNames="modal"
      unmountOnExit>
      <div ref={ref} onClick={props.onClose} className={classes.modalBackground}>
        <div
          className={classes.modal}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: props.maxWidth }}>
          <Headerbar
            transparent
            left={cIsMac ? closeButton : props.title}
            center={cIsMac ? props.title : null}
            right={!cIsMac ? closeButton : null}
            paddingLeft={cIsMac ? 0 : 15}
          />
          <div className={classes.content}>{props.children}</div>
        </div>
      </div>
    </CSSTransition>
  );
};
