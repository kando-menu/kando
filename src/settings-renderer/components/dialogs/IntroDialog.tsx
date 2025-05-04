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
import { IoSchool } from 'react-icons/io5';
import { TbExternalLink } from 'react-icons/tb';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

import { useAppState, useGeneralSetting } from '../../state';
import { SettingsCheckbox, Modal, Note } from '../common';

import * as classes from './IntroDialog.module.scss';

/**
 * This dialog shows an introduction to Kando. It includes a series of slides that
 * demonstrate the interaction with Kando. The dialog is shown when the user first starts
 * Kando, unless the user has disabled it in the settings.
 */
export default () => {
  const introDialogVisible = useAppState((state) => state.introDialogVisible);
  const setIntroDialogVisible = useAppState((state) => state.setIntroDialogVisible);
  const [showIntroductionDialog] = useGeneralSetting('showIntroductionDialog');

  // Show the introduction dialog if the user has not disabled it in the settings.
  React.useEffect(() => {
    if (showIntroductionDialog) {
      setIntroDialogVisible(true);
    }
  }, []);

  const slides = [
    i18next.t('sidebar.introduction-tab-slide-1-caption'),
    i18next.t('sidebar.introduction-tab-slide-2-caption'),
    i18next.t('sidebar.introduction-tab-slide-3-caption'),
    i18next.t('sidebar.introduction-tab-slide-4-caption'),
    i18next.t('sidebar.introduction-tab-slide-5-caption'),
  ];

  return (
    <Modal
      title="Welcome to Kando!"
      icon={<IoSchool />}
      visible={introDialogVisible}
      onClose={() => setIntroDialogVisible(false)}
      maxWidth={550}>
      <div className={classes.container}>
        <div className={classes.hero}>
          Kando offers a unique and powerful way to interact with your computer. Have a
          look at the videos below to get a glimpse of what Kando can do for you! If you
          need help at any point, feel free to join our{' '}
          <a href="https://discord.gg/hZwbVSDkhy" target="_blank">
            Discord Server <TbExternalLink />
          </a>{' '}
          or check out the{' '}
          <a href="https://kando.menu" target="_blank">
            documentation <TbExternalLink />
          </a>
          .
        </div>
        <Swiper
          effect={'cards'}
          grabCursor={true}
          modules={[EffectCards]}
          className={classes.swiper}>
          {slides.map((slide, i) => (
            <SwiperSlide key={i} className={classes.slide}>
              <video
                src={require(`../../../../assets/videos/introduction-${i + 1}.mp4`)}
                autoPlay
                loop
              />
              <div className={classes.caption}>{slide}</div>
            </SwiperSlide>
          ))}
        </Swiper>

        <Note>
          <SettingsCheckbox
            label="Show this dialog on startup"
            settingsKey="showIntroductionDialog"
          />
        </Note>
      </div>
    </Modal>
  );
};
