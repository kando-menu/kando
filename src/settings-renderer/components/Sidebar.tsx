//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import * as classes from './Sidebar.module.scss';

interface IProps {
  title?: string;
  position: 'left' | 'right';
}

function component(props: IProps) {
  const positionClass = props.position === 'left' ? classes.left : classes.right;
  const sidebarClass = classes.sidebar + ' ' + positionClass;
  const resizerClass = classes.resizer + ' ' + positionClass;

  const resizer = React.createRef<HTMLDivElement>();
  const sidebar = React.createRef<HTMLDivElement>();

  const makeResizable = () => {
    function resize(e: MouseEvent) {
      if (props.position === 'left') {
        sidebar.current.style.width = e.clientX + 'px';
      } else {
        sidebar.current.style.width = window.innerWidth - e.clientX + 'px';
      }
    }

    function stopResize() {
      document.removeEventListener('mousemove', resize);
      document.body.style.cursor = '';
    }

    if (resizer && sidebar) {
      resizer.current.addEventListener('mousedown', function () {
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.body.style.cursor = 'col-resize';
      });
    }
  };

  React.useEffect(() => {
    makeResizable();
  });

  return (
    <>
      {props.position === 'right' && <div ref={resizer} className={resizerClass} />}
      <div ref={sidebar} className={sidebarClass}>
        <div className={classes.headerbar}>{props.title}</div>
      </div>
      {props.position === 'left' && <div ref={resizer} className={resizerClass} />}
    </>
  );
}

export default component;
