function TreeNode(val) {
    this.val = val;
    this.left = this.right = null;
}

// 递归实现
function postOrderEach(root) {
  const result = []
  const loop = (node) => {
    if (node === null) return
    if (node.left !== null) preOrderEach(node.left)
    if (node.right !== null) preOrderEach(node.right)
    result.push(node.value)
  }
  return result
}

// 迭代实现
function loopPostOrderEach(root) {
  if (root === null) return
  const result = []
  const stack = [root]
  while(stack.length) {
    const node = stack.pop()
    result.push(node.val)
    if (node.right !== null) stack.push(node.right)
    if (node.left !== null) stack.push(node.left)
  }
  return result
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
console.log(postOrderEach(root)); 
