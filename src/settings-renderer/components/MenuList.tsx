//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import React from 'react';

import { RiSettings4Fill, RiInformation2Fill, RiPaletteFill } from 'react-icons/ri';
import Button from './Button';

export default () => {
  return (
    <>
      <p> Normal Buttons</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => {}} label="Settings" />
        <Button onClick={() => {}} icon={<RiPaletteFill />} />
        <Button onClick={() => {}} icon={<RiSettings4Fill />} label="Settings" />
      </div>
      <p> Flat Buttons</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => {}} label="Settings" variant="flat" />
        <Button onClick={() => {}} icon={<RiPaletteFill />} variant="flat" />
        <Button
          onClick={() => {}}
          icon={<RiSettings4Fill />}
          label="Settings"
          variant="flat"
        />
      </div>
      <p> Primary Buttons</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => {}} label="Settings" variant="primary" />
        <Button onClick={() => {}} icon={<RiPaletteFill />} variant="primary" />
        <Button
          onClick={() => {}}
          icon={<RiSettings4Fill />}
          label="Settings"
          variant="primary"
        />
      </div>
      <p> Disabled Buttons</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => {}} label="Settings" disabled={true} />
        <Button onClick={() => {}} icon={<RiPaletteFill />} disabled={true} />
        <Button
          onClick={() => {}}
          icon={<RiSettings4Fill />}
          label="Settings"
          disabled={true}
        />
      </div>
      <p> Button Sizes</p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Button
          onClick={() => {}}
          icon={<RiSettings4Fill />}
          size="small"
          label="Settings"
          variant="secondary"
        />
        <Button
          onClick={() => {}}
          icon={<RiSettings4Fill />}
          size="medium"
          label="Settings"
          variant="secondary"
        />
        <Button
          onClick={() => {}}
          icon={<RiSettings4Fill />}
          size="large"
          label="Settings"
          variant="secondary"
        />
      </div>
      <p>Block Button</p>
      <Button
        onClick={() => {}}
        icon={<RiSettings4Fill />}
        label="Settings"
        block={true}
      />
    </>
  );
};
