Parallel.js
==============

#### Parallel Computing with Javascript

Parallel.js は、 Javascript でマルチコア処理のための小さなライブラリです。熟成してきた web-workers API の進歩を十分得られることを目的として開発されました。疑うことなく Javascript は高速ですが、1シングルスレッドの計算モデルであるために、他の言語が持つような並列計算能力に欠けています。コア自身の速さよりも CPU のコア数を増大させている現状で、イカした並列処理の優位性を得られていないことは恥ずかしくないでしょうか？


Parallel.js によって、 web workers を利用した高度なマルチコア処理を提供することでこれらの問題を解決出来ます。(web workers をサポートしてさえいれば) お使いのブラウザでも動作します！お試しください。

# Usage

プロジェクト内に次のようにして parallel.js を含めてください。

```html
<script src="underscore.js"></script>
<script src="parallel.js"></script>
```

`Parallel` というグローバル変数が利用できるようになります。

Parallel は node でも利用することができます。

```
$ npm install parallel.js
```

```javascript
var Parallel = require('parallel.js');
```

## Parallel.spawn

`spawn` は関数と引数のリストをとり、渡した関数の結果を計算する worker thread を生成します。 `spawn` は2つの引数を取ります。1つの関数と引数で、 JSON.stringify によってあらゆる値が可能です。 Numbers, booleans, and objects/arrays が動作します。 本質的には渡した関数の結果のポインタであるしかし異なるプロセッサ上の `RemoteReference` を spawn は返却します。

### Examples

小さなケースとして、 数の平方根を返してみましょう。

```javascript
// Need to do it like this to avoid premature browser compilation of Math.sqrt
var sqrt = function (n) { return Math.sqrt(n); };

// Spawn a RemoteReference
var r = Parallel.spawn(sqrt, 100);
 
// Fetch the remote reference and log the result when it's complete
r.fetch(function (result) {
    console.log(result);
});
```

この例では、 100 の平方根が別のコア上に生成された worker で処理されます。その後、 "fetch" によってこの計算結果を取得します。 `fetch` を呼び出した時にまだ結果が返っていないこともあるので (長い計算処理を想像してください) 、ジョブが完了した時に計算結果を受け取るためのコールバックを渡します。コールバックが渡されないで fetch が呼び出された時には、もし結果があればその値を返し、そうでない場合には `undefined` を返します。

長い処理時間のジョブを生成した場合を考えてみましょうか？

```javascript
var slowSquare = function (n) { 
    var i = 0; 
    while (++i < n * n) {}
    return i; 
};
 
// Spawn a remote reference
var r = Parallel.spawn(slowSquare, 100000);
 
// Call back when done
r.fetch(yourCallBack);
```

## Parallel.mapreduce

データを chunks に分割し、任意の数の workers をまたいで一つの操作を分散させたい場合には、 `mapreduce` を使うべきです。 chunks の数によっていくつの wokers を生成するかを決定することができます。大雑把にいえば、コア数だけ chunks を渡してください。コアの数だけ複数スレッドを受け入れられることを覚えておいてください。この場合で言えば、コア数ごと x スレッド数ごとに増やして、多くの chunks を渡すことができます。この関数は、生成された Remote Reference を参照する DistributedProcess を返却します。

`mapreduce` は3つの必須引数と1つのオプション引数を取ります。

- mapper: データの chunk をリモートで実行する関数
- reducer: それぞれの chunk の結果を結合するために利用される関数
- chunks: 処理対象のデータ。各々のコアに対して chunk が渡されます。
- callback(optional): すべてのコアが応答した時に発火するオプション関数。この関数はパラメタとして reduce された結果を受けます。

### Examples

平方根の例を試してみましょう。

```javascript
// Our mapper (need to formulate it like this to avoid the browser compiling Math.sqrt to native code)
var sqrt = function (n) { return Math.sqrt(n); };
 
// Our reducer
var add = function (a, b) { return a + b; };
 
// Get the square root of each number and sum them together
var d = Parallel.mapreduce(sqrt, add, [100, 200, 400, 600, 800]);
 
// Fetch the distributed process and get the reduced value when complete
d.fetch(function (result) {
    console.log(result);
});
```

ここでしていることは、 map と reduce 関数を定義しています。そして、それらを `mapreduce` 関数に chunk のリストと共に渡しています。各々の chunks は sqrt に引数として渡されます。 mapper に複数の引数を渡すためには、 chunk を配列にしてください。

一度、処理を送り出すと、 `DistributedProcess` というオブジェクト d を得ることができます。 d は mapper 、 reducer 、 chunks の参照と、利用された remote reference の配列を保持しています。

最後に、 `DistributedProcess` の fetch を呼び出し、 reduce された値を得ることができます。即座に応答がない場合には、処理が完了した時に呼び出されるコールバック関数を渡してください。

では、長い処理を試してみましょう。

```javascript
// Our mapper
var slowSquare = function (n) { 
    var i = 0; 
    while (++i < n * n) {}
    return i; 
};
 
// Our reducer
var add = function (a, b) { return a + b; };
 
// Get the square root of each number and sum them together
var d = Parallel.mapreduce(slowSquare, add, [10000, 20000, 40000, 60000, 80000]);
 
// Fetch the distributed process and get the reduced value when complete
d.fetch(yourCallback);
```

## Parallel.require

worker 間で状態を共有するために、 `require` を用いることができます。 Require は、 worker threads にライブラリや関数群をインポートするために利用します。

`require` は任意の長さの引数を取り、関数でも文字列でも構いません。引数が関数の場合には、文字列にコンバートして worker に渡されます。

**重要:** もし、関数を `require` に渡す場合には、 *名前付き関数* でなければなりません。無名関数では動作しません。

### Example:

```javascript
var wontWork = function (n) { return n * n; };

function worksGreat(n) { return n * n };

Parallel.require(wontWork);

var r = Parallel.spawn(function (a) { return 2 * wontWork(a); }, 3);  // throws an error

Parallel.require(worksGreat);

var r = Parallel.spawn(function (a) { return 2 * worksGreat(a); }, 3); // returns 18 
```

### Passing files as arguments to require

`require` は必須のファイルを受けることもできます。これらは文字列として渡されます。文字列はファイルの url でも **絶対** path でも構いません。

### Examples

<dl>
    <dt>Absolute url:</dt>
    <dd>`Parallel.require('http://mydomain.com/js/script.js')`</dd>

    <dt>Absolute path (assuming my document lives in http://mydomain.com/index.html)</dt>
    <dd>`Parallel.require('js/script.js')`</dd>

    <dt>Does not work (yet)</dt>
    <dd>`Parallel.require('../js/script.js')`</dd>
</dl>

**重要:** ブラウザのセキュリティ制限がファイルプロトコルを超えるファイルのロードを制限します。したがって、ローカルファイルをロードするためには http server を起動する必要があるでしょう。

個人的には、 npm package [http-server](https://github.com/nodeapps/http-server) が好きです。これはインストールと軌道が非常に簡単です。

```
$ npm install http-server -g
$ cd myproject
$ http-server .
```   

## RemoteReference

他のプロセッサの値を指し示す以外は、リモートの参照先のポインタとして考えてください。 RemoteReference は spawn の呼び出しごとに返却されるか、または、 `DistributedProcess` ごとの "refs" にリストとして含まれれます。

RemoteReference のメソッドとプロパティ:

- fetch: 計算結果を取り出すために使われます。 RemoteReference.prototype.data の値を返すか、まだ利用できない場合には undefined を返却します。コールバック関数が指定されている場合は、 RemoteReference.prototype.data が値を持つまで待って、その後その値を伴ってコールバック関数を呼び出します。
- data: 生の計算結果です。計算が完了するまでは undefined です。
- terminate: 現在の worker を終了させます。
- onWorkerMsg: 処理が完了したときに呼び出される内部関数です。それぞれの振舞いごとにオーバーロードされます。


## DistributedProcess

mapreduce ジョブに対応する分散プロセスです。個々の track を保持するすべての remote reference への参照を持っています。結果を取得するためのメソッドが実装されています。

DistributedProcess のメソッドとプロパティ:

- fetch: 計算結果を取り出すために使われます。 RemoteReference.prototype.data の値を返すか、まだ利用できない場合には undefined を返却します。コールバック関数が指定されている場合は、 RemoteReference.prototype.data が値を持つまで待って、その後その値を伴ってコールバック関数を呼び出します。
- fetchRefs: ここの RemoteReference を取り出し、その結果の配列を返却します。オプションで、 RemoteReference の fetch メソッドにコールバック関数を渡すことができます。
- terminate: オプション引数 n によって指定された worker を終了させます。 n は整数でなければなりません。もし、 n が渡されなければ、すべての worker が終了されます。
- onWorkerMsg: 処理が完了したときに呼び出される内部関数です。それぞれの振舞いごとにオーバーロードされます。

## License

BSD
