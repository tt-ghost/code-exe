要实现一个 `JSON.stringify` 方法，需综合考虑数据类型、循环引用、特殊对象处理等复杂场景。这里仅作为学习了解原理或定制逻辑使用：


## 一、核心逻辑

#### 1. **数据类型判断**

- **基本类型**：直接返回序列化结果（如 `string` 加引号，`number` 直接返回，`undefined`/`function`/`symbol` 过滤等）。
- **引用类型**：分为数组、对象、特殊对象（如 `Date`、`RegExp`），递归处理嵌套结构。

```javascript
function getType(value) {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'object') {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  }
  return type;
}
```

#### 2. **循环引用检测**

- 使用 `WeakSet` 跟踪已处理对象（临时引用类型存储这里推荐 `WeakSet`，`Set`虽然功能更全，本例用不到且容易内存泄漏），发现重复引用时抛出错误。

```javascript
const seen = new WeakSet()

function stringify(value, replacer) {
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      throw new TypeError('Circular reference detected');
    }
    seen.add(value);
  }
  // 后续递归处理...
}
```


## 二、特殊值处理

#### 1. **日期对象与正则表达式**

- `Date` 对象调用 `toJSON()` 转换为字符串。
- `RegExp` 或 `Error` 对象返回空对象 `{}`。

```javascript
switch (type) {
  case 'date':
    return `"${value.toJSON()}"`;
  case 'regexp':
  case 'error':
    return '{}';
}
```

#### 2. **包装对象与原始值**

- 处理 `new String()`、`new Number()` 等包装对象，提取原始值。

```javascript
if (type === 'string') return `"${value}"`; // 处理包装对象
if (type === 'number') return isNaN(value) ? 'null' : String(value);
```

#### 3. **特殊值**

- `NaN`/`Infinity` 转为 `null`，`undefined` 在对象中忽略，在数组中转为 `null`。

```javascript
if (typeof value === 'number') {
  return (isNaN(value) || value === Infinity) ? 'null' : String(value);
}
```


## 三、递归遍历策略

#### 1. **数组与对象遍历**

- **数组**：递归处理每个元素，生成逗号分隔的字符串。

```javascript
if (type === 'array') {
  const items = value.map(item => stringify(item, replacer));
  return `[${items.join(',')}]`;
}
```

- **对象**：与数组处理类似，对象需要过滤 `symbol` 键，应用 `replacer` 函数，生成键值对。

```javascript
if (type === 'object') {
  const entries = Object.entries(value)
    .filter(([key]) => typeof key !== 'symbol')
    .map(([key, val]) => {
      const processed = replacer ? replacer(key, val) : val;
      return `"${key}":${stringify(processed, replacer)}`;
    });
  return `{${entries.join(',')}}`;
}
```

#### 2. **`replacer` 参数处理**

- **数组过滤**：仅保留指定属性。
- **函数转换**：动态修改或过滤属性值。

```javascript
// 定制示例，以 _ 开头的属性不要
const replacer = (key, value) => {
  if (key[0] === '_') return undefined;
  return value;
};
```




## 四、完整代码示例

```javascript
function jsonStringify(value, replacer) {
  
  function getType(value) {
    if (value === null) return 'null';
    const type = typeof value;
    if (type === 'object') {
      return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
    }
    return type;
  }

  const seen = new WeakSet()

  function stringify(value, replacer) {
  
    const type = getType(value);
  
    // 处理循环引用
    if (type === 'object' || type === 'array') {
      if (seen.has(value)) throw new TypeError('Circular reference');
      seen.add(value);
    }
  
    // 处理自定义 toJSON 方法
    if (typeof value?.toJSON === 'function') {
      return stringify(value.toJSON(), replacer);
    }
  
    // 处理基本类型
    switch (type) {
      case 'string': return `"${value.replace(/"/g, '\\"')}"`;
      case 'number': return isNaN(value) || !isFinite(value) ? 'null' : value.toString();
      case 'boolean': return value ? 'true' : 'false';
      case 'null': return 'null';
      case 'undefined': return undefined;
      case 'function': return undefined;
      case 'symbol': return undefined;
    }
  
    // 处理特殊对象
    switch (type) {
      case 'date': return `"${value.toJSON()}"`;
      case 'regexp': return '{}';
    }
  
    // 处理数组和对象
    if (type === 'array') {
      const items = value.map(item => stringify(item, replacer));
      return `[${items.filter(x => x !== undefined).join(',')}]`;
    }
  
    if (type === 'object') {
      const entries = Object.entries(value)
        .filter(([k]) => typeof k !== 'symbol')
        .map(([k, v]) => {
          const processed = replacer ? replacer(k, v) : v;
          const str = stringify(processed, replacer);
          return str !== undefined ? `"${k}":${str}` : undefined;
        });
      return `{${entries.filter(x => x !== undefined).join(',')}}`;
    }
  
    return '{}';
  }

  return stringify(value, replacer)

}
```


## 五、验证

```javascript
const obj = {
  date: new Date(),
  regex: /test/g,
  fn: () => {},
  arr: [1, undefined, { self: null }],
  circular: {}
};
obj.circular.self = obj;

console.log(jsonStringify(obj)); // 抛出循环引用错误
console.log(jsonStringify({ a: 1, b: Symbol() })); // {"a":1}
console.log(jsonStringify({ a: 1, _b: 2} , (k, v) => {
  if(k[0]=== '_'){
    return undefined
  } else {
    return v
  }
})); // {"a":1}
```

## 整体思路

1. **递归遍历**：正确处理嵌套结构。
2. **类型判断**：覆盖所有 JavaScript 数据类型。
3. **特殊场景**：循环引用、自定义序列化、浏览器兼容性。
4. **性能优化**：避免重复计算，合理使用缓存（如 `WeakSet`）。

以上建议仅做学习及特殊处理时使用
