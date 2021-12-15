---
layout: article
title: dpdk收发包流程 基于basicfwd.c文件分析
date: 2021-12-15 16:15:00 +0800
categories: notes
tags: Dpdk
---
从basicfwd初探dpdk收发包
<!--more-->

##### 收发包分解
收发包过程大致可以分为2个部分
1. 收发包的配置和初始化，主要是配置收发队列等
2. 数据包的获取和发动，主要是从队列中获取到数据包或者把数据包放到队列中


首先看主函数
主程序部分main
```C
int
main(int argc, char *argv[])
{
	struct rte_mempool *mbuf_pool; //指向内存池接口的指针
	unsigned nb_ports; // 网口个数
	uint16_t portid; // 网口号

	/* Initialize the Environment Abstraction Layer (EAL). */
	int ret = rte_eal_init(argc, argv);
	if (ret < 0)
		rte_exit(EXIT_FAILURE, "Error with EAL initialization\n");
	
	// ret是init函数的返回值，是命令行中被解析成功的参数个数
	argc -= ret;
	argv += ret; //这两个操作不清楚

	/* Check that there is an even number of ports to send/receive on. */
	nb_ports = rte_eth_dev_count_avail(); // 获取当前可用的以太网设备的总数
	if (nb_ports < 2 || (nb_ports & 1)) // 检查端口个数小于2 或者为奇数 ，则报错
		rte_exit(EXIT_FAILURE, "Error: number of ports must be even\n");

	
	/* Creates a new mempool in memory to hold the mbufs. */
	mbuf_pool = rte_pktmbuf_pool_create("MBUF_POOL", NUM_MBUFS * nb_ports,
		MBUF_CACHE_SIZE, 0, RTE_MBUF_DEFAULT_BUF_SIZE, rte_socket_id());

	if (mbuf_pool == NULL)
		rte_exit(EXIT_FAILURE, "Cannot create mbuf pool\n");

	/* Initialize all ports. */
	RTE_ETH_FOREACH_DEV(portid) // 必须使用RTE_ETH_FOREACH_DEV()宏来访问这些设备以处理非连续范围的设备。
		if (port_init(portid, mbuf_pool) != 0)
			rte_exit(EXIT_FAILURE, "Cannot init port %"PRIu16 "\n",
					portid);

	if (rte_lcore_count() > 1) // basicfwd只需要使用一个逻辑核
		printf("\nWARNING: Too many lcores enabled. Only 1 used.\n");

	/* Call lcore_main on the main core only. */
	// 仅仅一个主线程调用
	// 这个程序纯粹地把一个网口收到的包从另一个网口转发出去，就像是一个repeater，中间没有其他任何处理。
	lcore_main();

	/* clean up the EAL */
	rte_eal_cleanup();

	return 0;
}
```
可以看到主函数部分主要有以下操作：
1. 根据传入的参数初始化eal层
2. 检查用来收发包的端口数是否是偶数
3. `rte_pktmbuf_pool_create()`函数创建用来保存mbuf的内存池
4. `port_init()`函数进行端口的初始化
5. 调用主线程开始basicfwd。
***
接口API
`struct rte_mempool* rte_pktmbuf_pool_create(const char * name,
unsigned n,
unsigned cache_size,
uint16_t priv_size,
uint16_t data_room_size,
int socket_id )`
创建一个mbuf池子
此函数创建并初始化数据包 mbuf 池。它是rte_mempool函数的包装器。

参数
name mbuf池的名称。
n mbuf池中的元素数量。内存池的最佳大小（就内存使用而言）是当n是2的幂减1时：n=(2^q-1)。
cache_size 每核心对象缓存的大小。有关详细信息，请参阅rte_mempool_create()。
priv_size 应用程序私有的大小在rte_mbuf结构和数据缓冲区之间。该值必须与 RTE_MBUF_PRIV_ALIGN 对齐。
data_room_size 每个mbuf中数据缓冲区的大小，包括 RTE_PKTMBUF_HEADROOM。
socket_id 应分配内存的套接字标识符。如果保留区域没有 NUMA 约束，则该值可以是SOCKET_ID_ANY。
***

端口初始化部分
```C
static inline int
port_init(uint16_t port, struct rte_mempool *mbuf_pool)
{
	struct rte_eth_conf port_conf = port_conf_default;
	const uint16_t rx_rings = 1, tx_rings = 1; //每个网口的rx和tx队列个数
	uint16_t nb_rxd = RX_RING_SIZE; //接收环大小
	uint16_t nb_txd = TX_RING_SIZE; //发送环大小
	int retval;
	uint16_t q;
	struct rte_eth_dev_info dev_info; //用于获取以太网设备的信息，setup queue时用到
	struct rte_eth_txconf txconf; //setup tx queue时用到

	if (!rte_eth_dev_is_valid_port(port))
		return -1;

	retval = rte_eth_dev_info_get(port, &dev_info); //查询以太网设备接口信息，并填充到dev_info中
	if (retval != 0) {
		printf("Error during getting device (port %u) info: %s\n",
				port, strerror(-retval));
		return retval;
	}

	if (dev_info.tx_offload_capa & DEV_TX_OFFLOAD_MBUF_FAST_FREE)
		port_conf.txmode.offloads |=
			DEV_TX_OFFLOAD_MBUF_FAST_FREE;

	/* Configure the Ethernet device. */
	retval = rte_eth_dev_configure(port, rx_rings, tx_rings, &port_conf); //网卡配置
	if (retval != 0)
		return retval;

	retval = rte_eth_dev_adjust_nb_rx_tx_desc(port, &nb_rxd, &nb_txd); //检查rx和tx描述符的数量是否满足以太网设备信息中的描述符限制，否则将它们调整为边界
	if (retval != 0)
		return retval;

	/* Allocate and set up 1 RX queue per Ethernet port. */
	for (q = 0; q < rx_rings; q++) {
		retval = rte_eth_rx_queue_setup(port, q, nb_rxd,
				rte_eth_dev_socket_id(port), NULL, mbuf_pool);
		if (retval < 0)
			return retval;
	}

	txconf = dev_info.default_txconf;
	txconf.offloads = port_conf.txmode.offloads;
	/* Allocate and set up 1 TX queue per Ethernet port. */
	for (q = 0; q < tx_rings; q++) {
		retval = rte_eth_tx_queue_setup(port, q, nb_txd,
				rte_eth_dev_socket_id(port), &txconf);
		if (retval < 0)
			return retval;
	}

	/* Start the Ethernet port. */
	retval = rte_eth_dev_start(port); // 设备启动步骤是最后一步，包括设置已配置的offload功能以及启动设备的发送和接收单元。成功时，可以调用以太网API导出的所有基本功能（链接状态，接收/发送等）。
	if (retval < 0)
		return retval;

	/* Display the port MAC address. */
	struct rte_ether_addr addr;
	retval = rte_eth_macaddr_get(port, &addr);
	if (retval != 0)
		return retval;
	// #define PRIx8 "hhx" 
	// 十六进制数形式输出整数 一个h表示short，即short int ，两个h表示short short，即 char。%hhx用于输出char
	printf("Port %u MAC: %02" PRIx8 " %02" PRIx8 " %02" PRIx8
			   " %02" PRIx8 " %02" PRIx8 " %02" PRIx8 "\n",
			port,
			addr.addr_bytes[0], addr.addr_bytes[1],
			addr.addr_bytes[2], addr.addr_bytes[3],
			addr.addr_bytes[4], addr.addr_bytes[5]);

	/* Enable RX in promiscuous mode for the Ethernet device. */
	retval = rte_eth_promiscuous_enable(port);//设置网卡为混杂模式
	if (retval != 0)
		return retval;

	return 0;
}
```
端口初始化部分：
1. 检查设备的port_id是否已连接 `rte_eth_dev_is_valid_port(port))`
2. 得到以太网设备的信息 `rte_eth_dev_info_get(port,&dev_info)`
3. 配置以太网设备`rte_eth_dev_configure`，主要配置内容是为网卡分配收发队列，检查是否符合硬件要求。
4. 配置完网卡队列后，要setup队列
    * `rte_eth_rx_queue_setup` 为以太网设备分配和设置接收队列，要为rx队列设置指向mempool的指针
    * `rte_eth_tx_queue_setup` 为以太网设备分配和设置传输队列。可以设置传输队列的长度，传输的模式等
5. 启动设备 `rte_eth_dev_start(port)`
6. rte_eth_promiscuous_enable(port) 设置网卡为混杂模式

***
接口API
`int rte_eth_dev_configure(uint16_t port_id,
uint16_t nb_rx_queue,
uint16_t nb_tx_queue,
const struct rte_eth_conf * eth_conf )`
配置一个以太网设备，这个函数需要在其他以太网API函数使用前调用，可以在设备停止时重新调用。

参数：
	port_id    配置的以太网设备的端口标识
	nb_rx_queue    设置以太网设备的接收队列数量
	nb_tx_queue    设置以太网设备的发送队列数量
	eth_conf    指向要用于以太网设备的配置数据的指针
	
返回值：
	0    成功，设备已配置
	<0    驱动配置函数返回的错误代码
    

`int rte_eth_rx_queue_setup(uint16_t port_id,
uint16_t rx_queue_id,
uint16_t nb_rx_desc,
unsigned int socket_id,
const struct rte_eth_rxconf * rx_conf,
struct rte_mempool * mb_pool )`

为以太网设备分配和设置接收队列。

该函数从与socket_id关联的内存区域，为nb_rx_desc接收描述符分配一个连续的内存块，并使用从内存池mb_pool分配的网络缓冲区初始化每个接收描述符。

参数
port_id 以太网设备的端口标识符。
rx_queue_id	要设置的接收队列的索引。该值必须在之前提供给rte_eth_dev_configure() 的[0, nb_rx_queue - 1] 范围内。
nb_rx_desc 为接收环分配的接收描述符的数量。
socket_id 所述socket_id参数是在NUMA的情况下，socket标识符。如果为接收描述符分配的 DMA 内存没有 NUMA 约束，则该值可以是SOCKET_ID_ANY。
rx_conf	指向要用于接收队列的配置数据的指针。允许 NULL 值，在这种情况下将使用默认 RX 配置。该rx_conf结构体包含rx_thresh结构体，rx_thresh中包含准备预取的数量，主机的值，接收环写回寄存器的阈值。此外，它还包含使用 DEV_RX_OFFLOAD_* 标志激活的硬件卸载功能。如果在 rx_conf->offloads 中设置的卸载未在输入参数 eth_conf->rxmode.offloads 中设置为rte_eth_dev_configure()，则它是新添加的卸载，它必须是 per-queue 类型，并为队列启用. 无需重复 rx_conf->offloads 中已在rte_eth_dev_configure() 中启用的任何位在端口级别。无法在队列级别禁用在端口级别启用的卸载。配置结构还包含指向接收缓冲区段描述数组的指针，请参阅 rx_seg 和 rx_nseg 字段，此扩展配置可能会被 RTE_ETH_RX_OFFLOAD_BUFFER_SPLIT 等拆分卸载使用。如果 mp_pool 不为 NULL，则扩展配置字段必须设置为 NULL 和零。
mb_pool	指向内存池的指针，从中分配rte_mbuf网络内存缓冲区以填充接收环的每个描述符。有两个选项可以提供 Rx 缓冲区配置：
单池：mb_pool 不为 NULL，rx_conf.rx_nseg 为 0。
多个分段描述符：mb_pool 为 NULL，rx_conf.rx_seg 不为 NULL，rx_conf.rx_nseg 不为 0。仅在卸载中设置标志 RTE_ETH_RX_OFFLOAD_BUFFER_SPLIT 时采用。

***

主线程部分
```C
static __rte_noreturn void
lcore_main(void)
{
	uint16_t port;

	/*
	 * Check that the port is on the same NUMA node as the polling thread
	 * for best performance.
	 */
	RTE_ETH_FOREACH_DEV(port)
		if (rte_eth_dev_socket_id(port) >= 0 &&
				rte_eth_dev_socket_id(port) !=
						(int)rte_socket_id())
			printf("WARNING, port %u is on remote NUMA node to "
					"polling thread.\n\tPerformance will "
					"not be optimal.\n", port);

	printf("\nCore %u forwarding packets. [Ctrl+C to quit]\n",
			rte_lcore_id());

	/* Run until the application is quit or killed. */
	for (;;) {
		/*
		 * Receive packets on a port and forward them on the paired
		 * port. The mapping is 0 -> 1, 1 -> 0, 2 -> 3, 3 -> 2, etc.
		 */
		RTE_ETH_FOREACH_DEV(port) {

			/* Get burst of RX packets, from first port of pair. */
			struct rte_mbuf *bufs[BURST_SIZE]; //
			const uint16_t nb_rx = rte_eth_rx_burst(port, 0,
					bufs, BURST_SIZE);

			if (unlikely(nb_rx == 0))
				continue;

			/* Send burst of TX packets, to second port of pair. */
			const uint16_t nb_tx = rte_eth_tx_burst(port ^ 1, 0,
					bufs, nb_rx);

			/* Free any unsent packets. */
			if (unlikely(nb_tx < nb_rx)) {
				uint16_t buf;
				for (buf = nb_tx; buf < nb_rx; buf++)
					rte_pktmbuf_free(bufs[buf]);
			}
		}
	}
}

```

主线程是一个死循环，只能强行中断来结束。
两个端口为一组，一个端口收到包，就立刻转发到另一个端口。例如 0 口收到包立刻从1 口转发出去，3 口收到包立刻从 2 口转发出去，等等。
1. 在主线程里需要声明MBUF的结构体 `struct rte_mbuf *bufs[BURST_SIZE]`;
2. 收包函数：`rte_eth_rx_burst` 从指定的以太网设备的接收队列利用burst收发包机制接受一批数据包。检索到的数据包存储在`rte_mbuf`结构中。mbuf就是dpdk中用于存储网络数据包的缓冲区，mbuf是使用mempool来分配和回收内存的。mempool已经在端口初始化的函数中设置给了接收队列。
3. 发包函数：`rte_eth_tx_burst` 从指定的以太网设备的发送队列发送一连串输出数据包。在代码中，发包函数参数中的mbuf数组就是收包函数收来的mbuf数组，也就是实现了原封不动的转发。
4. 释放没有发的包。

***
接口API
`static uint16_t rte_eth_rx_burst(uint16_t port_id,
uint16_t queue_id,
struct rte_mbuf ** rx_pkts,
const uint16_t nb_pkts )`

从一个以太网设备的接收队列中收取报文，收到的报文存储在rx_pkts指针数组的rte_mbuf结构体中

`rte_eth_rx_burst()`函数循环解析接收队列中的接收环，直到报文达到nb_pkts，对于接收环中每一个完成的接收描述符，有一下操作：
1. 按照网卡为该描述符提供的信息，为该描述符初始化rte_mbuf结构体
2. 将该rte_mbuf结构体存储到rx_pkts数组的下一个表项中
3. 从内存池中为该rte_mbuf结构分配内存

当收到的报文分散于多个描述符中时，该函数会把相关rte_mbuf附加到第一个报文的缓冲区

函数返回值为收包个数，这里指的是存到rx_pkts数组的报文，返回值等于nb_pkts说明收包队列中至少有rx_pkts个报文，也表明输入队列中可能还有待接收的报文，实施“”尽可能多的接收数据包“”策略的应用程序可以检查这种情况，并继续调用`rte_eth_rx_burst()`函数，直到返回值小于nb_pkts。

参数
port_id 以太网设备的端口标识符。
queue_id 从中检索输入数据包的接收队列的索引。该值必须在之前提供给rte_eth_dev_configure() 的[0, nb_rx_queue - 1] 范围内。
rx_pkts	指向rte_mbuf结构的指针数组的地址，该数组必须足够大以在其中存储nb_pkts指针。
nb_pkts	要检索的最大数据包数。该值必须能被 8 整除才能与任何驱动程序一起使用。

返回值
实际检索到的数据包数量，即有效提供给rx_pkts数组的指向rte_mbuf结构的指针数量。
***


文章节选自
https://blog.csdn.net/qq_15437629/article/details/79633720<br>
https://www.cnblogs.com/ZCplayground/p/9318291.html
***
程序源码来自dpdk源码目录examples/skeleton/basicfwd.c

