---
layout: article
title: top显示及常用命令
date: 2021-12-14 10:14:22 +0800
categories: notes
tags: Linux top
---
top显示的内容解释以及常用命令
<!--more-->

# top显示及常用命令

## 显示信息

top显示如下：
```
top - 14:39:48 up 22:11,  1 user,  load average: 1.56, 1.16, 1.29
Tasks: 429 total,   1 running, 428 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.5 us,  2.1 sy,  0.0 ni, 97.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem : 13153552+total, 60272336 free, 69538976 used,  1724212 buff/cache
KiB Swap:  4194300 total,  4194300 free,        0 used. 61515192 avail Mem

PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
176005 root      10 -10   11.5g 477268  16860 S 101.3  0.4 351:17.63 ovs-vswitchd
186255 root      20   0  162284   2640   1588 R   0.3  0.0   0:00.08 top
1 root      20   0  194060   7272   4196 S   0.0  0.0   0:22.33 systemd
2 root      20   0       0      0      0 S   0.0  0.0   0:00.04 kthreadd
```

**第一行：**
14:39:48 up 22:11，    当前系统时间以及系统运行时间
1 user，    当前1个用户登录系统
load average: 1.56, 1.16, 1.29，    1分钟 5分钟 15分钟内的负载情况
**第二行：**
Tasks    表示共有429个进行，处于运行状态的1个，睡眠状态的428个，停止的进程0个，僵尸进程0个
**第三行：**
cpu状态
- us — 用户空间占用CPU的百分比。
- sy — 内核空间占用CPU的百分比。
- ni — 改变过优先级的进程占用CPU的百分比
- id — 空闲CPU百分比
- wa — IO等待占用CPU的百分比
- hi — 硬中断（Hardware IRQ）占用CPU的百分比
- si — 软中断（Software Interrupts）占用CPU的百分比
**第四行：**
内存使用状态
- total - 总的物理内存
- free - 空闲内存
- used - 使用中的内存
- buff/cache - 缓存的内存. 
- buff:指内存缓冲区使用的内存（/proc/meminfo中的buffers）
- cache:页面缓存和slab使用的内存（/proc/meminfo中的cached和SReclaimable）
**第五行：**
swap交换分区使用状态
- total - 交换内存总量
- free - 空闲的交换内存
- used - 使用中的交换内存。交换内存的频繁使用，表示系统内存缺少严重
- avail Mem - 有多少内存可用于启动新应用程序而无需交换。此字段考虑了页面缓存，并且由于正在使用的项目，并非所有可回收的内存slab都将被回收（/proc/meminfo中的memavailable）
**第六行空行**
**第七行：**
各进程（任务）的状态监控
PID — 进程id
USER — 进程所有者
PR — 进程优先级
NI — nice值。负值表示高优先级，正值表示低优先级
VIRT — 进程使用的虚拟内存总量，单位kb。VIRT=SWAP+RES
RES — 进程使用的、未被换出的物理内存大小，单位kb。RES=CODE+DATA
SHR — 共享内存大小，单位kb
S — 进程状态。D=不可中断的睡眠状态 R=运行 S=睡眠 T=跟踪/停止 Z=僵尸进程
%CPU — 上次更新到现在的CPU时间占用百分比
%MEM — 进程使用的物理内存百分比
TIME+ — 进程使用的CPU时间总计，单位1/100秒
COMMAND — 进程名称（命令名/命令行）

## 常用指令
- top视图下，按下数字1，显示每个逻辑cpu的状况
- top视图下，按下字母H，显示线程使用状况
- top视图下，按下数字f，可以调整显示字段的位置以及选择显示某些字段

