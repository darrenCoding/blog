var MongoClient = require('mongodb').MongoClient;
var settings = require('../setting');
function Comment(name,day,title,comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

Comment.prototype.save = function(callback){
	var name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;
    MongoClient.connect(settings.url,function(err,db){
    	if(err){
    		return callback(err);
    	}
    	console.log("Connected correctly to server");
    	db.collection("posts",function(err,collection){
    		if(err){
    			db.close();
    			return callback(err);
    		}
    		collection.update({
    			'name':name,
    			'time.day' :day,
                'title' : title
    		},{
    			$push : {"comments" : comment}
    		},function(err){
                db.close();
    			if(err){
    				return callback(err);
    			}
    			callback(null);
    		})
    	})
    })
}

module.exports = Comment;
