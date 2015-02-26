var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var async = require('async');
var settings = require('../setting');//默认的设置

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback){
    var head = "http://www.lagou.com/upload/promotion/ff8080814b62220e014b62b105e60070.jpg";
    //要存入数据库的用户文档
    var user = {
    	name : this.name,
    	password : this.password,
    	email : this.email,
        head : head
    };
    async.waterfall([
        function(cb){
            MongoClient.connect(settings.url, function(err, db) {
                if (err) {
                    return callback(err);
                }
                console.log("Connected correctly to server");
                cb(err,db);
            })
        },
        function(db,cb){
            db.collection("users",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                cb(err,collection,db);
            })
        },
        function(collection,db,cb){
            //将用户数据插入users集合
            collection.insert(user,{safe : true},function(err,user){
                if(err){
                    return callback(err);
                }
                cb(err,user,db)
            })
        }
    ],function(err,user,db){
        db.close();
        callback(null,user[0]);//成功后返回存储后的文档
    })
}

//读取用户信息
User.get = function(name,callback){
	async.waterfall([
        function(cb){
            MongoClient.connect(settings.url, function(err, db) {
                if (err) {
                    return callback(err);
                }
                console.log("Connected correctly to server");
                cb(err,db);
            })
        },
        function(db,cb){
            db.collection("users",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                cb(err,collection,db);
            })
        },
        function(collection,db,cb){
            //查找用户名(name键)值为name的一个文档
            collection.findOne({name : name},function(err,user){
                if(err){
                    return callback(err);
                }
                cb(err,user,db)
            })
        }
    ],function(err,user,db){
        db.close();
        callback(null,user);//成功后返回存储后的文档
    })
}
