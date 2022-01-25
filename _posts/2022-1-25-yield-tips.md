---
layout: articles
title: 使用生成器剔除重复元素并保持排序
date: 2022-1-25 14:31:00 +0800
categories: Tips
tags: Python yield
---
<!--more-->

摘自：[https://python3-cookbook.readthedocs.io/zh_CN/latest/c01/p10_remove_duplicates_from_seq_order.html](https://python3-cookbook.readthedocs.io/zh_CN/latest/c01/p10_remove_duplicates_from_seq_order.html)

**在一个序列上面保持元素顺序的同时消除重复的值**

【列表】
```
def dedupe(items):
    seen = set()
    for item in items:
        if item not in seen:
            yield item  #通过生成器直接返回保持顺序
            seen.add(item) #通过集合来剔除重复元素

>>> a = [1, 5, 2, 1, 9, 1, 5, 10]
>>> list(dedupe(a))
[1, 5, 2, 9, 10]
>>>
```


【字典】
```
def dedupe(items, key=None):
    seen = set()
    for item in items:
        val = item if key is None else key(item)
        if val not in seen:
            yield item
            seen.add(val)

>>> a = [ {'x':1, 'y':2}, {'x':1, 'y':3}, {'x':1, 'y':2}, {'x':2, 'y':4}]
>>> list(dedupe(a, key=lambda d: (d['x'],d['y'])))
[{'x': 1, 'y': 2}, {'x': 1, 'y': 3}, {'x': 2, 'y': 4}]
>>> list(dedupe(a, key=lambda d: d['x']))
[{'x': 1, 'y': 2}, {'x': 2, 'y': 4}]
>>>
```

