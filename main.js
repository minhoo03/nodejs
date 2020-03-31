var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
//리콰이어는 요구하기(불러옴) / http, fs, url 이라는 모듈을 / 모듈은 노드의 기능 비슷한것들 모음집

//이로써 객체화 시키면서 알게되는 것 / 코드방식은 같지만 효율적으로 쓰는게 리팩토링

//하나의 집합체(객체화)로 만들어 객체의 메소드만 불러 사용할 수 있게 만듬
var template = {
  HTML:function(title, list, body, control){
    return `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">WEB</a></h1>
      ${list}
      ${control}
      ${body}
    </body>
    </html>
    `;
  },
  list:function(filelist){//data 폴더를 받아온 filelist가 여기엔 없으니 입력값을 받을 매개변-/*수 생성
    var list = '<ul>';
    var i = 0;
    while(i < filelist.length){
      list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i = i + 1;
    }
    list = list+'</ul>';
    return list;
  }
}



//nodejs로 웹 브라우저 접속 들어올때마다 콜백함수를 nodejs가 호출
//인자 2개를 주는데 리퀘스트에는 요청한 웹 브라우저가 보낸 정보들
//리스폰스는 응답할때 우리가 전달한 정보들
  var app = http.createServer(function(request,response){
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname //주어진 url 정보의 pathname

  //path가 없는 경로로 접속했다면
  if(pathname === '/'){

    if(queryData.id === undefined){
      //data 읽어옴 / i가 0이고 읽어온 파일 개수보다 작을때까지 i++
      //i++ 하는 동안 list 에 li...랑 id에 파일의 i 번지를 넣고 파일의 i 번지를 넣어줌
      fs.readdir('./data', function(error, filelist){

        var title = 'Welcome!';
        var description = 'Hello, Node.Js!';

        // var list = templateList(filelist); //매개변수에 입력값 보내기 위해 입력해둠 / 함수사용
        // var template = templateHTML(title, list, `<h2>${title}</h2>${description}`,
        // `<a href="/create">create</a>`);

        var list = template.list(filelist); //매개변수에 입력값 보내기 위해 입력해둠 / 함수사용
        var html = template.HTML(title, list, `<h2>${title}</h2>${description}`,
        `<a href="/create">create</a>`);

        response.writeHead(200);
        response.end(html);
        })

    }else{
      fs.readdir('./data', function(error, filelist){

      fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
        var title = queryData.id;
        var list = template.list(filelist);
        //var list를 var template 아래에 두니까 filelist를 매개변수에 넣어주지 못해서 undefined가 나왔던 것
        var html = template.HTML(title, list, `<h2>${title}</h2>${description}`,
        `<a href="/create">create</a> <a href="/updata?id=${title}">updata</a> 
          <form action="delete_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <input type="submit" value="delete">
          </form>
        `);
        
        response.writeHead(200); //200이라는 숫자를 서버가 브라우저에게 주면 파일을 성공적으로 전송했다
        response.end(html);
        //    response.end(fs.readFileSync(__dirname + _url)); 사용자가 접속한 url을 읽어서 파일을 불러오기
      });
    });
    }
  }else if(pathname==='/create'){
    fs.readdir('./data', function(error, filelist){
      //readdir은 디렉토리 소속의 파일 정보를 읽어옴
      //readfile은 말 그대로
      var title = 'Web - create!';
      var list = template.list(filelist); //매개변수에 입력값 보내기 위해 입력해둠 / 함수사용
      var html = template.HTML(title, list, `
        <form action="/create_process" method="post"> 
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
            <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
            <input type="submit">
        </p>
        </form>
        `,``);
        //위 함수에선 title, list, body 이므로 body 부분에 저 내용을 박아줌
        response.writeHead(200);
        response.end(html);
      })
  }else if(pathname==='/create_process'){//post 방식으로 들어온 데이터 받기
    var body = ``;
    //사용자가 요청한 정보가 담긴 리퀘스트를 사용
    //post방식으로 데이터 전송할 때 엄청난 양이면 컴이 꺼질수도 있다
    //양을 조각조각내 요청을 보내면 서버에서 fui..(data) 를 콜백 / data를 보내기로 약속

    //사용자 정보에서 data란 요청이 들어옴 그럼 함수실행(콜백) bodt(본문)에 data(원하는 정보)넣어줌
    request.on('data', function(data){
      body = body + data;
      //콜백 실행때마다 body에 데이터 추가
    });
    //더 이상 들어올 데이터 없으면 end의 콜백 호출
    request.on('end', function(){
      var post = qs.parse(body);
      //qs 모듈중 parse 함수이용해 지금까지 저장한 body를 입력값으로 주면 post data 정보가 들어있을것이다
      var title = post.title; 
      var description = post.description;
      //fs 기능 파일 만들기(data폴더에 타이틀이름으로, 본문 담고, utf8, 에러날시에 담아줄 변수){성공시에 띄울 것}
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        //200 성공 404 실패 301 영원히 이 주소로 302 한 번만 다른 페이지로 이동
        response.writeHead(302,{Location:`/?id=${title}`});
        //성공시엔 만든 title 주소로 보내기
        response.end('success'); //실행 전부 완료후 띄우기
      })
    });
//id 값은 원래의 제목 (hidden으로 숨겨둠) / 바꿀 title만 text형태로 냅둠
  }else if(pathname === '/updata'){
    fs.readdir('./data', function(error, filelist){
      fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, list, 
        `
        <form action="/updata_process" method="post"> 
        <input type="hidden" name="id" value="${title}"> 
        <p><input type="text" name="title" placeholder="title" value=${title}></p>
        <p>
            <textarea name="description" placeholder="description">${description}</textarea>
        </p>
        <p>
            <input type="submit">
        </p>
        </form>
        `,
        `<a href="/create">create</a> <a href="/updata?id=${title}">updata</a>`);
        response.writeHead(200);
        response.end(html);
      });
    });
  }else if(pathname==='/updata_process'){
    var body = ``;
    request.on('data', function(data){
      body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      var id = post.id; //id 값(원래 title명)
      var title = post.title; 
      var description = post.description;
      fs.rename(`data/${id}`,`data/${title}`,function(error){ //이름 새로쓰기(원래이름의 파일 찾아와서,바꿀이름,콜백함수){파일만들기(파일이름,본문....)}
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302,{Location:`/?id=${title}`});
          response.end(); 
        })
      })
      
    });
  }else if(pathname==='/delete_process'){
    var body = ``;
    request.on('data', function(data){
      body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      var id = post.id; //id만 있어도 파일 찾을수 있으니 냅둠
      fs.unlink(`data/${id}`,function(error){ //삭제하다(data폴더의 ${id}를 그리고 성공시 어디로 보내다)
        response.writeHead(302,{Location:`/`});
          response.end(); 
      })
    });
  } else{
    response.writeHead(404); //제대로 접속 못하면 404 이라는 약속
    response.end('Not found');
  }
});
app.listen(3000, function(){
  console.log("open server")
});


