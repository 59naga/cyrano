Cyrano
---

<p align="right">
  <a href="https://npmjs.org/package/cyrano">
    <img src="https://img.shields.io/npm/v/cyrano.svg?style=flat-square">
  </a>
  <a href="https://travis-ci.org/59naga/cyrano">
    <img src="http://img.shields.io/travis/59naga/cyrano.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/59naga/cyrano/coverage">
    <img src="https://img.shields.io/codeclimate/github/59naga/cyrano.svg?style=flat-square">
  </a>
  <a href="https://codeclimate.com/github/59naga/cyrano">
    <img src="https://img.shields.io/codeclimate/coverage/github/59naga/cyrano.svg?style=flat-square">
  </a>
</p>

> メソッドチェイン式のイベント管理クラス

Installation
---

```bash
npm install cyrano --save
```

Usage
---

ゲームのシナリオをプログラムで表現するのは困難です。
このライブラリは、非同期処理を柔軟に解決できる[Promise](http://azu.github.io/promises-book/#chapter1-what-is-promise)をベースに、メソッドチェインでロジックを表現することを目的としています。

```js
var EventManager= require('cyrano')
var eventManager= new EventManager()
eventManager
  .fn(function(){
    console.log('1')
  })
  .fn(function(){
    console.log('2')
  })
  .fn(function(){
    console.log('3')
  })
```

上記と下記はほとんど同じ結果です。

```js
Promise.resolve()
  .then(function(){
    console.log('1')
  })
  .then(function(){
    console.log('2')
  })
  .then(function(){
    console.log('3')
  })
```

API
---

プログラムのコメントも日本語で表記しているので、[詳細は直接参照してください](./src/index.js)。

## class EventManager(`properties`) -> `eventManager`

インスタンスは待ち行列（キュー）を一つだけ持ちます。
コンストラクタに第一引数としてオブジェクトを渡すと、インスタンスのプロパティとして定義します。

## `.getProperties` -> `properties`

定義したプロパティを返します。

## `.delay(msec=1000)` -> this

次のイベントの実行をミリ秒遅らせます。

## `.fn(callback)` -> this

子キューを作成し、イベント群を定義します。

## `.loop(callback)` -> this

子キューを作成し、イベント群を実行し続けます。

## `.loopEnd` -> this

実行し続けているイベント群を中断します（`.loop`を抜けます）。

Example
---

下記の例では、「helloworld」を１文字ずつ印字し、最後に少し待ってから「done」を出力します。

```js
var EventManager= require('cyrano')

var message= 'helloworld'
var eventManager= new EventManager()

eventManager
  .loop(function(i){
    if(i===undefined){
      i= 0
    }
    if(message[i]===undefined){
      return this.loopEnd()
    }
    
    return this
      .delay(1000 - i*100)
      .fn(function(){
        console.log(message[i++])
        return i
      })
  })
  .delay(500)
  .then(function(){
    console.log('done')
  })
```

```bash
node example.js
# h
# e
# l
# l
# o
# w
# o
# r
# l
# d
# done
```

その他、`test/index.js`内にコード例が幾つかあります。参考にしてください。

Test
---
```bash
git clone https://github.com/59naga/cyrano.git
cd cyrano

npm install
npm test
# or ...
DEBUG=cyrano npm test
```

License
---
[MIT](http://59naga.mit-license.org/)