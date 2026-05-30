//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { ROOT_MENU_ITEM_SCHEMA } from '../settings-schemata';
import { MenuInteractionType } from '..';

/** Enum of all possible reasons for declining a request. */
export enum IPCErrorReason {
  /** If the client is not connected to the server. */
  eNotConnected = 'not-connected',
  /** If the client failed to connect to the server. */
  eConnectionFailed = 'connection-failed',
  /** If the request was malformed and could not be parsed. */
  eMalformedRequest = 'malformed-request',
  /** If the requested API version is not supported. */
  eVersionNotSupported = 'version-not-supported',
  /** If a client wants to register as an observer but has already registered. */
  eAlreadyObserving = 'already-observing',
  /** If a client wants to unregister as an observer but is not registered. */
  eNotObserving = 'not-observing',
}

/**
 * This is used to store the current websocket port for the IPC server and share it
 * between clients and the server.
 */
export const IPC_INFO_SCHEMA = z.object({
  port: z.number(),
  apiVersion: z.number(),
});

/**
 * Sent by the client to request that a menu be shown. The menu structure is provided as a
 * MENU_ITEM_SCHEMA object.
 */
export const SHOW_MENU_MESSAGE = z.object({
  type: z.literal('show-menu'),
  menu: ROOT_MENU_ITEM_SCHEMA,
});

/**
 * Sent by the client to request that it wants to observe menu events. The server will
 * start sending menu events to the client until it sends a stop-observing message or
 * disconnects.
 */
export const START_OBSERVING_MESSAGE = z.object({
  type: z.literal('start-observing'),
});

/** Sent by the client to request that it stops observing menu events. */
export const STOP_OBSERVING_MESSAGE = z.object({
  type: z.literal('stop-observing'),
});

/**
 * Sent by the client to notify the server that a menu item was selected. The path is an
 * array of indices representing the path to the selected item in the menu tree.
 */
export const MENU_INTERACTION_MESSAGE = z.object({
  type: z.literal('menu-interaction'),
  interaction: z.enum(MenuInteractionType),
  path: z.array(z.number()),
});

/**
 * Sent by either client or server to indicate an error has occurred. The error field
 * contains a human-readable error message.
 */
export const ERROR_MESSAGE = z.object({
  type: z.literal('error'),
  reason: z.enum(IPCErrorReason),
  description: z.string(),
});

export type IPCInfo = z.infer<typeof IPC_INFO_SCHEMA>;
export type ShowMenuMessage = z.infer<typeof SHOW_MENU_MESSAGE>;
export type StartObservingMessage = z.infer<typeof START_OBSERVING_MESSAGE>;
export type StopObservingMessage = z.infer<typeof STOP_OBSERVING_MESSAGE>;
export type MenuInteractionMessage = z.infer<typeof MENU_INTERACTION_MESSAGE>;
export type ErrorMessage = z.infer<typeof ERROR_MESSAGE>;

export const IPC_MESSAGES = [SHOW_MENU_MESSAGE, MENU_INTERACTION_MESSAGE, ERROR_MESSAGE];
