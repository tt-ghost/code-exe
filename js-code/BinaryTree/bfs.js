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
