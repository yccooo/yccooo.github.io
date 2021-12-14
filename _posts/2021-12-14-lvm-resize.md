---
layout: article
title: lvm下更改分区大小
date: 2021-12-14 19:48:00 +0800
categories: notes
tags: Linux lvm
---
lvm下将home分区空间分到root分区
<!--more-->

# LVM简单使用
1. LVM简介
LVM（Logical Volume Manager）逻辑卷管理，将一个或者多个硬盘的分区在逻辑上集合，相当于一个大硬盘来使用，当硬盘的空间不足时，可以将其他的硬盘的分区加入其中，实现磁盘空间的动态管理。

2. LVM基本术语
物理存储介质（The physical media）：系统的存储设备，像/dev/sda，/dev/hda等，是存储系统最底层的存储单元<br>
物理卷（Physical Volume）：物理卷是指硬盘分区或从逻辑上与磁盘分区具有同样功能的设备（如raid），和基本的物理存储介质比较，包含有LVM相关的管理参数<br>
卷组（Volume Group）：LVM卷组类似于非LVM系统中的物理硬盘，有物理卷组成。可以在卷组上创建一个或者多个LVM分区（逻辑卷），LVM卷组可以有1个或者多个物理卷组成。<br>
逻辑卷：LVM的逻辑卷类似于非LVM系统的硬盘分区，在逻辑卷上可以建立文件系统<br>
PE（physical extent）：每一个物理卷被划分称为PE的基本单元，具有唯一编号的PE是可以被LVM寻址的最小单元，PE大小可配置。<br>
LE（logical extent）：逻辑卷被划分为称为LE的基本单元，在同一个卷组中，LE的大小和PE是相同的，并且一一对应。<br>

3. 空间转移
从/home下分出部分空间到/下：
> 1. 备份/home下的文件
> `[root@pikecompute1 ~]# tar -czvf home.tar /home/`
> 2. 卸载/home分区
> `[root@pikecompute1 ~]# umount /home`
> 3. 减少home逻辑卷的容量
> `[root@pikecompute1 ~]# lvreduce -L  -2048G /dev/centos/home`
> `WARNING: Reducing active logical volume to 1.58 TiB.`
> `THIS MAY DESTROY YOUR DATA (filesystem etc.)`
> `Do you really want to reduce centos/home? [y/n]: y`
> `Size of logical volume centos/home changed from 3.58 TiB (939772 extents) to 1.58 TiB (415484 extents).`
> `Logical volume centos/home successfully resized.`
> 4. 可以通过lvdisplay命令查看home逻辑卷容量
> 5. 重新格式化分区，将分区格式化为xfs文件系统
> `[root@pikecompute1 centos]# mkfs.xfs /dev/mapper/centos-home -f`
> 6. 重新挂载/home分区
> `[root@pikecompute1 centos]# mount /dev/mapper/centos-home /home/`
> 7. 将原先的home目录的备份文件重新解压到home目录下
> 8. 将刚才分出来的分给root分区
> `[root@pikecompute1 centos]# lvextend  -l +100%FREE /dev/centos/root`
> 9. 扩展文件系统
> `[root@pikecompute1 centos]# xfs_growfs /dev/mapper/centos-root`
