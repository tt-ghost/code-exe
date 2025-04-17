> 上篇介绍了[JSON.stringify](https://blog.csdn.net/m0_47221837/article/details/147282029)的实现，本篇就反向解析做一实现。想完整实现`JSON.parse` 方法，需要理解 JSON 语法规范，还需要处理复杂的嵌套结构、数据类型，潜在异常也不容忽视。以下是主要实现逻辑及关键点（欢迎学习交流）：


## 一、核心逻辑


#### 1. **词法分析**

- **跳过空白字符**：JSON 允许在值之间插入空格、换行等，需先过滤这些字符，方便后续遍历。
- **识别基本数据类型**：根据首字符判断值类型（如 `{` 表示对象，`[` 表示数组，`"` 表示字符串，`t`/`f` 表示布尔值，`n` 表示 `null`，数字直接解析）。

```javascript
function parseValue() {
  // 遇到连续空格或换行符等，删除并向前移动指针
  
  const char = currentChar();
  // 根据当前字符值分别解析，通过移动指针及相应结束符遍历
  switch (char) {
    case '{': return parseObject();
    case '[': return parseArray();
    case '"': return parseString();
    // 这里对布尔及null之仅做首字母解析
    // 在 parseKeyword 方法中识别及向前处理
    case 't': return parseKeyword('true', true);
    case 'f': return parseKeyword('false', false);
    case 'n': return parseKeyword('null', null);
    default: return parseNumber();
  }
}
```

#### 2. **递归解析嵌套结构**

> 匹配开始（`{`、`[`）符以及结束符（`}`、`]`），匹配到结束符以前递归调用 `parseValue`，并移动指针

- **对象解析**：逐对解析键值，递归处理值部分。

```javascript
function parseObject() {
  const obj = {};
  // 开始
  expect('{');
  while (currentChar() !== '}') {
    const key = parseString();
    expect(':');
    skipWhitespace();
    const value = parseValue(); // 递归解析嵌套值
    obj[key] = value;
    // 移动指针，',' 之后可能有空格或换行
    if (currentChar() === ',') {
      nextChar();
      skipWhitespace();
    }
  }
  // 结束
  expect('}');
  return obj;
}
```
- **数组解析**：逐个解析元素，递归处理每个元素。
```javascript
function parseArray() {
  const arr = [];
  expect('[');
  while (currentChar() !== ']') {
    // 递归解析嵌套值，去除元素之间的空格
    skipWhitespace();
    arr.push(parseValue());
    skipWhitespace();
    // 移动指针，',' 之后可能有空格或换行
    if (currentChar() === ',') {
      nextChar();
      skipWhitespace();
    }
  }
  expect(']');
  return arr;
}
```


## 二、关键数据类型的处理

#### 1. **字符串解析**

- **处理转义字符**：识别 `\"`、`\\`、`\/`、`\b`、`\f`、`\n`、`\r`、`\t` 等转义序列。

```javascript
function parseString() {
  let str = '';
  expect('"');
  while (currentChar() !== '"') {
    if (currentChar() === '\\') {
      str += parseEscapeSequence(); // 处理转义字符
    } else {
      str += nextChar();
    }
  }
  expect('"');
  return str;
}
```

#### 2. **数字解析**

- **支持整数、浮点数、科学计数法**：通过正则表达式或逐字符判断。
```javascript
function parseNumber() {
  let numberStr = '';
  while (/[0-9.eE+-]/.test(currentChar())) {
    numberStr += nextChar();
  }
  return parseFloat(numberStr);
}
```

#### 3. **特殊关键字处理**

- **布尔值与 `null`**：严格匹配 `true`、`false`、`null` 字符串。

```javascript
function parseKeyword(keyword, value) {
  for (let i = 0; i < keyword.length; i++) {
    if (nextChar() !== keyword[i]) throw new SyntaxError();
  }
  return value;
}
```


## 三、语法及异常处理

#### 1. **语法校验**

- **符号匹配**：确保括号、引号成对出现（如 `{` 必须有对应的 `}`）。
- **逗号分隔符**：数组或对象中元素需用逗号分隔，但末尾不能有多余逗号。

```javascript
function expect(expectedChar) {
  if (currentChar() !== expectedChar) {
    throw new SyntaxError(`Unexpected token ${currentChar()}`);
  }
  nextChar();
}
```

#### 2. **异常捕获**
- **抛出详细错误信息**：包括位置、上下文等，便于调试。
```javascript
try {
  const obj = myJSONParse(jsonString);
} catch (error) {
  console.error(`解析失败：位置 ${error.position}，错误信息：${error.message}`);
}
```


## 四、扩展功能实现

#### 1. **支持 `reviver` 函数**

- **深度优先遍历**：从最内层属性开始，依次向外应用 `reviver` 函数。
```javascript
function applyReviver(obj, reviver) {
  if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      const value = applyReviver(obj[key], reviver);
      const newValue = reviver.call(obj, key, value);
      if (newValue === undefined) {
        delete obj[key];
      } else {
        obj[key] = newValue;
      }
    }
  }
  const $key = Symbol('key')
  return reviver.call({[$key]: obj}, $key, obj);
}
```

#### 2. **处理循环引用（扩展）**

- **使用 `WeakMap` 跟踪对象**：检测到重复引用时抛出错误（需扩展 JSON 语法，非标准行为）。
```javascript
function parseObject(seen = new WeakMap()) {
  const obj = {};
  if (seen.has(obj)) throw new TypeError('Circular reference');
  seen.set(obj, true);
  // 解析属性时传递 seen
}
```


## 五、完整代码示例

```javascript
function jsonParse(jsonString, reviver) {
  let index = 0;
  const escapeMap = { 'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r', 't': '\t' };

  function currentChar() {
    return jsonString[index];
  }

  function nextChar() {
    return jsonString[index++];
  }

  function skipWhitespace() {
    while (/\s/.test(currentChar())) nextChar();
  }

  function parseValue() {
    skipWhitespace();
    const char = currentChar();
    switch (char) {
      case '{': return parseObject();
      case '[': return parseArray();
      case '"': return parseString();
      case 't': return parseKeyword('true', true);
      case 'f': return parseKeyword('false', false);
      case 'n': return parseKeyword('null', null);
      default: return parseNumber();
    }
  }

  function parseObject() {
    const obj = {};
    expect('{');
    while (currentChar() !== '}') {
      const key = parseString();
      expect(':');
      skipWhitespace();
      obj[key] = parseValue();
      if (currentChar() === ',') {
        nextChar();
        skipWhitespace();
      }
    }
    expect('}');
    return obj;
  }

  function parseArray() {
    const arr = [];
    expect('[');
    while (currentChar() !== ']') {
      skipWhitespace();
      arr.push(parseValue());
      skipWhitespace();
      if (currentChar() === ',') {
        nextChar();
        skipWhitespace();
      }
    }
    expect(']');
    return arr;
  }

  function parseString() {
    let str = '';
    expect('"');
    while (currentChar() !== '"') {
      if (currentChar() === '\\') {
        const escapeChar = nextChar();
        str += escapeMap[escapeChar] || escapeChar;
      } else {
        str += nextChar();
      }
    }
    expect('"');
    return str;
  }

  function parseKeyword(keyword, value) {
    for (let i = 0; i < keyword.length; i++) {
      if (nextChar() !== keyword[i]) throw new SyntaxError();
    }
    return value;
  }

  function parseNumber() {
    let numStr = '';
    while (/[0-9.eE+-]/.test(currentChar())) {
      numStr += nextChar();
    }
    return parseFloat(numStr);
  }

  function expect(expectedChar) {
    if (currentChar() !== expectedChar) {
      throw new SyntaxError(`Unexpected token ${currentChar()}`);
    }
    nextChar();
  }

  // 自定义扩展
  function applyReviver(obj, reviver) {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        const value = applyReviver(obj[key], reviver);
        const newValue = reviver.call(obj, key, value);
        if (newValue === undefined) {
          delete obj[key];
        } else {
          obj[key] = newValue;
        }
      }
    }
    const $key = Symbol('key')
    return reviver.call({[$key]: obj}, $key, obj);
  }

  const result = parseValue();
  return reviver ? applyReviver(result, reviver) : result;
}
```


## 六、测试与验证

```javascript
/* 测试1 */
const jsonStr = '{"name":"John","hobbies":["reading",{"type":"sports"}]}';
const obj = jsonParse(jsonStr);
console.log(obj.hobbies[1].type); // 输出 "sports"

/* 测试2 */
const reviver = (key, value) => {
  if (key[0] === '_') return undefined;
  return value;
};
/* 注意 "sports" 后有空格也可以 */
const jsonStr1 = '{"name":"John","_age":30,"hobbies":["reading",{"type":"sports", "_userType":"111"}]}';

console.log(jsonParse(jsonStr1, reviver));
/* 输出 */
// {"name":"John","hobbies":["reading",{"type":"sports"}]}
```


## 总结

实现 `JSON.parse` 的核心点包括：
1. **严格语法校验**：需完全兼容 JSON 标准，处理所有合法结构。
2. **递归与状态管理**：通过递归解析嵌套对象/数组，同时维护解析状态（如索引位置）。
3. **性能优化**：避免频繁字符串操作，使用索引追踪提升效率。
4. **扩展性设计**：支持 `reviver` 函数和自定义错误处理。

相比 [jsonStringify](https://blog.csdn.net/m0_47221837/article/details/147282029) 的实现，jsonParse 要复杂的多，主要是json字符串需要完全符合json规范。以上仅供学习参考，欢迎交流讨论。
