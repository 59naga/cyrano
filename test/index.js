import test from 'ava';
import Cyrano from '../src';
import EventManager from './event-manager';

// FIXME: translate to english description

test('次のイベントへ値を伝達する', async t => {
  const cyrano = new Cyrano;

  t.is(
    await cyrano
      .fn(() => `foo`)
      .fn((prevValue) => `${prevValue}bar`)
      .fn((prevValue) => `${prevValue}baz`)
    , 'foobarbaz'
  );
});

test('次のイベントへ値を伝達し、イベント間で数ミリ秒遅延する', async t => {
  const cyrano = new Cyrano;
  const begin = Date.now();

  t.is(
    await cyrano
      .delay(50)
      .fn(() => `foo`)
      .delay(100)
      .fn((prevValue) => `${prevValue}bar`)
      .delay(200)
      .fn((prevValue) => `${prevValue}baz`)
    , 'foobarbaz'
  );
  t.true(
    Date.now() - begin > 350
  );
});

test('繰り返すキューを終了する', async t => {
  const cyrano = new Cyrano;

  t.is(
    await cyrano
      .loop(function () {
        return this.loopEnd(1);
      })
    , 1
  );
});
test('繰り返すキューを終了する（子キュー経由）', async t => {
  const cyrano = new Cyrano;

  t.is(
    await cyrano
      .loop(function () {
        return this.fn(function () {
          return this.loopEnd(1);
        });
      })
    , 1
  );
});
test('キューは繰り返され、値を伝達する', async t => {
  const cyrano = new Cyrano;

  t.is(
    await cyrano
      .loop(function () {
        return this.
          fn(function (i = 0) {
            if (i > 10) {
              return this.loopEnd(i);
            }
            return i + 1;
          });
      })
    , 11
  );
});

test('loop内でキューを返さなければエラーである', async t => {
  const cyrano = new Cyrano;

  t.deepEqual(
    await cyrano
      .loop(() => new Error('bad argument'))
    , new Error('illegal callback')
  );
});

test('Cyranoクラスを継承し、新しいイベントを定義する', async t => {
  const manager = new EventManager({
    events: {
      foo() {
        return 'foo';
      },
      bar(prevValue) {
        return `${prevValue}bar`;
      },
      baz(prevValue) {
        return this
          .delay(1000)
          .fn(() => `${prevValue}baz`);
      },
    },
  });

  t.is(
    await manager
      .loadEvent('foo')
      .loadEvent('bar')
      .loadEvent('baz')
    , 'foobarbaz'
  );
});
