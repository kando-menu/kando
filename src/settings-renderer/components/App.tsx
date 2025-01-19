//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react'

import * as classes from './App.module.scss'

import Sidebar from './Sidebar'
import Preview from './Preview'

function component() {

  return (
    <div className={classes.container }>
      <Sidebar/>
      <Preview/>
      <Sidebar/>
    </div>
  )
}

export default component