---
layout: article
date: 2021-11-18 19:47:00 +0800
categories: note
tags: Linux Hugepage
---
Linux下2M和1G大页的配置
<!--more-->


# Linux下大页配置

### 查看系统大页配置
通过`cat /proc/meminfo | grep Huge`查看系统中的大页分配
```shell
[root@ovs1 ff3]# cat /proc/meminfo | grep Huge
AnonHugePages:    159744 kB
ShmemHugePages:        0 kB
HugePages_Total:      64
HugePages_Free:       19
HugePages_Rsvd:        0
HugePages_Surp:        0
Hugepagesize:    1048576 kB
Hugetlb:        67108864 kB
```
使用`cat /sys/devices/system/node/node*/meminfo | grep Huge`可以查看各个node上大页信息
```shell
[root@ovs1 ff3]# cat /sys/devices/system/node/node*/meminfo | grep Huge
Node 0 AnonHugePages:     88064 kB
Node 0 ShmemHugePages:        0 kB
Node 0 HugePages_Total:    32
Node 0 HugePages_Free:     13
Node 0 HugePages_Surp:      0
Node 1 AnonHugePages:     71680 kB
Node 1 ShmemHugePages:        0 kB
Node 1 HugePages_Total:    32
Node 1 HugePages_Free:      6
Node 1 HugePages_Surp:      0
```

### 修改启动参数配置大页
1. 修改`/etc/default/grub`文件
配置1G大页内存：
在`GRUB_CMDLINE_LINUX`变量中添加`default_hugepagesz=1G hugepagesz=1G hugepages=64`
配置2M大页内存：
在`GRUB_CMDLINE_LINUX`变量中添加`default_hugepagesz=2M hugepagesz=2M hugepages=64`

2. 修改结束后，更新grub
`grub2-mkconfig -o /boot/grub2/grub.cfg`

3. 重启系统生效

通过这种方式为系统总的大页内存，在系统为NUMA架构时，会将配置的大页内存均分到各路numa上

### 2M大页可以使用动态分配的方式进行配置

对于2M大页可以不需要重启系统，动态进行分配
- 为总的系统分配大页 <br/>
`echo 1024 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages`<br/>
同样分均分到各个node上

- 如果要单独为node0上分配1024个2M大页<br/>
`echo 1024 > /sys/devices/system/node/node0/hugepages/hugepages-2048kB/nr_hugepages`

动态分配会在重启系统后失效
