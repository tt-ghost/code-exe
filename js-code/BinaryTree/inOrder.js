// 递归实现
function inOrder(root) {
  const result = [];
  function loop(node) {
    if (!node) return;
    // 遍历左子树
    loop(node.left);
    // 访问根节点
    result.push(node.value);
    // 遍历右子树
    loop(node.right);
  }
  loop(root);
  return result;
}

// 迭代实现
function loopInOrder(root) {
  const result = [];
  const stack = [];
  let current = root;

  while (current || stack.length) {
    // 将左子树全部压入栈中
    while (current) {
      stack.push(current);
      current = current.left;
    }
    // 弹出栈顶（最左叶子节点或父节点）
    current = stack.pop();
    // 访问节点值
    result.push(current.value);
    // 转向右子树
    current = current.right;
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
function TreeNode(value) {
  this.value = value;
  this.left = this.right = null;
}

const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
root.right.left = new TreeNode(6);
root.right.right = new TreeNode(7);

// 输出中序遍历结果：[4,2,5,1,6,3,7]
console.log('中序遍历（递归）', inOrder(root));
console.log('中序遍历（迭代）', loopInOrder(root)); 
