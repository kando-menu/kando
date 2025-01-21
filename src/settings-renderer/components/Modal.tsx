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

import { RiCloseCircleLine } from 'react-icons/ri';

import Headerbar from './Headerbar';

import * as classes from './Modal.module.scss';
import Button from './Button';

interface IProps {
  visible: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export default (props: IProps) => {
  const ref = React.useRef(null);

  return (
    <CSSTransition
      in={props.visible}
      nodeRef={ref}
      timeout={300}
      classNames="modal"
      unmountOnExit>
      <div ref={ref} onClick={props.onClose} className={classes.modalBackground}>
        <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
          <Headerbar
            left={props.icon}
            center={props.title}
            right={
              <Button
                icon={<RiCloseCircleLine />}
                onClick={props.onClose}
                variant="flat"
              />
            }
            paddingLeft={10}
          />
          <div className={classes.content}>{props.children}</div>
        </div>
      </div>
    </CSSTransition>
  );
};
