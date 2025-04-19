> 平时在开发过程中，很多原生方法使用频次非常高，但常常忽略其内部是如何运作的，最近就在整理一些常用API或工具的手动实现，通过亲自上手实现一遍加深理解。前面两篇有介绍[JSON.stringify](https://blog.csdn.net/m0_47221837/article/details/147282029) 和 [JSON.parse](https://blog.csdn.net/m0_47221837/article/details/147310847) 的实现，感兴趣小伙伴可以翻阅。今天的主角是 `Promise`。

如果对Promise使用不是太了解的推荐看下[MDN Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise) 的使用方法。

完整示例代码已整理在此查看 [js-code/MyPromise](https://github.com/tt-ghost/code-exe/blob/master/js-code/MyPromise/index.js)。以下正文开始：


## 1 状态关系

![OjeILBAx_promise.png](https://cdn.fe1024.com/webstatic/zhuji/userspace/dev/fMCFLEbL_pppp.png)

1. **Pending（待定）**  
   - **初始状态**：Promise 对象刚创建时的默认状态，表示异步操作尚未完成。
   - **特点**：此时未调用 `resolve()` 或 `reject()`，结果未定。

2. **Fulfilled（已兑现）**  
   - **触发条件**：通过调用 `resolve(value)` 转换至此状态，表示异步操作成功完成。
   - **特点**：状态不可逆（一旦变为 `fulfilled` 则永久保持），并通过 `.then()` 传递结果值。

3. **Rejected（已拒绝）**  
   - **触发条件**：通过调用 `reject(reason)` 或抛出异常（如 `throw`）转换至此状态，表示操作失败。
   - **特点**：状态不可逆，通过 `.catch()` 或 `.then()` 的第二个参数捕获错误原因。

**状态转换规则**：  
- 仅允许从 `pending` → `fulfilled` 或 `pending` → `rejected`。
- 一旦状态改变（非 `pending`），后续调用 `resolve()` 或 `reject()` 无效。


## 2 实现部分

### 2.1 类方法

类方法主要有：`then`、`catch`和`finally`。还有比较重要的构造函数。

#### 2.1.1. 构造函数与状态管理

主要维护状态、成功失败回到队列以及调用执行器（`executor`）

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';  // 初始状态
    this.value = undefined;  // 成功值或失败原因
    this.onFulfilledCallbacks = [];  // 成功回调队列
    this.onRejectedCallbacks = [];   // 失败回调队列

    const resolve = (value) => {
      if (this.state !== 'pending') return;  // 状态不可逆
      this.state = 'fulfilled';
      this.value = value;
      this.onFulfilledCallbacks.forEach(fn => fn());  // 异步执行回调
    };

    const reject = (reason) => {
      if (this.state !== 'pending') return;
      this.state = 'rejected';
      this.value = reason;
      this.onRejectedCallbacks.forEach(fn => fn());  // 异步执行回调
    };

    try {
      executor(resolve, reject);  // 立即执行执行器函数
    } catch (err) {
      reject(err);  // 捕获同步错误（如抛出异常）
    }
  }
}
```

#### 2.1.2 `then` 方法

`then` 是 Promise 的核心方法，需要返回一个新Promise也即是 `new MyPromise`方便后续继续链式调用，同时执行`then`之前加入的成功和失败回调队列里的函数。这里通过`setTimeout`模拟异步执行过程。

```javascript
then(onFulfilled, onRejected) {
  // 处理非函数参数（实现值穿透）
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
  onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };

  const promise2 = new MyPromise((resolve, reject) => {
    const handleCallback = (callback, value) => {
      setTimeout(() => {  // 模拟微任务队列
        try {
          const result = callback(value);
          // 若返回值为 Promise，则等待其状态
          result instanceof MyPromise ? result.then(resolve, reject) : resolve(result);
        } catch (err) {
          reject(err);  // 捕获回调中的异常
        }
      }, 0);
    };

    if (this.state === 'fulfilled') {
      handleCallback(onFulfilled, this.value);
    } else if (this.state === 'rejected') {
      handleCallback(onRejected, this.value);
    } else {  // pending 状态时，将回调加入队列
      this.onFulfilledCallbacks.push(() => handleCallback(onFulfilled, this.value));
      this.onRejectedCallbacks.push(() => handleCallback(onRejected, this.value));
    }
  });

  return promise2;  // 返回新 Promise 以支持链式调用
}
```

#### 2.1.3. `catch` 方法

```javascript
catch(onRejected) {
  // 本质是调用then方法，第一个参数传null，第二个参数传错误处理函数
  return this.then(null, onRejected);
}
```

catch 本质是 `then` 方法的特例化调用，仅处理拒绝状态（onRejected 回调）。通过 `this.then(null, onRejected)` 实现等价效果，这与 ES6 Promise 规范完全一致。

- **链式调用支持**

因为 then 方法本身返回新 Promise 对象，catch 继承了这个特性，支持继续链式调用其他方法

```javascript
new MyPromise((_, reject) => reject('error'))
  .catch(err => console.log(err))  // 输出 "error"
  .then(() => console.log('继续执行'));
```

- **错误冒泡机制**

未捕获的异常会沿着 Promise 链向下传递，直到遇到第一个 catch 或带有 onRejected 的 then 方法

```javascript
new MyPromise((resolve, reject) => {
  throw new Error('错误')
})
.then(res => console.log('不会执行'))
.catch(e => console.log(e.message)); // 捕获并输出"错误"
```

- **与 `then` 的协同工作**

```javascript
new MyPromise((resolve, reject) => reject('error1'))
  .catch(err => { throw 'error2' })  // 修改错误信息
  .catch(err => console.log(err));   // 输出 "error2"
```

```javascript
new MyPromise((resolve, reject) => {
  throw new Error('错误')
})
.then(res => console.log('不会执行'))
.catch(e => console.log(e.message)); // 捕获并输出"错误"
```


#### 2.1.4. `finally` 方法

```javascript
finally(onFinally) {
  return this.then(
    value => MyPromise.resolve(onFinally()).then(() => value),
    reason => MyPromise.resolve(onFinally()).then(() => { throw reason })
  );
}
```

- **统一执行回调**：通过 `then` 方法同时处理 `fulfilled` 和 `rejected` 状态，确保无论原始 Promise 成功还是失败，`onFinally` 回调都会执行。这是通过为 `then` 方法同时传递 `onFulfilled` 和 `onRejected` 处理函数实现的。

- **结果保持机制**：在回调执行后通过 `.then(() => value)` 或 `() => { throw reason }` 保留原始结果，确保成功时返回原值 value，失败时重新抛出原错误

```javascript
MyPromise.resolve(42)
.finally(() => console.log('Cleanup'))
.then(v => console.log(v)); // 输出 42
```

- **异步执行保障**：使用 `MyPromise.resolve(onFinally())` 实现：
  - 自动将同步回调转换为 `Promise` 链
  - 支持 `onFinally` 返回 `Promise` 的异步场景
  - 确保回调在微任务队列执行（符合规范）

```javascript
new MyPromise(resolve => resolve(1))
  .finally(() => new MyPromise(r => setTimeout(r, 100)))
  .then(console.log); // 1秒后输出1
```

- **错误传播机制**：若 onFinally 抛出异常或返回 rejected Promise，会中断结果传递：

```javascript
new MyPromise(resolve => resolve(1))
  .finally(() => { throw 'finally error' })
  .catch(e => console.log(e)); // 输出 "finally error"
```

### 2.2.静态方法

静态方法主要有：`resolve`、`reject`、`all`、`any`、`race`、`try`(ES2025新增)

#### 2.2.1 `MyPromise.resolve` 方法

> Promise.resolve() 静态方法以给定值“解决（resolve）”一个 Promise。如果该值本身就是一个 Promise，那么该 Promise 将被返回；如果该值是一个 thenable 对象，Promise.resolve() 将调用其 then() 方法及其两个回调函数；否则，返回的 Promise 将会以该值兑现。（**MDN**关于[Promise.resolve](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)介绍）

```javascript
static resolve(value) {
  if (value instanceof MyPromise) return value;
  return new MyPromise(resolve => resolve(value));
}
```

#### 2.2.2 `MyPromise.reject` 方法

> Promise.reject() 静态方法返回一个已拒绝（rejected）的 Promise 对象，拒绝原因为给定的参数。（**MDN**关于[Promise.reject](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject)介绍）

```javascript
static reject(reason) {
  return new MyPromise((_, reject) => reject(reason));
}
```


#### 2.2.3 `MyPromise.all` 方法

> Promise.all() 静态方法接受一个 Promise 可迭代对象作为输入，并返回一个 Promise。当所有输入的 Promise 都被兑现时，返回的 Promise 也将被兑现（即使传入的是一个空的可迭代对象），并返回一个包含所有兑现值的数组。如果输入的任何 Promise 被拒绝，则返回的 Promise 将被拒绝，并带有第一个被拒绝的原因。（**MDN**关于[Promise.all](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)介绍）

```javascript
static all(promises) {
  return new MyPromise((resolve, reject) => {
    const result = [];
    let count = 0;
    
    const processResult = (i, value) => {
      result[i] = value;
      if (++count === promises.length) resolve(result);
    };

    promises.forEach((p, i) => {
      MyPromise.resolve(p).then(
        value => processResult(i, value),
        reason => reject(reason)
      );
    });
  });
}
```

#### 2.2.4 `MyPromise.any` 方法

> Promise.any() 静态方法将一个 Promise 可迭代对象作为输入，并返回一个 Promise。当输入的任何一个 Promise 兑现时，这个返回的 Promise 将会兑现，并返回第一个兑现的值。当所有输入 Promise 都被拒绝（包括传递了空的可迭代对象）时，它会以一个包含拒绝原因数组的 AggregateError 拒绝。（**MDN**关于[Promise.any](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)介绍）

```javascript
static any(promises) {
  return new MyPromise((resolve, reject) => {
    const errors = [];
    let count = 0;
    
    promises.forEach((p, i) => {
      MyPromise.resolve(p).then(
        value => resolve(value),
        reason => {
          errors[i] = reason;
          if (++count === promises.length) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        }
      );
    });
  });
}
```

#### 2.2.5 `MyPromise.race` 方法

> Promise.race() 静态方法接受一个 promise 可迭代对象作为输入，并返回一个 Promise。这个返回的 promise 会随着第一个 promise 的敲定而敲定。（**MDN**关于[Promise.race](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)介绍）

```javascript
static race(promises) {
  return new MyPromise((resolve, reject) => {
    promises.forEach(p => {
      MyPromise.resolve(p).then(resolve, reject);
    });
  });
}
```

#### 2.2.6 `MyPromise.try` 方法

> Promise.try() 静态方法接受一个任意类型的回调函数（无论其是同步或异步，返回结果或抛出异常），并将其结果封装成一个 Promise。（**MDN**关于[Promise.try](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/try)介绍）

`try()` 是 ES2025 规范中新增的重要特性，其核心目标是统一处理同步和异步函数的执行流程，同时自动捕获异常。

1. **包装函数执行**
无论传入的函数 func 是同步还是异步，Promise.try() 会立即执行该函数。

2. **状态处理**：
- **同步返回值**：如果 func 同步返回非 Promise 值，直接创建一个 `fulfilled` 状态的 Promise，并将返回值作为结果。
- **同步抛出错误**：如果 func 同步抛出异常，则创建一个 `rejected` 状态的 Promise，并将错误对象作为拒绝原因。
- **返回 Promise 对象**：如果 func 返回一个 Promise，则直接沿用该 Promise 的状态和结果。

3. **兼容性处理**：支持传入参数（arg1, arg2...），并自动传递到 `func` 中执行，如果`func`定义时本身有参数会被传入的`（arg1, arg2...）`替代，不会合并。


```javascript
static try(func, ...args) {
  return new MyPromise((resolve, reject) => {
    try {
      const result = func(...args);
      if (result instanceof Promise) {
        result.then(resolve, reject);
      } else {
        resolve(result);
      }
    } catch (error) {
      reject(error);
    }
  });
}
```

### 2.3 关键特性支持

- **链式调用**：每个 `then` 返回新 Promise，其状态由回调结果决定。
- **异步执行**：通过 `setTimeout` 模拟微任务，确保回调在事件循环后执行。
- **错误处理**：执行器或回调中的异常均会触发 `reject`。


## 3 总结

1. **状态不可逆**：若多次调用 `resolve()` 或 `reject()`，仅第一次生效。
2. **异步机制**：回调函数需异步执行。
3. **值穿透**：若 `then` 的参数非函数，需将值传递给下一个 Promise。

以上便是手动实现Promise的完整内容，可以发现其实没有什么特别神秘的地方，只是在实现的时候需要清楚[Promises/A+
](https://promisesaplus.com.cn/)规范，核心是构造函数和`then`方法，希望对你有所帮助，欢迎交流。
