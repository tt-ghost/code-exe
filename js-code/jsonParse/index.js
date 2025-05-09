/* JSON.parse */
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
