//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React, { ReactNode } from 'react';

import * as classes from './Sidebar.module.scss';

interface IProps {
  position: 'left' | 'right';
  header: ReactNode;
  content: ReactNode;
}

export default (props: IProps) => {
  const resizer = React.useRef<HTMLDivElement>(null);
  const sidebar = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const resize = (e: MouseEvent) => {
      if (props.position === 'left') {
        sidebar.current.style.width = e.clientX + 'px';
      } else {
        sidebar.current.style.width = window.innerWidth - e.clientX + 'px';
      }
    };

    const stopResize = () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = '';
    };

    if (resizer && sidebar) {
      resizer.current.addEventListener('mousedown', function () {
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
      });
    }
  }, []);

  const positionClass = props.position === 'left' ? classes.left : classes.right;
  const resizerClass = classes.resizer + ' ' + positionClass;

  return (
    <>
      {props.position === 'right' && <div ref={resizer} className={resizerClass} />}
      <div ref={sidebar} className={classes.sidebar}>
        {props.header}
        <div className={classes.content}>{props.content}</div>
      </div>
      {props.position === 'left' && <div ref={resizer} className={resizerClass} />}
    </>
  );
};
