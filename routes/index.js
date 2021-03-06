var crypto = require('crypto');
var formidable = require("formidable");
var fs = require("fs");
var User = require("../model/user.js");
var Post = require('../model/post.js');
var Comment = require('../model/comment.js');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  var page = req.query.p ? parseInt(req.query.p) : 1;
  Post.getTen(null,page,function(err,posts,total){
  	if(err){
  		posts = [];
  	}
  	res.render('index', {
	  	title :'主页',
	  	user:req.session.user,
	  	posts : posts,
      page : page,
      isFirstPage : (page - 1) == 0,
      isLastPage : ((page - 1) * 10 + posts.length) == total,
	  	success : req.flash('success').toString(),
	  	error : req.flash('error').toString()
	});
  })
});


router.get('/reg', checkNotlogin);
router.get('/reg', function(req, res) {
  res.render('reg', {
  	title :'注册',
  	user : req.session.user,
  	success : req.flash('success').toString(),
  	error : req.flash('error').toString()
  });
});

router.post('/reg',checkNotlogin);
router.post('/reg', function(req, res) {
  var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
  if(password_re != password){
  	req.flash('error','两次输入的密码不一致!');
  	return res.redirect('/reg');
  }
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
  	  name : req.body.name,
  	  password : password,
  	  email : req.body.email
  });
  User.get(newUser.name,function(err,user){
  	if(user){
  		req.flash('error','用户已存在!');
  		return res.redirect('/reg');
  	}
  	newUser.save(function(err,user){
  		if(err){
  			req.flash('error',err);
  			return res.redirect('/reg');
  		}

  		req.session.user = user;
  		req.flash('success','注册成功!');
  		res.redirect('/')
  	})
  })
});

router.get('/login',checkNotlogin);
router.get('/login',function(req, res) {
  res.render('login', {
  	title :'登录',
  	user : req.session.user,
  	success : req.flash('success').toString(),
  	error : req.flash('error').toString()
  });
});

router.post('/login',checkNotlogin);
router.post('/login', function(req, res) {
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  User.get(req.body.name,function(err,user){
  	  if(!user){
  	  	req.flash('error','用户不存在!');
  	  	return res.redirect('/login');
  	  }
  	  if(user.password != password){
  	  	req.flash('error','密码错误!');
  	  	return res.redirect('/login');
  	  }
  	  req.session.user = user;
  	  req.flash('success','登录成功!');
  	  res.redirect('/');
  })
});

router.get('/post',checkLogin);
router.get('/post', function(req, res) {
  res.render('post', {
  	title :'发表',
  	user : req.session.user,
  	success : req.flash('success').toString(),
  	error : req.flash('error').toString()
  });
});

router.post('/post',checkLogin);
router.post('/post', function(req, res) {
	var currentUser = req.session.user,
      tags = [req.body.tag1,req.body.tag2,req.body.tag3],
	    post = new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
	post.save(function(err){
		if(err){
			req.flash('error',err);
			return res.redirect('/');
		}
		req.flash('success','发布成功!');
		res.redirect('/');
	})
});

router.get('/logout',checkLogin);
router.get('/logout', function(req, res) {
  req.session.user = null;
  req.flash('success','登出成功!');
  res.redirect('/');
});

router.get('/upload',checkLogin);
router.get('/upload',function(req,res){
  res.render('upload',{
    title : '文件上传',
    user : req.session.user,
    success : req.flash('success').toString(),
    error : req.flash('error').toString()
  })
})

router.post('/upload',function(req,res){
  var form = new formidable.IncomingForm();
  form.uploadDir = "public/images";
  console.log("about to parse");
  form.parse(req,function(error, fields, files){
    if(error){
      return ;
    }
    for(var i in files){
      if(files[i].size == 0){
        fs.unlinkSync(files[i].path);
        console.log("Succesfully removed an empty file");
      }else{
        var target_path = 'public/images/' + files[i].name;
        fs.renameSync(files[i].path,target_path);
        console.log('Succesfully renamed a file!');
      }
    }
  })
  req.flash('success','文件上传成功!');
  res.redirect('/upload');
})

router.get('/archive',function(req,res){
  Post.getArchive(function(err,posts){
    if(err){
      req.flash('error',err);
      return res.redirect('/');
    }
    res.render('archive',{
      title : '存档',
      posts : posts,
      user : req.session.user,
      success : req.flash('success').toString(),
      error : req.flash('error').toString()
    })
  })
})

router.get('/tags',function(req,res){
  Post.getTags(function(err,posts){
    if(err){
      req.flash('error',err);
      return res.redirect('/');
    }
    res.render('tags',{
      title : '标签',
      posts : posts,
      user : req.session.user,
      success : req.flash('success').toString(),
      error : req.flash('error').toString()
    })
  })
})

router.get('/tags/:tag',function(req,res){
  Post.getTag(req.params.tag,function(err,posts){
    if(err){
      req.flash('error',err);
      return res.redirect('/');
    }
    res.render('tag',{
      title : 'TAG:' + req.params.tag,
      posts : posts,
      user : req.session.user,
      success : req.flash('success').toString(),
      error : req.flash('error').toString()
    })
  })
})

router.get('/links',function(req,res){
  res.render('links',{
    title : '友情链接',
    user : req.session.user,
    success : req.flash('success').toString(),
    error : req.flash('error').toString()
  })
})

router.get('/search',function(req,res){
  Post.search(req.query.keyword,function(err,posts){
    if(err){
      req.flash('error',err);
      return res.redirect('/');
    }
    res.render('search',{
      title : 'SEARCH:' + req.query.keyword,
      user : req.session.user,
      posts : posts,
      success : req.flash('success').toString(),
      error : req.flash('error').toString()
    })
  })
})

router.get('/u/:name',function(req,res){
  var page = req.query.p ? parseInt(req.query.p) : 1;
  User.get(req.params.name,function(err,user){
    if(!user){
      req.flash('error','用户名不存在!');
      return res.redirect('/');
    }
    Post.getTen(user.name,page,function(err,posts,total){
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('user',{
        title : user.name,
        user : req.session.user,
        posts : posts,
        page : page,
        isFirstPage : (page - 1) == 0,
        isLastPage : ((page - 1) * 10 + posts.length) == total,
        success : req.flash('success').toString(),
        error : req.flash('error').toString()
      })
    })
  })
})

router.get('/u/:name/:day/:title',function(req,res){
  Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
    if(err){
      req.flash('error',err);
      return res.redirect('/');
    }
    res.render('article',{
      title : req.params.title,
      post : post,
      user : req.session.user,
      success : req.flash('success').toString(),
      error : req.flash('error').toString()
    })
  })
})

router.post('/u/:name/:day/:title',function(req,res){
  var date = new Date(),
      time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
        date.getDate() + "" +date.getHours() + ":" +
        (date.getMinutes() < 10? '0' + date.getMinutes() : date.getMinutes());
  var head = "http://www.lagou.com/upload/promotion/ff8080814b62220e014b62b105e60070.jpg";
  var comment = {
    name : req.body.name,
    head : head,
    email : req.body.email,
    website : req.body.website,
    time : time,
    content : req.body.content
  };

  var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
  newComment.save(function(err){
    if(err){
      req.flash('error',err);
      return res.redirect('back');
    }
    req.flash('success','留言成功');
    res.redirect('back');
  })
})

router.get('/edit/:name/:day/:title',checkLogin);
router.get('/edit/:name/:day/:title',function(req,res){
  var currentUser = req.session.user;
  Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
    if(err){
      req.flash('error',err);
      return res.redirect('back');
    }
    res.render('edit',{
      title : '编辑',
      post : post ,
      user : req.session.user,
      success : req.flash('success').toString(),
      error : req.flash('error').toString()
    })
  })
});

router.post('/edit/:name/:day/:title',checkLogin);
router.post('/edit/:name/:day/:title',function(req,res){
  var currentUser = req.session.user;
  Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
    var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
    if(err){
      req.flash('error',err);
      return res.redirect(url);
    }
    req.flash('success','修改成功!');
    res.redirect(url);
  })
});

router.get('/remove/:name/:day/:title',checkLogin);
router.get('/remove/:name/:day/:title',function(req,res){
  var currentUser = req.session.user;
  Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
    var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
    if(err){
      req.flash('error',err);
      return res.redirect('back');
    }
    req.flash('success','删除成功!');
    res.redirect('/');
  })
});

router.use(function(req,res){
   res.render('404');
})

function checkLogin(req,res,next){
  if(!req.session.user){
  	req.flash('error','未登录');
  	res.redirect('/login');
  }
  next();
}

function checkNotlogin(req,res,next){
	if(req.session.user){
		req.flash('error','已登录!');
		res.redirect('back')
	}
	next();
}
module.exports = router;
