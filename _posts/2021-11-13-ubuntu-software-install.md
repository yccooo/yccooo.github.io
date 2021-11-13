---
layout: article
title: ubuntu上安装软件方式
date: 2021-11-13 10:16:16 +0800
categories: notes
tags: Linux ubuntu
---
ubuntu上使用apt-get/dpkg/make install方式安装软件
<!--more-->


# Ubuntu软件安装
### apt-get
apt-get 命令是 Ubuntu 系统中的包管理工具，可以用来安装、卸载包，也可以用来升级包，还可以用来把系统升级到新的版本。
  
**命令格式：**
apt-get [options] command

#### 常见用法：
1. 更新软件包索引： `sudo apt-get update`
2. 安装软件包： `sudo apt-get install nginx`
3. 安装软件包时需要确认时回应yes：`sudo apt-get install -y nginx`
4. 重新安装已经安装的包：`sudo apt-get install --reinstall curl`
5. 更新指定的包：`sudo apt-get install vim`
6. 安装指定包的版本：`sudo apt-get install tree=1.7.0-5`
7. 下载安装包而不安装：`sudo apt-get install -d nginx`

常见的查询软件包名字方法: `apt search / apt-cache search` 


#### 常用command：

**update**
update 命令用于重新同步包索引文件，/etc/apt/sources.list 文件中的配置指定了包索引文件的来源。更新了包索引文件后就可以得到可用的包的更新信息和新的包信息。这样我们本地就有了这样的信息：有哪些软件的哪些版本可以从什么地方(源)安装。

**install**
install 命令用来安装或者升级包，被安装的包依赖的包也将被安装。

**upgrade**
upgrade 命令用于从 /etc/apt/sources.list 中列出的源安装系统上当前安装的所有包的最新版本。在任何情况下，当前安装的软件包都不会被删除，尚未安装的软件包也不会被检索和安装。如果当前安装的包的新版本不能在不更改另一个包的安装状态的情况下升级，则将保留当前版本。

**dist-upgrade**
除执行升级功能外，dist-upgrade 还智能地处理与新版本包的依赖关系的变化。apt-get 有一个 "智能" 的冲突解决系统，如果有必要，它将尝试升级最重要的包，以牺牲不那么重要的包为代价。因此，distr -upgrade 命令可能会删除一些包。因此在更新系统中的包时，建议按顺序执行下面的命令：
```shell
$ apt-get update
$ apt-get upgrade -y
$ apt-get dis-upgrade -y
```
**remove**
remove用来删除包，删除时会将其配置文件留在系统上

**purge**
purge 命令在删除包的同时也删除了包的配置文件。

**autoremove**
autoremove 命令用于删除自动安装的软件包，这些软件包当初是为了满足其他软件包对它的依赖关系而安装的，而现在已经不再需要了。

**download**
download 命令把指定包的二进制文件下载到当前目录中。注意，是类似*.deb 这样的包文件。

**clean**
clean 命令清除在本地库中检索到的包。它从 /var/cache/apt/archives/ 和 /var/cache/apt/archives/partial/ 目录删除除锁文件之外的所有内容。

**autoclean**
与 clean 命令类似，autoclean 命令清除检索到的包文件的本地存储库。不同之处在于，它只删除不能再下载的软件包文件，而且这些文件在很大程度上是无用的。这允许长时间维护缓存，而不至于大小失控。

**source**
source 命令下载包的源代码。默认会下载最新可用版本的源代码到当前目录中。

**changelog**
changelog 命令尝试下载并显示包的更新日志。


### dpkg命令
Ubuntu下的软件包后缀为.deb，使用dpkg命令安装：`sudo dpkg -i package.deb`

dpkg常用命令：
| 命令 | 说明 |
|---|---|
| dpkg -i package.deb | 安装包 |
| dpkg -r package | 删除包 |
| dpkg -P package | 删除包及配置文件 |
| dpkg -L package | 列出与属于该包的文件 |
| dpkg -l | 列出当前已安装的包 |
| dpkg -c package.deb | 列出deb包的内容 |
| dpkg --unpack package.deb | 解压deb包，但是不进行配置 |
| dpkg –configure package | 配置包 |


### make install安装源码
如果要使用make安装的话，那么必须得安装build-essential这个依赖包。  

源码安装大致可以分为三步骤：（./configure）–＞ 编译（sudo make） –＞ 安装（sudo make install）。
1. 配置：这是编译源代码的第一步，通过 ./configure 命令完成。执行此步以便为编译源代码作准备。常用的选项有 --prefix=PREFIX，用以指定程序的安装位置。  
2. 编译：一旦配置通过，可即刻使用 make 指令来执行源代码的编译过程。  
3. 安装：如果编译没有问题，执行 sudo make install 就可以将程序安装到系统中了。
