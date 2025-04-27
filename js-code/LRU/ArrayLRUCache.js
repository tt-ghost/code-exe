class ArrayLRUCache {
  constructor(capacity) {
    this.capacity = capacity;    // 最大缓存容量
    this.cache = [];             // 存储结构：[{key, value, timestamp}]
  }

  get(key) {
    let targetIndex = -1;
    // 所有元素时间戳自增，并定位目标元素
    this.cache.forEach((item, index) => {
      item.timestamp++;
      if (item.key === key) targetIndex = index;
    });

    if (targetIndex !== -1) {
      // 命中后重置时间戳为0（最新）
      this.cache[targetIndex].timestamp = 0;
      return this.cache[targetIndex].value;
    }
    return -1;
  }

  put(key, value) {
    let targetIndex = -1;
    // 所有元素时间戳自增，并检查是否存在相同key
    this.cache.forEach((item, index) => {
      item.timestamp++;
      if (item.key === key) targetIndex = index;
    });

    if (targetIndex !== -1) {
      // 更新已存在元素
      this.cache[targetIndex].value = value;
      this.cache[targetIndex].timestamp = 0;
    } else {
      // 淘汰机制（缓存已满时）
      if (this.cache.length >= this.capacity) {
        let maxTimestamp = -Infinity;
        let maxIndex = -1;
        // 查找最久未使用的元素（时间戳最大）
        this.cache.forEach((item, index) => {
          if (item.timestamp > maxTimestamp) {
            maxTimestamp = item.timestamp;
            maxIndex = index;
          }
        });
        this.cache.splice(maxIndex, 1);
      }
      // 插入新元素（时间戳初始化为0）
      this.cache.push({ key, value, timestamp: 0 });
    }
  }
}

// 数据结构
// [
//   { key: 'A', value: 1, timestamp: 3 },
//   { key: 'B', value: 2, timestamp: 0 },
//   { key: 'C', value: 3, timestamp: 5 }
// ]

// 使用示例
const cache = new ArrayLRUCache(2);
cache.put(1, 'A');  // 缓存: [{key:1, value:'A', timestamp:0}]
cache.put(2, 'B');  // 缓存: [{key:1, timestamp:1}, {key:2, value:'B', timestamp:0}]

console.log(cache.get(1)); // 返回'A'，缓存变为：
// [{key:1, timestamp:0}, {key:2, timestamp:1}]

cache.put(3, 'C');  // 淘汰key=2（timestamp=1），插入key=3
// 最终缓存：
// [
//   {key:1, value: 'A', timestamp:1},
//   {key:3, value:'C', timestamp:0}
// ]
