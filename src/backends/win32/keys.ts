//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

/**
 * This is a mapping from the DOM key names to the Win32 virtual key codes. This is based
 * on this list:
 * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
 */
export const KeyNames = {
  Alt: 'VK_MENU', // (0x12), VK_LMENU (0xA4), VK_RMENU (0xA5)
  CapsLock: 'VK_CAPITAL', // (0x14)
  Control: 'VK_CONTROL', // (0x11), VK_LCONTROL (0xA2), VK_RCONTROL (0xA3)
  Meta: 'VK_LWIN', // (0x5B), VK_RWIN (0x5C)
  NumLock: 'VK_NUMLOCK', // (0x90)
  ScrollLock: 'VK_SCROLL', // (0x91)
  Shift: 'VK_SHIFT', // (0x10), VK_LSHIFT (0xA0), VK_RSHIFT (0xA1)
  Enter: 'VK_RETURN', // (0x0D)
  Tab: 'VK_TAB', // (0x09)
  ' ': 'VK_SPACE', // (0x20)
  ArrowDown: 'VK_DOWN', // (0x28)
  ArrowLeft: 'VK_LEFT', // (0x25)
  ArrowRight: 'VK_RIGHT', // (0x27)
  ArrowUp: 'VK_UP', // (0x26)
  End: 'VK_END', // (0x23)
  Home: 'VK_HOME', // (0x24)
  PageDown: 'VK_NEXT', // (0x22)
  PageUp: 'VK_PRIOR', // (0x21)
  Backspace: 'VK_BACK', // (0x08)
  Clear: 'VK_CLEAR', // (0x0C), VK_OEM_CLEAR (0xFE)
  Copy: 'APPCOMMAND_COPY',
  CrSel: 'VK_CRSEL', // (0xF7)
  Cut: 'APPCOMMAND_CUT',
  Delete: 'VK_DELETE', // (0x2E)
  EraseEof: 'VK_EREOF', // (0xF9)
  ExSel: 'VK_EXSEL', // (0xF8)
  Insert: 'VK_INSERT', // (0x2D)
  Paste: 'APPCOMMAND_PASTE',
  Redo: 'APPCOMMAND_REDO',
  Undo: 'APPCOMMAND_UNDO',
  Accept: 'VK_ACCEPT', // (0x1E)
  Attn: 'VK_OEM_ATTN', // (0xF0)
  ContextMenu: 'VK_APPS', // (0x5D)
  Escape: 'VK_ESCAPE', // (0x1B)
  Execute: 'VK_EXECUTE', // (0x2B)
  Find: 'APPCOMMAND_FIND',
  Finish: 'VK_OEM_FINISH', // (0xF1)
  Help: 'VK_HELP', // (0x2F) APPCOMMAND_HELP
  Pause: 'VK_PAUSE', // (0x13)
  Play: 'VK_PLAY', // (0xFA)
  Select: 'VK_SELECT', // (0x29)
  PrintScreen: 'VK_SNAPSHOT', // (0x2C)
  Standby: 'VK_SLEEP', // (0x5F)
  Alphanumeric: 'VK_OEM_ATTN', // (0xF0)
  Convert: 'VK_CONVERT', // (0x1C)
  FinalMode: 'VK_FINAL', // (0x18)
  ModeChange: 'VK_MODECHANGE', // (0x1F)
  NonConvert: 'VK_NONCONVERT', // (0x1D)
  Process: 'VK_PROCESSKEY', // (0xE5)
  HangulMode: 'VK_HANGUL', // (0x15) [1]
  HanjaMode: 'VK_HANJA', // (0x19) [1]
  JunjaMode: 'VK_JUNJA', // (0x17)
  Hankaku: 'VK_OEM_AUTO', // (0xF3)
  Hiragana: 'VK_OEM_COPY', // (0xF2)
  KanaMode: 'VK_KANA', // (0x15) [2] VK_ATTN (0xF6)
  KanjiMode: 'VK_KANJI', // [2]
  Katakana: 'VK_OEM_FINISH', // (0xF1)
  Romaji: 'VK_OEM_BACKTAB', // (0xF5)
  Zenkaku: 'VK_OEM_ENLW', // (0xF4)
  F1: 'VK_F1', // (0x70)
  F2: 'VK_F2', // (0x71)
  F3: 'VK_F3', // (0x72)
  F4: 'VK_F4', // (0x73)
  F5: 'VK_F5', // (0x74)
  F6: 'VK_F6', // (0x75)
  F7: 'VK_F7', // (0x76)
  F8: 'VK_F8', // (0x77)
  F9: 'VK_F9', // (0x78)
  F10: 'VK_F10', // (0x79)
  F11: 'VK_F11', // (0x7A)
  F12: 'VK_F12', // (0x7B)
  F13: 'VK_F13', // (0x7C)
  F14: 'VK_F14', // (0x7D)
  F15: 'VK_F15', // (0x7E)
  F16: 'VK_F16', // (0x7F)
  F17: 'VK_F17', // (0x80)
  F18: 'VK_F18', // (0x81)
  F19: 'VK_F19', // (0x82)
  F20: 'VK_F20', // (0x83)
  ChannelDown: 'APPCOMMAND_MEDIA_CHANNEL_DOWN',
  ChannelUp: 'APPCOMMAND_MEDIA_CHANNEL_UP',
  MediaFastForward: 'APPCOMMAND_MEDIA_FAST_FORWARD',
  MediaPause: 'APPCOMMAND_MEDIA_PAUSE',
  MediaPlay: 'APPCOMMAND_MEDIA_PLAY',
  MediaPlayPause: 'VK_MEDIA_PLAY_PAUSE', // (0xB3) APPCOMMAND_MEDIA_PLAY_PAUSE
  MediaRecord: 'APPCOMMAND_MEDIA_RECORD',
  MediaRewind: 'APPCOMMAND_MEDIA_REWIND',
  MediaStop: 'VK_MEDIA_STOP', // (0xB2) APPCOMMAND_MEDIA_STOP
  MediaTrackNext: 'VK_MEDIA_NEXT_TRACK', // (0xB0) APPCOMMAND_MEDIA_NEXTTRACK
  MediaTrackPrevious: 'VK_MEDIA_PREV_TRACK', // (0xB1) APPCOMMAND_MEDIA_PREVIOUSTRACK
  AudioBalanceLeft: 'VK_AUDIO_BALANCE_LEFT',
  AudioBalanceRight: 'VK_AUDIO_BALANCE_RIGHT',
  AudioBassDown: 'APPCOMMAND_BASS_DOWN',
  AudioBassBoostDown: 'VK_BASS_BOOST_DOWN',
  AudioBassBoostToggle: 'APPCOMMAND_BASS_BOOST',
  AudioBassBoostUp: 'VK_BASS_BOOST_UP',
  AudioBassUp: 'APPCOMMAND_BASS_UP',
  AudioFaderFront: 'VK_FADER_FRONT',
  AudioFaderRear: 'VK_FADER_REAR',
  AudioSurroundModeNext: 'VK_SURROUND_MODE_NEXT',
  AudioTrebleDown: 'APPCOMMAND_TREBLE_DOWN',
  AudioTrebleUp: 'APPCOMMAND_TREBLE_UP',
  AudioVolumeDown: 'VK_VOLUME_DOWN', // (0xAE) APPCOMMAND_VOLUME_DOWN
  AudioVolumeMute: 'VK_VOLUME_MUTE', // (0xAD) APPCOMMAND_VOLUME_MUTE
  AudioVolumeUp: 'VK_VOLUME_UP', // (0xAF) APPCOMMAND_VOLUME_UP
  MicrophoneToggle: 'APPCOMMAND_MIC_ON_OFF_TOGGLE',
  MicrophoneVolumeDown: 'APPCOMMAND_MICROPHONE_VOLUME_DOWN',
  MicrophoneVolumeMute: 'APPCOMMAND_MICROPHONE_VOLUME_MUTE',
  MicrophoneVolumeUp: 'APPCOMMAND_MICROPHONE_VOLUME_UP',
  ColorF0Red: 'VK_COLORED_KEY_0',
  ColorF1Green: 'VK_COLORED_KEY_1',
  ColorF2Yellow: 'VK_COLORED_KEY_2',
  ColorF3Blue: 'VK_COLORED_KEY_3',
  ColorF4Grey: 'VK_COLORED_KEY_4',
  ColorF5Brown: 'VK_COLORED_KEY_5',
  ClosedCaptionToggle: 'VK_CC',
  Dimmer: 'VK_DIMMER',
  DisplaySwap: 'VK_DISPLAY_SWAP',
  Exit: 'VK_EXIT',
  FavoriteClear0: 'VK_CLEAR_FAVORITE_0',
  FavoriteClear1: 'VK_CLEAR_FAVORITE_1',
  FavoriteClear2: 'VK_CLEAR_FAVORITE_2',
  FavoriteClear3: 'VK_CLEAR_FAVORITE_3',
  FavoriteRecall0: 'VK_RECALL_FAVORITE_0',
  FavoriteRecall1: 'VK_RECALL_FAVORITE_1',
  FavoriteRecall2: 'VK_RECALL_FAVORITE_2',
  FavoriteRecall3: 'VK_RECALL_FAVORITE_3',
  FavoriteStore0: 'VK_STORE_FAVORITE_0',
  FavoriteStore1: 'VK_STORE_FAVORITE_1',
  FavoriteStore2: 'VK_STORE_FAVORITE_2',
  FavoriteStore3: 'VK_STORE_FAVORITE_3',
  Guide: 'VK_GUIDE',
  GuideNextDay: 'VK_NEXT_DAY',
  GuidePreviousDay: 'VK_PREV_DAY',
  Info: 'VK_INFO',
  InstantReplay: 'VK_INSTANT_REPLAY',
  Link: 'VK_LINK',
  ListProgram: 'VK_LIST',
  LiveContent: 'VK_LIVE',
  Lock: 'VK_LOCK',
  MediaApps: 'VK_APPS',
  MediaLast: 'VK_LAST',
  MediaSkipForward: 'VK_SKIP',
  NextFavoriteChannel: 'VK_NEXT_FAVORITE_CHANNEL',
  NextUserProfile: 'VK_USER',
  OnDemand: 'VK_ON_DEMAND',
  PinPDown: 'VK_PINP_DOWN',
  PinPMove: 'VK_PINP_MOVE',
  PinPToggle: 'VK_PINP_TOGGLE',
  PinPUp: 'VK_PINP_UP',
  PlaySpeedDown: 'VK_PLAY_SPEED_DOWN',
  PlaySpeedReset: 'VK_PLAY_SPEED_RESET',
  PlaySpeedUp: 'VK_PLAY_SPEED_UP',
  RandomToggle: 'VK_RANDOM_TOGGLE',
  RcLowBattery: 'VK_RC_LOW_BATTERY',
  RecordSpeedNext: 'VK_RECORD_SPEED_NEXT',
  RfBypass: 'VK_RF_BYPASS',
  ScanChannelsToggle: 'VK_SCAN_CHANNELS_TOGGLE',
  ScreenModeNext: 'VK_SCREEN_MODE_NEXT',
  Settings: 'VK_SETTINGS',
  SplitScreenToggle: 'VK_SPLIT_SCREEN_TOGGLE',
  Subtitle: 'VK_SUBTITLE',
  Teletext: 'VK_TELETEXT',
  VideoModeNext: 'VK_VIDEO_MODE_NEXT',
  Wink: 'VK_WINK',
  ZoomToggle: 'VK_ZOOM', // (0xFB)
  SpeechCorrectionList: 'APPCOMMAND_CORRECTION_LIST',
  SpeechInputToggle: 'APPCOMMAND_DICTATE_OR_COMMAND_CONTROL_TOGGLE',
  LaunchCalculator: 'APPCOMMAND_LAUNCH_APP2',
  LaunchMail: 'VK_LAUNCH_MAIL', // (0xB4) APPCOMMAND_LAUNCH_MAIL
  LaunchMediaPlayer: 'VK_LAUNCH_MEDIA_SELECT', // (0xB5) APPCOMMAND_LAUNCH_MEDIA_SELECT
  LaunchMyComputer: 'APPCOMMAND_LAUNCH_APP1',
  LaunchApplication1: 'VK_LAUNCH_APP1', // (0xB6) APPCOMMAND_LAUNCH_APP1
  LaunchApplication2: 'VK_LAUNCH_APP2', // (0xB7) APPCOMMAND_LAUNCH_APP2
  BrowserBack: 'VK_BROWSER_BACK', // (0xA6) APPCOMMAND_BROWSER_BACKWARD
  BrowserFavorites: 'VK_BROWSER_FAVORITES', // (0xAB) APPCOMMAND_BROWSER_FAVORITES
  BrowserForward: 'VK_BROWSER_FORWARD', // (0xA7) APPCOMMAND_BROWSER_FORWARD
  BrowserHome: 'VK_BROWSER_HOME', // (0xAC) APPCOMMAND_BROWSER_HOME
  BrowserRefresh: 'VK_BROWSER_REFRESH', // (0xA8) APPCOMMAND_BROWSER_REFRESH
  BrowserSearch: 'VK_BROWSER_SEARCH', // (0xAA) APPCOMMAND_BROWSER_SEARCH
  BrowserStop: 'VK_BROWSER_STOP', // (0xA9) APPCOMMAND_BROWSER_STOP
  Decimal: 'VK_DECIMAL', // (0x6E)
  Multiply: 'VK_MULTIPLY', // (0x6A)
  Add: 'VK_ADD', // (0x6B)
  Divide: 'VK_DIVIDE', // (0x6F)
  Subtract: 'VK_SUBTRACT', // (0x6D)
  Separator: 'VK_SEPARATOR', // (0x6C)
  '0': 'VK_NUMPAD0', // (0x60)
  '1': 'VK_NUMPAD1', // (0x61)
  '2': 'VK_NUMPAD2', // (0x62)
  '3': 'VK_NUMPAD3', // (0x63)
  '4': 'VK_NUMPAD4', // (0x64)
  '5': 'VK_NUMPAD5', // (0x65)
  '6': 'VK_NUMPAD6', // (0x66)
  '7': 'VK_NUMPAD7', // (0x67)
  '8': 'VK_NUMPAD8', // (0x68)
  '9': 'VK_NUMPAD9', // (0x69)
};
