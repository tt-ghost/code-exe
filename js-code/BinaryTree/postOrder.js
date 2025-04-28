function TreeNode(value) {
    this.value = value;
    this.left = this.right = null;
}

// 递归实现
function postOrder(root) {
  const result = []
  const loop = (node) => {
    if (node === null) return
    if (node.left !== null) loop(node.left)
    if (node.right !== null) loop(node.right)
    result.push(node.value)
  }
  loop(root)
  return result
}

// 迭代实现：单栈法（前序变种反转）
function loopPostOrder(root) {
  const result = []
  if (root === null) return result
  const stack = [root]

  while(stack.length) {
    const node = stack.pop()
    // 先记录根节点值
    result.push(node.value)
    // 左子节点先入栈
    if (node.left) stack.push(node.left)
    // 右子节点后入栈
    if (node.right) stack.push(node.right)
  }
  // 反转后得到后序序列
  return result.reverse()
}

// 迭代实现：双栈法​
function loopPostOrder2(root) {
  if (!root) return [];
    const stack1 = [root], stack2 = [];
    while (stack1.length) {
      const node = stack1.pop();
      // 根节点暂存到 stack2
      stack2.push(node);
      // 左子节点先入栈  
      if (node.left) stack1.push(node.left);
      // 右子节点后入栈  
      if (node.right) stack1.push(node.right);
    }
    // 反转得到左 → 右 → 根
    return stack2.reverse().map(n => n.value);
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

// 输出后序遍历结果：[4,5,2,6,7,3,1]
console.log('后序遍历（递归）', postOrder(root));
console.log('后序遍历（迭代：单栈法）', loopPostOrder(root)); 
console.log('后序遍历（迭代：双栈法​）', loopPostOrder2(root)); 
