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
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Pagination } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';

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
  // Add state and ref for controlling Swiper
  const [activeIndex, setActiveIndex] = React.useState(0);
  const swiperRef = React.useRef<{ swiper: SwiperClass | null }>(null);

  const makeVideoSlide = (num: number) => {
    return (
      <>
        <video
          src={require(`../../../../assets/videos/introduction-${num}.mp4`)}
          autoPlay
          loop
        />
        <div className={classes.caption}>
          {i18next.t(`settings.introduction-dialog.slide-${num}-caption`)}
        </div>
      </>
    );
  };

  const slides = [
    <Note
      style="big"
      markdown
      center
      marginTop={10}
      marginLeft={'10%'}
      marginRight={'10%'}>
      {i18next
        .t('settings.introduction-dialog.message')
        .replace('%s1', 'https://discord.gg/hZwbVSDkhy')
        .replace('%s2', 'https://kando.menu')}
    </Note>,
    makeVideoSlide(1),
    makeVideoSlide(2),
    makeVideoSlide(3),
    makeVideoSlide(4),
    makeVideoSlide(5),
  ];

  // Define chapter names and their corresponding slide indices
  const chapters = [
    { label: 'Getting Started', index: 0 },
    { label: 'Marking Mode', index: 1 },
    { label: 'Turbo Mode', index: 2 },
    { label: 'Next Steps', index: 5 },
  ];

  return (
    <Modal
      title={i18next.t('settings.introduction-dialog.title')}
      icon={<IoSchool />}
      visible={introDialogVisible}
      onClose={() => setIntroDialogVisible(false)}
      maxWidth={950}>
      <div className={classes.container}>
        <div className={classes.sidebar}>
          {chapters.map((chapter) => (
            <div
              key={chapter.label}
              className={
                classes.chapter +
                (activeIndex === chapter.index ? ' ' + classes.activeChapter : '')
              }
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setActiveIndex(chapter.index);
                if (swiperRef.current && swiperRef.current.swiper) {
                  swiperRef.current.swiper.slideTo(chapter.index);
                }
              }}>
              {chapter.label}
            </div>
          ))}
          <div style={{ marginTop: 'auto' }}>
            <SettingsCheckbox
              label={i18next.t('settings.introduction-dialog.show-again')}
              settingsKey="showIntroductionDialog"
            />
          </div>
        </div>
        <Swiper
          effect={'cards'}
          grabCursor={true}
          pagination
          modules={[EffectCards, Pagination]}
          className={classes.swiper}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          initialSlide={activeIndex}
          ref={swiperRef}>
          {slides.map((slide, i) => (
            <SwiperSlide key={i} className={classes.slide}>
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Modal>
  );
};
