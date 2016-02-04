import Promise from 'bluebird';

// FIXME: translate to english description

/**
* 環境変数DEBUGが"cyrano"ならデバッグ出力する
*
* @private
*/
const debug = (...args) => {
  const keyword = process.env.DEBUG || '';
  if (keyword.match && keyword.match(/^cyrano/)) {
    console.info(...args);
  }
};

/**
* インスタンスは「待ち行列（`_queue`/キュー）」を一つだけ持つ。
*
* @class Cyrano
*/
export default class Cyrano {
  /**
  * 第一引数はインスタンスのプロパティとして扱う
  * このクラスを継承し、新しいメソッドを追加する場合は、`.fn`メソッドの記法に従うこと
  * （つまり、必ずpushの中でPromiseを返すこと）
  * この文法に従う限り、メソッドチェインできる
  *
  * @constructor
  * @param {object={}} properties - インスタンスのプロパティを定義する
  * @returns this
  */
  constructor(properties = {}) {
    Object.defineProperty(this, 'properties', {
      value: properties,
    });

    for (const key in properties) {
      if (properties.hasOwnProperty(key) === false) {
        continue;
      }
      Object.defineProperty(this, key, {
        value: properties[key],
        enumerable: true,
      });
    }

    /**
    * @property {promise} _queue - インスタンスが管理する待ち行列
    */
    Object.defineProperty(this, '_queue', {
      value: Promise.resolve(),
      writable: true,
    });
  }

  /**
  * キューにイベントを追加する
  *
  * @protected
  * @method Cyrano#push
  * @param {function} [callback] キューが解消した時のイベント
  * @returns this
  */
  push(callback) {
    this._queue = this._queue.then(callback);

    return this;
  }

  /**
  * 現在のキューの完了処理を登録する
  *
  * @protected
  * @method Cyrano#then
  * @param {function} [callback] キューが完了した時のイベント
  * @returns promise
  */
  then(callback) {
    return this._queue.then(callback);
  }

  /**
  * 現在のキューの例外処理を登録する
  *
  * @protected
  * @method Cyrano#catch
  * @param {function} [callback] キューが例外を起こした時のイベント
  * @returns promise
  */
  catch(callback) {
    return this._queue.catch(callback);
  }

  /**
  * コンストラクタで定義したプロパティを返す
  *
  * @public
  * @method Cyrano#getProperties
  * @returns {object} this.properties
  */
  getProperties() {
    return this.properties;
  }

  /**
  * キューを一時停止する。
  * 前イベントから値が渡された場合、次のイベントに渡す
  *
  * @public
  * @method Cyrano#delay
  * @param {number} [msec] 停止する時間（ミリ秒）
  * @returns this
  */
  delay(msec = 1000) {
    return this.push((value) => (
      new Promise((resolve) => {
        debug('cyrano:delay', 'start', msec);
        setTimeout(() => {
          debug('cyrano:delay', 'end', msec);

          resolve(value);
        }, msec);
      })
    ));
  }

  /**
  * 子キューを作成し、イベントのthisへ与える
  * イベント内のthisに対しメソッドチェインを行うと、新しいイベント群を作成できる
  * `test/index.js`の`.fn`実行例を参照
  *
  * @public
  * @method Cyrano#fn
  * @param {function} callback 待ち行列に追加する関数
  * @returns this
  */
  fn(callback) {
    const cyrano = new this.constructor(this.getProperties());

    return this.push((prevValue) => {
      debug('cyrano:fn', 'start', prevValue);

      const event = callback.call(cyrano, prevValue);
      const promise = event && event.then ? event : Promise.resolve(event);

      return promise
      .then((nextValue) => {
        debug('cyrano:fn', 'end', prevValue);
        return nextValue;
      })
      .catch((nextValue) => {
        debug('cyrano:fn', 'end(reject)', prevValue);
        return Promise.reject(nextValue);
      });
    });
  }

  /**
  * 子キューを作成し、`.loopEnd`が呼ばれるまでイベントを実行し続ける
  * `test/index.js`の`.loop`実行例を参照
  *
  * @public
  * @method Cyrano#loop
  * @param {function} [callback] ループさせるイベント
  * @returns this
  */
  loop(callback) {
    const cyrano = new this.constructor(this.getProperties());

    return this.push((initialValue) => {
      const loop = (prevValue) => {
        const event = callback.call(cyrano, prevValue);
        if (event.then === undefined) {
          return Promise.reject(new Error('unexpection return value'));
        }

        return event
        .then((nextValue) => {
          debug('cyrano:loop', 'continue', initialValue, prevValue);
          return loop(nextValue);
        });
      };

      debug('cyrano:loop', 'start', initialValue);
      return loop(initialValue)
      .catch((nextValue) => {
        debug('cyrano:loop', 'end', initialValue);
        return nextValue;
      });
    });
  }

  /**
  * 親`.loop`を終了する（次の`.catch`まで`_queue`を進める）
  * `test/index.js`の`.loop`実行例を参照
  *
  * @public
  * @method Cyrano#loopEnd
  * @param {function} [defaultValue] 前イベントの値がない場合の初期値
  * @returns this
  */
  loopEnd(defaultValue) {
    return this.push((prevValue = defaultValue) => {
      debug('cyrano:loopEnd', prevValue, defaultValue);
      return Promise.reject(prevValue);
    });
  }
}
