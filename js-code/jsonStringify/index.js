/* JSON 序列化 */
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

/* 验证 */
// const obj = {
//   date: new Date(),
//   regex: /test/g,
//   fn: () => {},
//   arr: [1, undefined, { self: null }],
//   circular: {}
// };
// obj.circular.self = obj;

// console.log(jsonStringify(obj)); // 抛出循环引用错误
// console.log(jsonStringify({ a: 1, b: Symbol() })); // {"a":1}
// console.log(jsonStringify({ a: 1, _b: 2} , (k, v) => {
//   if(k[0]=== '_'){
//     return undefined
//   } else {
//     return v
//   }
// })); // {"a":1}
