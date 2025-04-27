# 实现篇：LRU算法的几种实现

## 1 什么是LRU

LRU（Least Recently Used，**最近最少使用**）是一种缓存淘汰策略，核心思想是**优先淘汰最久未被访问的数据**，适用于有限容量的缓存场景。其运作逻辑基于**时间局部性原理**，即最近被访问的数据很可能在短期内再次被访问。

### LRU的常见应用场景

- **前端领域**
  - **浏览器缓存**：存储最近访问的网页资源（如图片、CSS/JS文件）  
  - **SPA应用状态管理**：缓存高频访问的API响应数据，减少网络请求  
  - **路由缓存**：Vue/React中保留最近访问的组件实例，加速页面切换
- **后端与系统层**
  - **数据库查询缓存**：如MySQL/Redis的缓冲池管理  
  - **操作系统内存管理**：虚拟内存的页面置换（如Linux内核的`swap`机制）  
  - **CDN节点缓存**：优化热门资源的分发效率
- **通用缓存优化**
  - **API网关**：缓存高频接口响应，降低后端压力  
  - **计算密集型任务**：缓存中间计算结果（如斐波那契数列、图像处理）

![](https://media.geeksforgeeks.org/wp-content/uploads/20240909142802/Working-of-LRU-Cache-copy-2.webp)

## 2 JavaScript实现

### 2.1 基于`Map`的简洁实现

利用`Map`数据结构保持键值对的插入顺序，结合其原生方法实现高效操作，相关示例代码：[js-code/LRU](https://github.com/tt-ghost/code-exe/tree/master/js-code/LRU)

**特点**：  
- 通过`Map`的插入顺序自动维护访问时间顺序  
- `get`和`put`操作均保持O(1)时间复杂度  
- 代码简洁，适用于中小规模缓存场景

**实现代码**：  
```javascript
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
```

**使用示例：**  
```javascript
const lru = new LRUCache(3);
lru.put('A', 1);    // 缓存: A(1)
lru.put('B', 2);    // 缓存: B(2) → A(1)
lru.put('C', 3);    // 缓存: C(3) → B(2) → A(1)
console.log(lru.get('A')); // 输出1 → 缓存变为A(1) → C(3) → B(2)
lru.put('D', 4);    // 淘汰B → 缓存: D(4) → A(1) → C(3)
console.log(lru.get('B')); // 输出-1（已被淘汰）
```


### 2.2 双向链表+哈希表的高性能实现

针对大规模数据场景，采用双向链表维护访问顺序，哈希表提供快速查找

**优势**：  
- 链表操作的时间复杂度严格为O(1)，避免`Map`实现中可能的哈希冲突问题  
- 更适合高频读写的大规模缓存场景

![](https://cdn.fe1024.com/webstatic/zhuji/userspace/dev/pRo0zU7u_lru-cache.png)

**实现代码**：  
```javascript
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
```


### 2.3 数组+时间戳记录法

为每个数据项维护一个时间戳，每次访问或插入时更新时间戳，淘汰时间戳最大的数据项。

**缺点**：需维护全局时间戳，增删改查时间复杂度均为 *O(n)*，性能较差。  

**实现代码**：  
```javascript
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
```

**使用示例：**  
```javascript
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
```


### 2.4 单向链表队列  

- **原理**：新数据插入链表头部，访问时移动节点到头部，淘汰尾部节点。
- **缺点**：查询需遍历链表，时间复杂度 *O(n)*，仅适用于低频访问场景。  
- **优化示例**：Java的`LinkedList`通过维护哈希表记录键值对，但删除尾部节点仍需遍历。
- **数据结构设计**
  - 链表节点：存储键值对和指向下一个节点的指针
  - LRU队列：维护头尾指针，容量上限
  - 访问策略：新数据插入头部，被访问数据移动到头部，满容量时淘汰尾部
- **时间复杂度分析**
  - 查询操作：O(n)（需遍历链表）
  - 插入操作：O(n)（需遍历检查存在性）
  - 淘汰操作：O(n)（需遍历到尾部）
- **适用场景**
  - 数据量小（<100条）的缓存场景
  - 教学演示LRU核心逻辑
  - 资源受限环境（如嵌入式设备）
  

**实现代码**：  
```javascript
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
```

**使用示例：**  
```javascript
const cache = new LRUCache(2);
cache.put(1, 'A'); // 缓存: [1:A]
cache.put(2, 'B'); // 缓存: [2:B]->[1:A]
console.log(cache.get(1)); // 返回'A' → 缓存变为 [1:A]->[2:B]

cache.put(3, 'C'); // 淘汰key=2 → 缓存变为 [3:C]->[1:A]
console.log(cache.get(2)); // 返回-1（已被淘汰）
cache.print(); // 输出：[3:C]->[1:A]->null
```


## 3 扩展优化

- **时间窗口加权**：为近期访问添加更高权重，缓解周期性访问导致的误淘汰  
- **分级缓存**：将LRU与[LFU](https://baike.baidu.com/item/%E7%BC%93%E5%AD%98%E7%AE%97%E6%B3%95)结合，例如热数据用LRU、温数据用LFU  


----

引用：   
- [design-a-data-structure-for-lru-cache](https://www.geeksforgeeks.org/design-a-data-structure-for-lru-cache/)
- [implement-least-recently-used-cache](https://www.enjoyalgorithms.com/blog/implement-least-recently-used-cache)
- [high-throughput-thread-safe-lru-caching](https://innovation.ebayinc.com/stories/high-throughput-thread-safe-lru-caching/)
