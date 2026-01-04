//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import * as z from 'zod';
import { MENU_ITEM_SCHEMA } from '../settings-schemata';

/** Enum of all possible permissions for IPC clients. Extend as needed. */
export enum IPCPermission {
  eShowMenu = 'show-menu',
}

/** Enum of all possible reasons for declining authentication. */
export enum IPCAuthDeclineReason {
  /** If the request was malformed and could not be parsed. */
  eMalformedRequest = 'malformed-request',
  /** If the client tried to authenticate but has never requested access before. */
  eUnknownClient = 'unknown-client',
  /** If the requested API version is not supported. */
  eVersionNotSupported = 'version-not-supported',
  /** If the client did already authenticate but is trying to authenticate again. */
  eAlreadyAuthenticated = 'already-authenticated',
  /** If the provided token is invalid. */
  eInvalidToken = 'invalid-token',
  /** If the client did not request the previously granted permissions. */
  eInvalidPermissions = 'invalid-permissions',
  /** If the client has been blocked from accessing the server. */
  eClientBlocked = 'client-blocked',
  /** If the authentication was canceled by the user. Maybe you should try again later. */
  eCanceled = 'canceled',
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
 * Sent by the client to authenticate using a previously received token. Should be sent
 * immediately after connecting if the client has a token.
 */
export const AUTH_MESSAGE = z.object({
  type: z.literal('auth'),
  clientName: z.string(),
  token: z.string(),
  apiVersion: z.number(),
});

/**
 * Sent by the client to request authentication if it does not have a token yet. The
 * client specifies its name, requested permissions, and API version.
 */
export const AUTH_REQUEST_MESSAGE = z.object({
  type: z.literal('auth-request'),
  clientName: z.string(),
  permissions: z.array(z.enum(IPCPermission)),
  apiVersion: z.number(),
});

/**
 * Sent by the server in response to a successful authentication or auth request. Contains
 * the token to use for future connections and the granted permissions.
 */
export const AUTH_ACCEPTED_MESSAGE = z.object({
  type: z.literal('auth-accepted'),
  token: z.string(),
  permissions: z.array(z.enum(IPCPermission)),
});

/**
 * Sent by the server if authentication or an auth request is declined. The reason field
 * is an enum for localization-agnostic error handling.
 */
export const AUTH_DECLINED_MESSAGE = z.object({
  type: z.literal('auth-declined'),
  reason: z.enum(IPCAuthDeclineReason),
});

/**
 * Sent by the client to request that a menu be shown. The menu structure is provided as a
 * MENU_ITEM_SCHEMA object.
 */
export const SHOW_MENU_MESSAGE = z.object({
  type: z.literal('show-menu'),
  menu: MENU_ITEM_SCHEMA,
});

/**
 * Sent by the server to notify the client that the menu was closed without a selection.
 * This can happen if the user cancels the menu or another menu is shown on top.
 */
export const CLOSE_MENU_MESSAGE = z.object({
  type: z.literal('close-menu'),
});

/**
 * Sent by the client to notify the server that a menu item was selected. The path is an
 * array of indices representing the path to the selected item in the menu tree.
 */
export const SELECT_ITEM_MESSAGE = z.object({
  type: z.literal('select-item'),
  path: z.array(z.number()),
});

/**
 * Sent by the client to notify the server that a menu item is being hovered. The path is
 * an array of indices representing the path to the hovered item in the menu tree.
 */
export const HOVER_ITEM_MESSAGE = z.object({
  type: z.literal('hover-item'),
  path: z.array(z.number()),
});

/**
 * Sent by either client or server to indicate an error has occurred. The error field
 * contains a human-readable error message.
 */
export const ERROR_MESSAGE = z.object({
  type: z.literal('error'),
  error: z.string(),
});

export type IPCInfo = z.infer<typeof IPC_INFO_SCHEMA>;
export type AuthMessage = z.infer<typeof AUTH_MESSAGE>;
export type AuthRequestMessage = z.infer<typeof AUTH_REQUEST_MESSAGE>;
export type AuthAcceptedMessage = z.infer<typeof AUTH_ACCEPTED_MESSAGE>;
export type AuthDeclinedMessage = z.infer<typeof AUTH_DECLINED_MESSAGE>;
export type ShowMenuMessage = z.infer<typeof SHOW_MENU_MESSAGE>;
export type CloseMenuMessage = z.infer<typeof CLOSE_MENU_MESSAGE>;
export type SelectItemMessage = z.infer<typeof SELECT_ITEM_MESSAGE>;
export type HoverItemMessage = z.infer<typeof HOVER_ITEM_MESSAGE>;
export type ErrorMessage = z.infer<typeof ERROR_MESSAGE>;

export const IPC_MESSAGES = [
  AUTH_MESSAGE,
  AUTH_REQUEST_MESSAGE,
  AUTH_ACCEPTED_MESSAGE,
  AUTH_DECLINED_MESSAGE,
  SHOW_MENU_MESSAGE,
  CLOSE_MENU_MESSAGE,
  SELECT_ITEM_MESSAGE,
  HOVER_ITEM_MESSAGE,
  ERROR_MESSAGE,
];
