var user=getCookie('biqutsmluserid');
var articleid,chapterid;
function $(sel, all){
	return all ? document.querySelectorAll(sel) : document.querySelector(sel);
}
function formatDate(time) {
	var date = new Date(time);
	var month = date.getMonth()+1;
	var day = date.getDate();
	var hour = date.getHours();
	var minute = date.getMinutes();
	if (month < 10) month = '0' + month;
	if (day < 10) day = '0' + day;
	if (hour < 10) hour = '0' + hour;
	if (minute < 10) minute = '0' + minute;
	return month+'-'+day+' '+hour+':'+minute;
}

//读取cookies 
function getCookie(name){ 
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if(arr=document.cookie.match(reg))
        return unescape(arr[2]); 
    else 
        return null; 
} 
function post(url, func){
	var xhr = new XMLHttpRequest();        
	xhr.open('GET', url, false);
	xhr.send();
	result = JSON.parse(xhr.responseText);
    return result;
}
function active(url){
	if (!user) {
		if (confirm('您尚未登录，是否马上登录？')) {
			window.location.href='/user/login/?jumpurl='+escape(window.location.href);
		}
		return;
	}
	var xhr = new XMLHttpRequest();          
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 304) {
			var json = JSON.parse(xhr.responseText);
			alert(json._info);
		}
	}
	xhr.send();
}
function down(type,id){
	active('/api/user?mod=down&type='+type+'&id='+id+'&d=json&r='+Math.random());
}

function vote(id){
	id = id || 0;
	active('/api/user?mod=vote&id='+id+'&d=json&r='+Math.random());
}
function mark(id, cid){
	id = id || 0;
	cid = cid || 0;
	active('/api/user?mod=mark&type=add&id='+id+'&cid='+cid+'&d=json&r='+Math.random());
}
function delmark(id){
	id = id || 0;
	if (id > 0 && confirm('确认删除书签？')) active(ApiUrl+'/api/user?mod=mark&type=del&id='+id+'&d=json&r='+Math.random(), function(json){
		if (json._status>0){
			var li=$("dl[article-id='"+id+"']");
			li.parentNode.removeChild(li);
			$("div.caption b").innerHTML = $("dl[article-id]",true).length;
		}
	});
}
function delhistory(id){
	var li = $("dl[article-id='"+id+"']");
	window.localStorage.removeItem('book_'+id);
	li.parentNode.removeChild(li);
	$("div.caption b").innerHTML = $("dl[article-id]",true).length;
}
function clearhistory(){
	if (confirm('确认清空阅读历史？ ')){
		var list = $("dl[article-id]",true);
		for (var i = 0; i < list.length; i++) {
			let id = list[i].getAttribute("article-id");
			let li = $("dl[article-id='"+id+"']");
			window.localStorage.removeItem('book_'+id);
			li.parentNode.removeChild(li);
		}
		$("div.caption b").innerHTML = 0;
	}
}
function feedback(id, cid){
	id = id || 0;
	cid = cid || 0;
	var json=post('/api/user?mod=feedback&id='+id+'&cid='+cid+'&d=xml&r='+Math.random());
  	alert(json._info);
}
function showhistory(){
	var list = [];
	for (var i=0; i<window.localStorage.length; i++) {
		if (window.localStorage.key(i).substr(0,5) === 'book_') {
			var book = JSON.parse(window.localStorage.getItem(window.localStorage.key(i)));
			if (!book.readid) continue;
			book.id = window.localStorage.key(i).substr(5);
			list.push(book);
		}
	}
	list.sort(function(a, b){
		return b.readtime - a.readtime;
	});
	for (var i=0; i<list.length; i++) {
      	var id=list[i].id;
		document.writeln('<dl article-id="'+id+'">');
		document.writeln('<dt><a href="/novel/'+id+'.html"><img src="'+list[i].img+'" onerror="this.onerror=null;this.src=\'/images/nocover.jpg\'" height="125" width="100"></a></dt>');
		document.writeln('<dd><h3><span class="uptime">'+formatDate(list[i].readtime)+'</span><a href="/novel/'+id+'.html">'+list[i].name+'</a></h3></dd>');
		document.writeln('<dd class="book_other">'+list[i].author+'</dd>');
		document.writeln('<dd class="book_des">');
		document.writeln('<p class="chapter">读到：'+'<a href="/read/'+id+'/'+list[i].readid+'.html">'+list[i].readname+'</a>'+'</p><p></p>');
		document.writeln('<a class="readbtn" href="/read/'+id+'/'+list[i].readid+'.html'+'">继续阅读</a><a class="delbtn" onclick="delhistory('+list[i].id+')">删 除</a>');
		document.writeln('</dd>');
		document.writeln('</dl>');
	}
	$("div.caption b").innerHTML = list.length;
}
function zhankai(act) {
	var intro = document.getElementById('bookintro');
	if (act) {
		intro.style.height='auto';
		document.getElementById('zkqw').innerHTML = '';
	}else if(intro.scrollHeight>120){
		document.writeln('<div class="zkqw"><a onclick="zhankai(true)">展开全文</a></div>');
	}else{
		intro.style.height='auto';
	}
}
function search(){
	var url='/api/hotsearch';
	var response=post(url);
  	var list='';
	if(response.code==200){
		data=response.data;
		for(e in data){console.log(data[e]);
			list+='<a href="'+data[e].titleurl+'">'+data[e].title+'</a>';
		}
		document.getElementsByClassName('hotlist')[0].innerHTML=list;
	}
}
function layout(html){
	var win = document.createElement('div');
	win.setAttribute('class','layout-win');
	win.addEventListener('click', function(){
		this.parentNode.removeChild(this);
	});
	win.addEventListener('touchmove', function(e){
		e.preventDefault();
	});
	var con = document.createElement('div');
	con.setAttribute('class','layout-con');
	con.innerHTML = html;
	con.addEventListener('click', function(e){
		e.stopPropagation();
	});
	win.appendChild(con);
	$('body').appendChild(win);
}
function setting(){
	layout('<ul class="setting"><li class="theme"><label>主题</label><a class="day" onclick="theme(\'day\')"></a><a class="night" onclick="theme(\'night\')"></a><a class="pink" onclick="theme(\'pink\')"></a><a class="yellow" onclick="theme(\'yellow\')"></a><a class="blue" onclick="theme(\'blue\')"></a><a class="green" onclick="theme(\'green\')"></a><a class="gray" onclick="theme(\'gray\')"></a></li><li class="size"><label>字号</label><a class="iconfont icon-dec" onclick="size(false)"></a><a id="fontsize">18</a><a class="iconfont icon-inc" onclick="size(true)"></a></li><li class="default"><a onclick="theme(\'day\');size(18)">恢复默认</a><a onclick="vote(articleid,chapterid)">推荐本书</a><a style="color:red" onclick="feedback(articleid,chapterid)">错误反馈</a></li></ul>');
	theme();size();
}
function theme(v){
	if (typeof v === 'undefined') v = window.localStorage.getItem('theme') || 'day';
	var list = $('li.theme a',true);
	for (var i = 0; i < list.length; i++) {
		if (list[i].getAttribute('class')===v){
			list[i].setAttribute('selected','');
		}else{
			list[i].removeAttribute('selected');
		}
	}
	$('body').className = v;
	window.localStorage.setItem('theme', v);
}
function size(v){
	if (typeof v === 'undefined') {
		v = parseInt(window.localStorage.getItem('size') || 18);
	} else if (typeof v === 'boolean') {
		v = (v ? 2 : -2) + parseInt(window.localStorage.getItem('size') || 18);
	} else {
		v = parseInt(v) || parseInt(window.localStorage.getItem('size') || 18);
	}
	if (v<=10) {
		v = 10;
		if ($('.size')) $('.size a.icon-dec').setAttribute('disabled','');
	} else if (v>=50) {
		v = 50;
		if ($('.size')) $('.size a.icon-inc').setAttribute('disabled','');
	} else if ($('.size')) {
		$('.size a.icon-dec').removeAttribute('disabled');
		$('.size a.icon-inc').removeAttribute('disabled');
	}
	if ($('#fontsize')) $('#fontsize').innerText = v;
	if ($('#content')) $('#content').style.fontSize = v + 'px';
	window.localStorage.setItem('size', v);
}
function yuyin(){
	var title = '《'+$('#bookname').innerText+'》——'+$('#author').innerText+'——'+$('h1.headline').innerText;
	var text = $('#content').innerText.replace(/\s+/g, '');
	var page = 0;
	var spd = 5; //语速，取值0-9，默认为5中语速
	var pit = 5; //音调，取值0-9，默认为5中语调
	var vol = 5; //音量，取值0-15，默认为5中音量
	var per = 4; //发音人选择, 0为普通女声，1为普通男生，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女声
	var url = '//tsn.baidu.com/text2audio?lan=zh&ctp=1&pdt=1&cuid=baidu_speech_demo&tex=content&spd='+spd+'&pit='+pit+'&vol='+vol+'&per='+per;
	layout('<div class="yuyin"><audio id="audio" controls="controls">浏览器不支持在线阅读！</audio></div>');
	var audio = $('#audio');
	audio.src = url.replace('content', encodeURI(title));
	audio.play();
	audio.addEventListener('ended', function(){
		if (page >= Math.ceil(text.length/200)) {
			page = 0;
			audio.src = url.replace('content', encodeURI(title));
		} else {
			audio.src = url.replace('content', encodeURI(text.substr((++page-1)*200, 200)));
			audio.play();
		}
	});
}
document.onreadystatechange = function () {
	if (document.readyState === "interactive") {
		var body = $('body');
      	articleid = body.getAttribute('article-id') || 0;
      	chapterid = body.getAttribute('chapter-id') || 0;
		if (!articleid) return;
		if (chapterid > 0) {
			var book = {name:$('#bookname').innerText,author:$('#author').innerText,img:body.getAttribute('data-img')||0,readid:chapterid,readname:$('h1.headline').innerText,readtime:new Date().getTime()};
			window.localStorage.setItem('book_'+articleid, JSON.stringify(book));
			theme();size();
		}
		// var visit = window.localStorage.getItem('visit_'+articleid) || 0;
		// if (!visit) {
  //        	//post(ApiUrl+'/api/onclick?id='+articleid+'&d=json');
		// 	window.localStorage.setItem('visit_'+articleid, new Date().getTime());
		// }
	}
}
//统计
function tongji(){
	var _hmt = _hmt || [];
	(function() {
	  var hm = document.createElement("script");
	  hm.src = "https://hm.baidu.com/hm.js?f3298a0cbc6e024121a9e4a096c26b9c";
	  var s = document.getElementsByTagName("script")[0]; 
	  s.parentNode.insertBefore(hm, s);
	})();
}
