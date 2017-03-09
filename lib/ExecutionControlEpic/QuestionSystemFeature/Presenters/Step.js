'use babel'
// @flow

import React from 'react';
import Radium from 'radium';

export default Radium(({height, children}: {}) => (
  <div style={{
    display: 'flex',
    height: height,
    flexShrink: '0',
    alignItems: 'stretch',
  }}>
    {children}
  </div>
));