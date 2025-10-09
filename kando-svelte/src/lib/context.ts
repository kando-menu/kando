import type { Vec2 } from './types';
import type { MenuItem } from './types';

export type IndexPath = number[];

export type PointerInfo = { dx: number; dy: number; angle: number; distance: number } | null;

export type PieTreeContext = {
  getChain(): IndexPath;
  getCenter(): Vec2;
  getRadius(): number;
  getPointer(): PointerInfo;
  hoverIndex(): number;
  select(index: number): void;
  back(): void;
  resolve(path: IndexPath): MenuItem | null;
};

export const PIE_TREE_CTX: unique symbol = Symbol('pie-tree');

export type PieMenuContext = {
  item: MenuItem;
  indexPath: IndexPath;
  parentItem: MenuItem | null;
};

export const PIE_MENU_CTX: unique symbol = Symbol('pie-menu');


