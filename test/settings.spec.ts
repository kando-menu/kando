//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/kando-menu/kando     //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { Settings } from '../src/main/utils/settings';
import { expect } from 'chai';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

describe('settings', () => {
  // Remove any remaining test settings file before the test.
  before(() => {
    fs.removeSync(path.join(os.tmpdir(), 'kando_test.json'));
  });

  const settings = new Settings({
    file: 'kando_test.json',
    directory: os.tmpdir(),
    defaults: {
      foo: 'bar',
      bar: 123,
      nested: {
        answer: 42,
      },
    },
  });

  it('should return default values', () => {
    expect(settings.get('foo')).to.equal('bar');
    expect(settings.get('bar')).to.equal(123);
    expect(settings.get('nested').answer).to.equal(42);
  });

  it('should allow setting new values', () => {
    settings.set({ foo: 'baz' });
    settings.set({ bar: 456 });
    settings.set({ nested: { answer: 24 } });

    expect(settings.get('foo')).to.equal('baz');
    expect(settings.get('bar')).to.equal(456);
    expect(settings.get('nested').answer).to.equal(24);
  });

  it('should support unicode', () => {
    settings.set({ foo: '🥳' });
    expect(settings.get('foo')).to.equal('🥳');
  });

  it('should call callbacks', () => {
    let fooCalled = false;
    let barCalled = false;
    let nestedCalled = false;
    let anyChangeCalled = false;

    settings.onChange('foo', (newValue, oldValue) => {
      expect(oldValue).to.equal('🥳');
      expect(newValue).to.equal('newFoo');
      fooCalled = true;
    });

    settings.onChange('bar', (newValue, oldValue) => {
      expect(oldValue).to.equal(456);
      expect(newValue).to.equal(789);
      barCalled = true;
    });

    settings.onChange('nested', (newValue, oldValue) => {
      expect(oldValue.answer).to.equal(24);
      expect(newValue.answer).to.equal(48);
      nestedCalled = true;
    });

    settings.onAnyChange(() => {
      anyChangeCalled = true;
    });

    settings.set({ foo: 'newFoo', bar: 789, nested: { answer: 48 } });
    settings.disconnectAll();

    expect(fooCalled).to.be.true;
    expect(barCalled).to.be.true;
    expect(nestedCalled).to.be.true;
    expect(anyChangeCalled).to.be.true;
  });

  it('should support multiple onChange callbacks', () => {
    let called1 = false;
    let called2 = false;

    settings.onChange('foo', () => {
      called1 = true;
    });

    settings.onChange('foo', () => {
      called2 = true;
    });

    settings.set({ foo: 'bar' });
    settings.disconnectAll();

    expect(called1).to.be.true;
    expect(called2).to.be.true;
  });

  it('should support multiple onAnyChange callbacks', () => {
    let called1 = false;
    let called2 = false;

    settings.onAnyChange(() => {
      called1 = true;
    });

    settings.onAnyChange(() => {
      called2 = true;
    });

    settings.set({ foo: 'baobab' });
    settings.disconnectAll();

    expect(called1).to.be.true;
    expect(called2).to.be.true;
  });

  it('should not call callbacks if they were disconnected', () => {
    let called1 = false;
    let called2 = false;
    let called3 = false;
    let called4 = false;

    const listener1 = () => {
      called1 = true;
    };

    const listener2 = () => {
      called2 = true;
    };

    const listener3 = () => {
      called3 = true;
    };

    const listener4 = () => {
      called4 = true;
    };

    settings.onChange('foo', listener1);
    settings.onChange('foo', listener2);
    settings.onAnyChange(listener3);
    settings.onAnyChange(listener4);

    settings.disconnect('foo', listener1);
    settings.disconnectAnyChange(listener3);

    settings.set({ foo: 'foofoo' });

    settings.disconnectAll();

    expect(called1).to.be.false;
    expect(called2).to.be.true;
    expect(called3).to.be.false;
    expect(called4).to.be.true;
  });

  it('should not call onChange callbacks if the value did not change', () => {
    let called1 = false;
    let called2 = false;

    settings.onChange('nested', () => {
      called1 = true;
    });

    settings.onAnyChange(() => {
      called2 = true;
    });

    settings.set({ nested: { answer: 48 } });
    settings.set({ nested: { answer: 48 } });
    settings.disconnectAll();

    expect(called1).to.be.false;
    expect(called2).to.be.false;
  });

  it('should not call onChange callbacks after it was closed', () => {
    let called = false;

    settings.onChange('foo', () => {
      called = true;
    });

    settings.close();
    settings.set({ foo: 'finally!' });
    settings.disconnectAll();

    expect(called).to.be.false;
  });

  // Remove the test settings file after the test.
  after(() => {
    fs.removeSync(path.join(os.tmpdir(), 'kando_test.json'));
  });
});
