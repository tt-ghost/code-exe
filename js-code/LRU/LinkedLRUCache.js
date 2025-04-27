class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new Node(); // 哑头节点
    this.tail = new Node(); // 哑尾节点
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _moveToTail(node) {
    // 将节点移动到链表尾部（表示最近使用）
    this._removeNode(node);
    this._addToTail(node);
  }

  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToTail(node) {
    node.prev = this.tail.prev;
    node.next = this.tail;
    this.tail.prev.next = node;
    this.tail.prev = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._moveToTail(node);
    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this._moveToTail(node);
    } else {
      if (this.map.size >= this.capacity) {
        // 淘汰链表头部节点（最久未使用）
        const firstNode = this.head.next;
        this._removeNode(firstNode);
        this.map.delete(firstNode.key);
      }
      const newNode = new Node(key, value);
      this.map.set(key, newNode);
      this._addToTail(newNode);
    }
  }
}

// 使用示例
const lru = new LRUCache(3);
lru.put('A', 1);    // 缓存: A(1)
lru.put('B', 2);    // 缓存: B(2) → A(1)
lru.put('C', 3);    // 缓存: C(3) → B(2) → A(1)
console.log(lru.get('A')); // 输出1 → 缓存变为A(1) → C(3) → B(2)
lru.put('D', 4);    // 淘汰B → 缓存: D(4) → A(1) → C(3)
console.log(lru.get('B')); // 输出-1（已被淘汰）
