function TreeNode(val) {
    this.val = val;
    this.left = this.right = null;
}

// 递归实现
function preOrderEach(root) {
  if (root===null) return
  console.log(root.val)
  if (root.left !== null) preOrderEach(root.left)
  if (root.right !== null) preOrderEach(root.right)
}

// 迭代实现
function loopPreOrderEach(root) {
  if (root === null) return
  const stack = [root]
  while(stack.length) {
    const node = stack.pop()
    console.log(node.val)
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
