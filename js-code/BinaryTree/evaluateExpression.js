class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

function isOperator(char) {
  return char === '+' || char === '-' || char === '*' || char === '/';
}

function isFunction(name) {
  return name === 'sin' || name === 'cos' || name === 'tan';
}

function precedence(char) {
  if (char === '+' || char === '-') {
    return 1;
  }
  if (char === '*' || char === '/') {
    return 2;
  }
  return 0;
}

function buildExpressionTree(expression) {
  const stack = [];
  const output = [];

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (!isNaN(char)) {
      output.push(new Node(char));
    } else if (isOperator(char)) {
      while (
        stack.length &&
        isOperator(stack[stack.length - 1]) &&
        precedence(char) <= precedence(stack[stack.length - 1])
      ) {
        output.push(new Node(stack.pop()));
      }
      stack.push(char);
    } else if (char === '(') {
      stack.push(char);
    } else if (char === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(new Node(stack.pop()));
      }
      stack.pop();
    } else if (char === ',') {
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(new Node(stack.pop()));
      }
    } else {
      let functionName = char;
      while (i < expression.length - 1 && (isNaN(expression[i + 1]) || expression[i + 1] === '.')) {
        functionName += expression[i + 1];
        i++;
      }
      stack.push(functionName);
    }
  }

  while (stack.length) {
    output.push(new Node(stack.pop()));
  }

  for (let i = output.length - 1; i >= 0; i--) {
    const node = output[i];
    if (isOperator(node.value)) {
      node.left = output.splice(i + 1, 1)[0];
      node.right = output.splice(i, 1)[0];
    } else if (isFunction(node.value)) {
      node.left = output.splice(i + 1, node.value.length)[0];
    }
  }

  return output[0];
}

function evaluateExpression(root) {
  if (!root) {
    return 0;
  }

  if (!isOperator(root.value) && !isFunction(root.value)) {
    return parseFloat(root.value);
  }

  const leftVal = evaluateExpression(root.left);
  const rightVal = evaluateExpression(root.right);

  if (isFunction(root.value)) {
    switch (root.value) {
      case 'sin':
        return Math.sin(leftVal);
      case 'cos':
        return Math.cos(leftVal);
      case 'tan':
        return Math.tan(leftVal);
      default:
        return 0;
    }
  }

  switch (root.value) {
    case '+':
      return leftVal + rightVal;
    case '-':
      return leftVal - rightVal;
    case '*':
      return leftVal * rightVal;
    case '/':
      return leftVal / rightVal;
    default:
      return 0;
  }
}

// 示例代码
const expression = "3 + 4 * ( sin(2) - 1 )";
const root = buildExpressionTree(expression.split(" "));
const result = evaluateExpression(root);

console.log(`The result of expression '${expression}' is: ${result}`); // 3
