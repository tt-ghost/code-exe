function TreeNode(value) {
    this.value = value;
    this.left = this.right = null;
}

// 递归实现
function preOrderEach(root) {
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
function loopPreOrderEach(root) {
  if (root === null) return
  const stack = [root]
  const result = []
  while(stack.length) {
    const node = stack.pop()
    result.push(node.value)
    if (node.right !== null) stack.push(node.right)
    if (node.left !== null) stack.push(node.left)
  }
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
console.log(preOrderEach(root)); 
