import React from 'react'

import * as classes from './App.module.scss'

function app() {

  return (
    <div className={classes.container}>
      <h1>Hi, Electron!</h1>

      <p>I hope you enjoy using basic-electron-react-boilerplate to start your dev off right!</p>
    </div>
  )
}

export default app