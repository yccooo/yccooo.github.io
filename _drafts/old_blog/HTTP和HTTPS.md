## HTTP和HTTPS

1. 在浏览器输入URL，回车后会经历哪些流程？
    1. 浏览器向DNS服务器请求解该URL中的域名所对应的IP地址
    2. 解析出IP地址后，向该ip地址和对应的端口号建立TCP连接
    3. 浏览器发出HTTP请求，发送HTTP报文到服务器
    4. 服务器对该请求作出响应，将请求的数据发给客户端
    5. 关闭TCP连接
    6. 浏览器渲染显示页面


2. GET和POST的区别？
    - get是获取数据的，而post是提交数据的
    - get用于获取信息，是无副作用的，是幂等的，且可缓存，post 用于修改服务器上的数据，有副作用，非幂等，不可缓存
    - get参数通过url传递，post放在request body中
    - get请求参数放在url中因此会受到浏览器对于url的长度限制，而post没有
    - get比post更不安全，因为参数直接暴露在url中，所以不能用来传递敏感信息
    - get请求只能进行url编码，而post支持多种编码方式
    - get请求参数会被完整保留在浏览历史记录里，而post中的参数不会被保留
    - get产生一个TCP数据包，post产生两个TCP数据包

    GET和POST是在HTTP协议中的两种发送请求的方法。
    对于GET方式的请求，浏览器会把http header和data一并发送出去，服务器响应200；
    而对于POST，浏览器先发送header，服务器响应100 continue，浏览器再发送data，服务器响应200 ok。


3. HTTP和HTTPS的不同以及优缺点？
