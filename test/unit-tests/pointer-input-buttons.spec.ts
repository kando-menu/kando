//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { expect } from 'chai';

import { SelectionSource } from '../../src/common';
import { PointerInput } from '../../src/menu-renderer/input-methods/pointer-input';
import {
  ButtonState,
  SelectionType,
} from '../../src/menu-renderer/input-methods/input-method';

/**
 * PointerInput is written for the browser, so we provide minimal stand-ins for the DOM
 * globals it uses. Only what PointerInput touches is implemented.
 */
class StubMouseEvent {
  public ctrlKey = false;
  public metaKey = false;
  public shiftKey = false;
  public altKey = false;

  constructor(
    public button: number,
    public clientX: number,
    public clientY: number
  ) {}

  public preventDefault() {}
  public stopPropagation() {}
}

class StubTouchEvent {
  public ctrlKey = false;
  public metaKey = false;
  public shiftKey = false;
  public altKey = false;
  public touches: { clientX: number; clientY: number }[];

  constructor(x: number, y: number) {
    this.touches = [{ clientX: x, clientY: y }];
  }

  public preventDefault() {}
  public stopPropagation() {}
}

type Selection = { type: SelectionType; source: SelectionSource };

describe('PointerInput mouse buttons', () => {
  const g = globalThis as Record<string, unknown>;
  const names = ['MouseEvent', 'TouchEvent', 'requestAnimationFrame'];
  const originals: Record<string, unknown> = {};

  let input: PointerInput;
  let closes: number;
  let selections: Selection[];
  let states: ButtonState[];

  before(() => {
    for (const name of names) {
      originals[name] = g[name];
    }
    g.MouseEvent = StubMouseEvent;
    g.TouchEvent = StubTouchEvent;
    // Run the callback right away so that motion events are not throttled.
    g.requestAnimationFrame = (callback: () => void) => {
      callback();
      return 0;
    };
  });

  after(() => {
    for (const name of names) {
      if (originals[name] === undefined) {
        delete g[name];
      } else {
        g[name] = originals[name];
      }
    }
  });

  beforeEach(() => {
    input = new PointerInput();
    closes = 0;
    selections = [];
    states = [];
    input.onUpdateState((state) => states.push(state.button));
    input.onCloseMenu(() => closes++);
    input.onSelection((_position, type, source) => selections.push({ type, source }));
    input.setCurrentCenter({ x: 0, y: 0 }, 50);
  });

  afterEach(() => {
    // Make sure no pending gesture timeout outlives the test.
    input.gestureDetector.reset();
  });

  const down = (button: number, x = 0, y = 0) =>
    input.onPointerDownEvent(new StubMouseEvent(button, x, y) as unknown as MouseEvent);
  const up = (button: number, x = 0, y = 0) =>
    input.onPointerUpEvent(new StubMouseEvent(button, x, y) as unknown as MouseEvent);
  const move = (x: number, y: number) =>
    input.onMotionEvent(new StubMouseEvent(0, x, y) as unknown as MouseEvent);

  it('should have the expected default behaviors', () => {
    expect(input.rightMouseButtonBehavior).to.equal('close');
    expect(input.middleMouseButtonBehavior).to.equal('select');
  });

  for (const [name, button] of [
    ['right', 2],
    ['middle', 1],
  ] as const) {
    const field =
      name === 'right' ? 'rightMouseButtonBehavior' : 'middleMouseButtonBehavior';

    describe(`${name} mouse button`, () => {
      it("should do nothing for 'nothing'", () => {
        input[field] = 'nothing';
        down(button);
        up(button);
        expect(closes).to.equal(0);
        expect(selections).to.have.length(0);
      });

      it("should close the menu for 'close'", () => {
        input[field] = 'close';
        down(button);
        up(button);
        expect(closes).to.equal(1);
        expect(selections).to.have.length(0);
      });

      it("should select the parent for 'select-parent'", () => {
        input[field] = 'select-parent';
        down(button);
        up(button);
        expect(closes).to.equal(0);
        expect(selections).to.deep.equal([
          { type: SelectionType.eParent, source: SelectionSource.eClick },
        ]);
      });

      it("should select the item on release for 'select'", () => {
        input[field] = 'select';
        down(button);
        up(button);
        expect(closes).to.equal(0);
        expect(selections).to.deep.equal([
          { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
        ]);
      });

      it("should start marking mode for 'select'", () => {
        input[field] = 'select';
        input.enableHoverMode = false;
        input.enableTurboMode = false;
        down(button, 0, 0);
        expect(states[states.length - 1]).to.equal(ButtonState.eClicked);
        move(100, 0);
        move(200, 0);
        expect(states[states.length - 1]).to.equal(ButtonState.eDragged);
        expect(selections).to.have.length(0);
        up(button, 200, 0);
        expect(selections).to.deep.equal([
          { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
        ]);
        expect(closes).to.equal(0);
        expect(states[states.length - 1]).to.equal(ButtonState.eReleased);
      });

      it("should clear a stale ignored pointer-up when pressed again with 'select'", () => {
        // A press with 'nothing' sets the ignore flag, but its pointerup never arrives.
        input[field] = 'nothing';
        down(button);
        expect(selections).to.have.length(0);

        // After switching to 'select', the new press must clear the stale flag. Else the
        // release would be swallowed and no selection would happen.
        input[field] = 'select';
        down(button);
        up(button);
        expect(selections).to.deep.equal([
          { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
        ]);
        expect(closes).to.equal(0);
      });

      it("should not select anything on release in hover mode for 'nothing'", () => {
        input[field] = 'nothing';
        input.enableHoverMode = true;
        // The turbo check uses the previous pointer position, so we need two moves to
        // enter the dragged state.
        move(100, 0);
        move(200, 0);
        expect(states[states.length - 1]).to.equal(ButtonState.eDragged);
        selections.length = 0;
        down(button, 200, 0);
        up(button, 200, 0);
        expect(selections).to.have.length(0);
        expect(closes).to.equal(0);
      });
    });
  }

  it('should complete a left button drag released as the last button of a chord', () => {
    // Chromium sends pointerup only for the last released button. So if the left button
    // is released while the right one is still pressed, the pointerup has button 2.
    input.enableHoverMode = false;
    input.enableTurboMode = false;
    down(0, 0, 0);
    move(100, 0);
    move(200, 0);
    expect(states[states.length - 1]).to.equal(ButtonState.eDragged);
    selections.length = 0;
    up(2, 200, 0);
    expect(selections).to.deep.equal([
      { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
    ]);
    expect(states[states.length - 1]).to.equal(ButtonState.eReleased);
  });

  it('should reset the ignored pointer-up when the menu is shown', () => {
    input.rightMouseButtonBehavior = 'close';
    down(2);
    expect(closes).to.equal(1);
    // The window was hidden, the pointerup may never have arrived.
    input.onShowMenu(false);
    down(0);
    up(0);
    expect(selections).to.deep.equal([
      { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
    ]);
  });

  it('should not swallow a later left click if the right pointerup never arrived', () => {
    // The release may happen outside the menu container, e.g. over the settings button.
    input.rightMouseButtonBehavior = 'nothing';
    down(2);
    down(0);
    up(0);
    expect(selections).to.deep.equal([
      { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
    ]);
  });

  it('should select on release of the left button', () => {
    down(0);
    up(0);
    expect(selections).to.deep.equal([
      { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
    ]);
    expect(closes).to.equal(0);
  });

  it('should select the parent with the back button', () => {
    down(3);
    expect(selections).to.deep.equal([
      { type: SelectionType.eParent, source: SelectionSource.eClick },
    ]);
  });

  it('should still handle touch events', () => {
    input.onPointerDownEvent(new StubTouchEvent(5, 5) as unknown as TouchEvent);
    input.onPointerUpEvent(new StubTouchEvent(5, 5) as unknown as TouchEvent);
    expect(selections).to.deep.equal([
      { type: SelectionType.eActiveItem, source: SelectionSource.eClick },
    ]);
  });
});
