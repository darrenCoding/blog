var MongoClient = require('mongodb').MongoClient;
var markdown = require('markdown').markdown;
var async = require('async');
var settings = require('../setting'); 

function Post(name, head, title, tags, post) {
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
};

module.exports = Post;

Post.prototype.save = function(callback) {
    var date = new Date();
    var time = {
        data: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
            date.getDate() + "" + date.getHours() + ":" +
            (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    var post = {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv: 0
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
            db.collection("posts",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                cb(err,collection,db);
            })
        },
        function(collection,db,cb){
            collection.insert(post,{safe : true},function(err,user){
                if(err){
                    return callback(err);
                }
                cb(err,user,db)
            })
        }
    ],function(err,user,db){
        db.close();
        callback(null);
    })
}

Post.getTen = function(name, page, callback) {
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
            db.collection("posts",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                var query = {};
                if (name){
                    query.name = name;
                }
                cb(err,collection,db,query);
            })
        },
        function(collection,db,query,cb){
            collection.count(query,function(err,total){
                cb(err,collection,query,total,db)
            })
        },
        function(collection,query,total,db,cb){
            collection.find(query, {
                skip: (page - 1) * 10,
                limit: 10
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                docs.forEach(function(doc) {
                    doc.post = markdown.toHTML(doc.post);
                });
                cb(err,docs,total);
            })
        }
    ],function(err,docs,total){
        callback(null, docs, total);
    })
}

Post.getOne = function(name, day, title, callback) {
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
            db.collection("posts",function(err,collection){
                if(err){
                    db.close();
                    return callback(err);
                }
                cb(err,collection,db);
            })
        },
        function(collection,db,cb){
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                if (doc) {
                    cb(err,collection,db);
                }
                if (doc.comments) {
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment) {
                        comment.content = markdown.toHTML(comment.content);
                    })
                    callback(null, doc);
                } else if (doc) {
                    doc.post = markdown.toHTML(doc.post);
                    callback(null, doc);
                }
            })
        },
        function(collection,db,cb){
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $inc: {
                    'pv': 1
                }
            }, function(err) {
                if (err) {
                    cb(err,db);
                }
            })
        }
    ],function(err,db){
        if(err){
            db.close();
            return callback(err);
        }
    })
}

Post.edit = function(name, day, title, callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function(err, doc) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            })
        })
    })
}

Post.update = function(name, day, title, post, callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            collection.update({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                $set: {
                    post: post
                }
            }, function(err) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

Post.remove = function(name, day, title, callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }, function(err, doc) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);
            })
        })
    })
}

Post.getArchive = function(callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            collection.find({}, {
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}

Post.getTags = function(callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            collection.distinct('tags', function(err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}

Post.getTag = function(tag, callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            //查询所有tags数组内包含tag的文档
            //返回只含有name、time、title组成的数组
            collection.find({
                'tags': tag
            }, {
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}

Post.search = function(keyword, callback) {
    MongoClient.connect(settings.url, function(err, db) {
        if (err) {
            return callback(err);
        }
        console.log("Connected correctly to server");
        db.collection("posts", function(err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({
                'title': pattern
            }, {
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}
