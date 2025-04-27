class ListNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;    // 缓存容量
    this.size = 0;               // 当前缓存数量
    this.head = null;            // 链表头节点
    this.tail = null;            // 链表尾节点
    this.nodeMap = new Map();    // 哈希表辅助快速查找
  }

  get(key) {
    if (!this.nodeMap.has(key)) return -1;

    let prev = null;
    let current = this.head;
    // 遍历查找目标节点
    while (current && current.key !== key) {
      prev = current;
      current = current.next;
    }

    // 将命中节点移动到头部
    if (prev) {
      prev.next = current.next;
      current.next = this.head;
      this.head = current;
      // 更新尾节点（当移动的是原尾节点时）
      if (current === this.tail) this.tail = prev;
    }
    return current.value;
  }

  put(key, value) {
    if (this.nodeMap.has(key)) {
      // 更新已有节点值并移动到头部
      this.get(key); // 利用get方法自带移动逻辑
      this.head.value = value;
      return;
    }

    // 创建新节点
    const newNode = new ListNode(key, value);
    this.nodeMap.set(key, newNode);

    if (this.size >= this.capacity) {
      // 淘汰尾节点
      if (this.size === 1) {
        this.head = this.tail = null;
      } else {
        let current = this.head;
        while (current.next !== this.tail) current = current.next;
        this.nodeMap.delete(this.tail.key);
        current.next = null;
        this.tail = current;
      }
      this.size--;
    }

    // 插入新节点到头部
    newNode.next = this.head;
    this.head = newNode;
    if (!this.tail) this.tail = newNode; // 首次插入时初始化尾节点
    this.size++;
  }

  // 调试用：打印链表状态
  print() {
    let str = '';
    let current = this.head;
    while (current) {
      str += `[${current.key}:${current.value}]->`;
      current = current.next;
    }
    console.log(str + 'null');
  }
}

// 使用示例
const cache = new LRUCache(2);
cache.put(1, 'A'); // 缓存: [1:A]
cache.put(2, 'B'); // 缓存: [2:B]->[1:A]
console.log(cache.get(1)); // 返回'A' → 缓存变为 [1:A]->[2:B]

cache.put(3, 'C'); // 淘汰key=2 → 缓存变为 [3:C]->[1:A]
console.log(cache.get(2)); // 返回-1（已被淘汰）
cache.print(); // 输出：[3:C]->[1:A]->null
