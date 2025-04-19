/*
 * 手动实现 Promise，仅供学习
 */
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

  catch(onRejected) {
    // 本质是调用then方法，第一个参数传null，第二个参数传错误处理函数
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      value => MyPromise.resolve(onFinally()).then(() => value),
      reason => MyPromise.resolve(onFinally()).then(() => { throw reason })
    );
  }


  // 静态方法
  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

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

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(p => {
        MyPromise.resolve(p).then(resolve, reject);
      });
    });
  }

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
}
