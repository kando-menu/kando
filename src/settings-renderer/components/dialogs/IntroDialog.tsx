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
import classNames from 'classnames/bind';
import { IoSchool } from 'react-icons/io5';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';

import 'swiper/css';
import 'swiper/css/effect-cards';

import { useAppState, useGeneralSetting } from '../../state';
import { SettingsCheckbox, Modal, Note, Swirl } from '../common';

import * as classes from './IntroDialog.module.scss';
const cx = classNames.bind(classes);

/**
 * This dialog shows an introduction to Kando. It includes a series of slides that
 * demonstrate the interaction with Kando. The dialog is shown when the user first starts
 * Kando, unless the user has disabled it in the settings.
 */
export default function IntroDialog() {
  const introDialogVisible = useAppState((state) => state.introDialogVisible);
  const setIntroDialogVisible = useAppState((state) => state.setIntroDialogVisible);
  const [showIntroductionDialog] = useGeneralSetting('showIntroductionDialog');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const swiperRef = React.useRef<{ swiper: SwiperClass | null }>(null);
  const backend = useAppState((state) => state.backendInfo);

  // Show the introduction dialog if the user has not disabled it in the settings.
  React.useEffect(() => {
    if (showIntroductionDialog) {
      setIntroDialogVisible(true);
    }
  }, []);

  const makeVideoSlide = (videoNumber: number, text: string) => {
    return (
      <>
        <video
          className={classes.fullSize}
          src={require(`../../../../assets/videos/introduction-${videoNumber}.mp4`)}
          autoPlay
          loop
        />
        <div className={classes.caption}>
          <Note markdown style="normal" center>
            {text}
          </Note>
        </div>
      </>
    );
  };

  const makePagination = (length: number, index: number) => {
    return (
      <div className={classes.pagination}>
        {Array.from({ length }, (_, i) => (
          <div
            onClick={() => {
              setActiveIndex(i);
              if (swiperRef.current && swiperRef.current.swiper) {
                swiperRef.current.swiper.slideTo(i);
              }
            }}
            key={i}
            className={cx({
              dot: true,
              activeDot: i === index,
            })}></div>
        ))}
      </div>
    );
  };

  const slides = [
    <>
      <Note style="hero" center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide1-title')}
      </Note>
      <Swirl variant="2" marginTop={10} marginBottom={20} width={350} />
      <Note style="normal" center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide1-text')}
      </Note>
    </>,
    <>
      <Note style="hero" center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide2-title')}
      </Note>
      <Swirl variant="2" marginTop={10} marginBottom={20} width={350} />
      <Note style="normal" center markdown marginLeft={'10%'} marginRight={'10%'}>
        {backend.supportsShortcuts
          ? i18next.t('settings.introduction-dialog.slide2-text-standard')
          : i18next.t('settings.introduction-dialog.slide2-text-no-shortcuts', {
              link: 'https://kando.menu/installation-on-linux/#desktop-specifics',
            })}
      </Note>
    </>,
    <>
      <img
        className={classes.fullSize}
        src={require('../../../../assets/images/tutorial-1.svg')}
      />
      <div className={classes.arrowHint1}>
        {i18next.t('settings.introduction-dialog.slide3-hint1')}
      </div>
      <div className={classes.arrowHint2}>
        {i18next.t('settings.introduction-dialog.slide3-hint2')}
      </div>
      <div className={classes.caption}>
        <Note markdown style="normal" center>
          {i18next.t('settings.introduction-dialog.slide3-text')}
        </Note>
      </div>
    </>,
    makeVideoSlide(1, i18next.t('settings.introduction-dialog.slide4-text')),
    <>
      <img
        className={classes.fullSize}
        src={require('../../../../assets/images/tutorial-2.svg')}
      />
      <div className={classes.arrowHint3}>
        {i18next.t('settings.introduction-dialog.slide5-hint')}
      </div>
      <div className={classes.caption}>
        <Note markdown style="normal" center>
          {i18next.t('settings.introduction-dialog.slide5-text')}
        </Note>
      </div>
    </>,
    makeVideoSlide(2, i18next.t('settings.introduction-dialog.slide6-text')),
    <>
      <Note style="hero" center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide7-title')}
      </Note>
      <Swirl variant="2" marginTop={10} marginBottom={20} width={350} />
      <Note style="normal" markdown center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide7-text')}
      </Note>
    </>,
    makeVideoSlide(3, i18next.t('settings.introduction-dialog.slide8-text')),
    <>
      <Note style="hero" center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide9-title')}
      </Note>
      <Swirl variant="2" marginTop={10} marginBottom={20} width={350} />
      <Note style="normal" markdown center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide9-text')}
      </Note>
    </>,
    makeVideoSlide(4, i18next.t('settings.introduction-dialog.slide10-text')),
    makeVideoSlide(5, i18next.t('settings.introduction-dialog.slide11-text')),
    <>
      <Note style="hero" center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide12-title')}
      </Note>
      <Swirl variant="2" marginTop={10} marginBottom={20} width={350} />
      <Note style="normal" markdown center marginLeft={'10%'} marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide12-text', {
          link1: 'https://kando.menu/menu-themes',
          link2: 'https://kando.menu/icon-themes',
          link3: 'https://kando.menu/sound-themes',
        })}
      </Note>
    </>,
    <>
      <Swirl variant="4" marginBottom={10} width={250} />
      <Note
        style="big"
        markdown
        center
        marginTop={10}
        marginLeft={'10%'}
        marginRight={'10%'}>
        {i18next.t('settings.introduction-dialog.slide13-text', {
          link1: 'https://discord.gg/hZwbVSDkhy',
          link2: 'https://kando.menu',
        })}
      </Note>
      <Swirl variant="3" marginTop={10} width={250} />
    </>,
  ];

  // Define chapter names and their corresponding slide indices
  const chapters = [
    { label: i18next.t('settings.introduction-dialog.chapter1'), from: 0, to: 5 },
    { label: i18next.t('settings.introduction-dialog.chapter2'), from: 6, to: 7 },
    { label: i18next.t('settings.introduction-dialog.chapter3'), from: 8, to: 10 },
    { label: i18next.t('settings.introduction-dialog.chapter4'), from: 11, to: 11 },
    { label: i18next.t('settings.introduction-dialog.chapter5'), from: 12, to: 12 },
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
          <ol>
            {chapters.map((chapter) => (
              <li
                key={chapter.label}
                className={cx({
                  chapter: true,
                  activeChapter: activeIndex >= chapter.from && activeIndex <= chapter.to,
                })}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setActiveIndex(chapter.from);
                  if (swiperRef.current && swiperRef.current.swiper) {
                    swiperRef.current.swiper.slideTo(chapter.from);
                  }
                }}>
                {chapter.label}
              </li>
            ))}
          </ol>
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
          modules={[EffectCards]}
          className={classes.swiper}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          initialSlide={activeIndex}
          ref={swiperRef}>
          {slides.map((slide, i) => (
            <SwiperSlide key={i} className={classes.slide}>
              {slide}
              {makePagination(slides.length, i)}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Modal>
  );
}
