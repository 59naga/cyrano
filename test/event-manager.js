import Cyrano from '../src';

export default class EventManager extends Cyrano {
  /**
  * コンストラクタで定義したイベント群から、イベントを実行する
  *
  * @public
  * @method EventManager#loadEvent
  * @param {string|function} id - 実行するイベント名
  * @returns this
  */
  loadEvent(id) {
    const eventManager = new this.constructor(this.getProperties());

    return this.push((prevValue) => {
      let getId;
      if (typeof id === 'function') {
        getId = Promise.resolve(prevValue).then(id);
      } else {
        getId = Promise.resolve(id);
      }

      return getId.then((eventId) => (
        new Promise((resolve, reject) => {
          const scene = this.events[eventId];
          if (scene === null) {
            return reject();
          }

          const event = scene.call(eventManager, prevValue);
          if (event.then) {
            event.then((nextValue) => {
              resolve(nextValue);
            });
          } else {
            resolve(event);
          }
        })
      ));
    });
  }
}
