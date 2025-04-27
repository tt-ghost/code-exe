class LRUCache {
  constructor(capacity) {
    this.capacity = capacity; // 缓存容量
    this.cache = new Map();    // 存储键值对
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);     // 删除旧键
    this.cache.set(key, value); // 重新插入以更新顺序
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的键（Map的keys().next().value返回第一个键）
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
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
