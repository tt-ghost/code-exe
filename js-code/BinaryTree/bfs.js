// 常规广度遍历
function bfs(root) {
  if (!root) return [];
  const queue = [root], result = [];
  while (queue.length) {
    // 队首出列
    const node = queue.shift();
    // 访问节点值
    result.push(node.value);
    // 左子节点入队
    if (node.left) queue.push(node.left);
    // 右子节点入队
    if (node.right) queue.push(node.right);
  }
  return result;
}

// 分层广度遍历
function levelBfs(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    // 当前层节点数
    const levelSize = queue.length;
    const currentLevel = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      // 收集当前层节点值
      currentLevel.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    // 将当前层加入结果
    result.push(currentLevel);
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

// 广度遍历结果：[1,2,3,4,5,6,7]
console.log('广度遍历', bfs(root));
// 广度分层遍历结果：[[1],[2,3],[4,5,6,7]]
console.log('广度遍历（分层）', levelBfs(root));
