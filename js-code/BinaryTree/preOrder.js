function TreeNode(value) {
  this.value = value;
  this.left = this.right = null;
}

// 递归实现
function preOrder(root) {
  const result = []
  const loop = (node) => {
    if (node === null) return
    result.push(node.value)
    if (node.left !== null) loop(node.left)
    if (node.right !== null) loop(node.right)
  }
  loop(root)
  return result
}

// 迭代实现：单栈法
function loopPreOrder(root) {
  const result = []
  if (root === null) return result
  const stack = [root]
  while(stack.length) {
    const node = stack.pop()
    result.push(node.value)
    if (node.right !== null) stack.push(node.right)
    if (node.left !== null) stack.push(node.left)
  }
  return result
}

// 迭代实现：统一迭代法
function loopPreOrder2(root) {
  const stack = [root], result = [];
  while (stack.length) {
    const node = stack.pop();
    // 双等号判断包括null和undefined
    if (node == null) continue;
    if (node instanceof TreeNode) {
      stack.push(node.right);     // 右
      stack.push(node.left);      // 左
      stack.push(node.value);       // 根（标记为已处理）
    } else {
      result.push(node);          // 访问值
    }
  }
  return result;
}

/* 构建测试树
    1
   /\
  2  3
 /\  /\
4 5 6  7
*/

const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
root.right.left = new TreeNode(6);
root.right.right = new TreeNode(7);

// 输出后序遍历结果：[1,2,4,5,3,6,7]
console.log('前序遍历（递归）：', preOrder(root)); 
console.log('前序遍历（迭代：单栈法）：', loopPreOrder(root)); 
console.log('前序遍历（迭代：统一迭代法）：', loopPreOrder2(root)); 
