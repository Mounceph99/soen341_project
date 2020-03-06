'use strict'

/*
 * Title : SOEN341_scrapbook
 * Author : Iyad Al-Kassab @ UConcordia
 * Date : 25/02/2020
 * Description : Basic demo showcase where it answers to POST requests and send data
 * Installed dependencies (non standard module) : express, mysql
 *
 * How it works : start by running a standard server and connect to DB
 */

//dependencies
const express = require('express') //express minimal JS framework
const path = require('path') //to resolve directory when sendFile html (app.get response.sendFile())
const http = require('http') //for http server...
const mysql = require('mysql') //db for historical data
const session = require('express-session') //for sessions
const md5 = require('md5') //md5 hashing for password db
const multer = require('multer'); //to upload file buffers

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
      if (file)
        cb(null, file.originalname + '-' + Date.now());
      else {
        req.fileValidationError = "NO NO!"
        console.log("NO NO!")
        cb(null, false)
      }
    }
});

var upload = multer({storage,    fileFilter: function (req, file, cb) {
   if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif") {
     cb(null, true);
   } else {
     req.fileValidationError = 'NAH GOOD FILE!';
     cb(null, false);
   }
 }});

async function initialize_server(con) {

  try {
      console.log("Initializing Server...")

      const app = express()
      const router = express.Router()

      var server_instance = http.createServer(app)
      server_instance.listen(8080)
      console.log('Listening on 127.0.0.1:8080')

      //create sessions
      app.use(session({
        secret: 'trytocrackthis',
        resave: true,
        saveUninitialized: false
      }))


      //prepare the GET response to return main index
      router.get('/',function(req,res){
        if (req.session && req.session.email) {
          res.redirect('/dashboard')
        } else {
          res.sendFile(path.join(__dirname + '/client/index.html'))
        }
      });

      //requireslogin middleware
      function require_login(req, res, next) {
        if (req.session && req.session.email) {
          return next();
        } else {
          //var err = new Error('You must be logged in to view this page.');
          return res.redirect('/?e=1')
          //err.status = 401;
          //return next(err);
        }
      }

      //login
      app.use(express.json()) //can parse json
      router.post('/login', function(req, res, next) {
        var email = req.body.email
        var password = req.body.password

        //hash md5 and compare to db
        var hash = md5(password)
        //connect to db and verify
        con.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, hash], function (err, result) {
          if (err) throw err
          //console.log(result)
          if (result.length == 1) {
            console.log("User " + email + " has logged in successfully...")
            //set sessions variable
            req.session.email = email
            req.session.userid = result[0]['uid']
            res.send("SUCCESS")
          } else {
            res.send("FAIL")
          }
        });
      });

      router.post('/register', function(req, res, next) {
        var register_email = req.body.register_email
        var register_password = req.body.register_password
        var register_confirm_password = req.body.register_confirm_password

        //DO VERIFICATION STUFF
        //1.check same password then check lenght
        //2. check email if contain email shit, do regex
        var password_correct = false
        if (register_password == register_confirm_password) {
          password_correct = true
        }
        var email_correct = false
        //REGEX here
        email_correct = true

        //CHECK EVERYTHING CORRECT
        //if ()
        //verify if account is not already in DB
        var hash = md5(register_password)

        con.query("SELECT * FROM users WHERE email = ?", [register_email], function (err, result) {
          if (err) throw err
          //console.log(result)
          if (result.length >= 1) { //failsafe
            console.log("Someone tried to create an already existing user...")
            res.end()
          } else {
            con.query("INSERT INTO users VALUES (0,?,?,?)", [register_email, hash,'default_avatar.png'], function (err, resulta) {
              if (err) {
                res.send("FAIL")
                throw err
              } else {
                console.log("A new user : " + register_email + " has just registered with user id : " + resulta['insertId'])
                req.session.email = register_email
                req.session.userid = resulta['insertId']
                res.send("SUCCESS") //redirect in client browser
              }
            })
          }
        });
      });

      //profile page
      router.get('/dashboard', require_login, function(req, res, next) {
        //...
        res.sendFile(path.join(__dirname + '/client/dashboard.html'))
      });


      //post image
      router.post('/post_image', upload.single('data_filez'), function(req, res, next) {
        if (req.session && req.session.email) {

          if(req.fileValidationError) {
            console.log("NAH GOOD")
                return res.redirect('/dashboard?a=2');
          }
          if (req.file) {

          } else {
            return res.redirect('/dashboard?a=3');
          }

          //console.log(req.body.imagioyoyo)
          //console.log(req.file)
          console.log("USER " + req.session.email + " POSTED AN IMAGE MADAFAKA!")
          con.query("INSERT INTO posts VALUES (0,?,?,?)", [req.session.userid, req.file.filename,req.body.imagioyoyo], function (err, result) {
            if (err) {
              res.end("FAIL TO POST") //make this a page boiiii
              throw err
              return
            } else {
              //console.log(result)
              console.log("A new post from : " + req.session.email + " with user id : " + req.session.userid + " has been posted as  : " + req.file.filename + " with description : " + req.body.imagioyoyo)
            }
          })
          res.redirect('/dashboard?a=1')
        } else {
          console.log("FAILED!")
          res.redirect('/e=1')
        }
      });

      router.post('/fetch_feed', function(req,res,next) {
        if (req.session && req.session.email) {
          con.query("SELECT * FROM posts LEFT JOIN users ON posts.userid=users.uid ORDER BY posts.id DESC LIMIT 10", [], function (err, result) {
            if (err) throw err
            //console.log(result)
            //ta do lil bitch -> instead of doing all these queries just use SQL JOIN. BIATCH!- > OK DONE FAGGOT!
            var numbaya = result.length
            for (var i = 0; i < numbaya; i++) {
              var html_post = "<div class='post'><div class='post_description'><span style='font-weight:bold;margin-right:20px;'><a href='/user?uid=" + result[i].userid + "'>" + result[i].email + "</a></span>" + result[i].description + "</div><div class='image_container'><img style='max-height:400px;' src='/uploads/" + result[i].filename + "'/></div>"
              html_post += "<div class='buttons_containah'><div class='like_button' onclick='likario(" + result[i].id + ")'></div><div class='commentario' onclick='commentario(" + result[i].id + ")'></div></div></div>"
              res.write(html_post)
            }
            //console.log(result)
            res.end()
          });
          console.log("User : " + req.session.email + " is fetching the feed!")
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }

      })

      router.post('/fetch_comments', function(req,res,next) {
        if (req.session && req.session.email) {
          console.log(req.body)
          console.log(req.body.zpostid)
          con.query("SELECT * FROM comments JOIN users ON comments.userid=users.uid WHERE postid = ? ORDER BY comments.id", [req.body.zpostid], function (err, result) {
            if (err) throw err
            var numbaya = result.length
            res.write("<div class='numba_commentos'>" + numbaya + " comments on this post</div>")
            for (var i = 0; i < numbaya; i++) {
              var html_comments = "<div class='comment'><div class='commenter_user'>" + result[i].email + "</div><div class='zawords'>" + result[i].comment + "</div></div>"
              res.write(html_comments)
            }
            //write input for comments
            res.write("<div class='input_container_send_message'><input type='text' id='comment_input' name='comment_input' placeholder='Your comment here...'/><button id='sendacomment' onclick='send_comment(" + req.body.zpostid +")'>Send</button></div>")
            //console.log(result)
            res.end()
          });
          console.log("User : " + req.session.email + " is fetching comments from a post!")
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }

      })

      router.post('/send_comment', function(req,res,next) {
        if (req.session && req.session.email) {
          console.log(req.body)
          console.log(req.body.comment)
          console.log(req.body.zpostid)
          con.query("INSERT INTO comments VALUES (0,?,?,?)", [req.session.userid, req.body.zpostid,req.body.comment], function (err, result) {
            if (err) throw err
          });
          console.log("User : " + req.session.email + " posted a comment!")
          res.end()
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }

      })

      //profile page
      router.get('/user', require_login, function(req, res, next) {
        //...
        res.sendFile(path.join(__dirname + '/client/user.html'))
      });

      router.post('/fetch_gallery', function(req,res,next) {
        console.log(req.body.uid)
        if (typeof req.body.uid == 'undefined' || req.body.uid == null) {
          res.send("Error :( try again...")
          res.end()
          return;
        } else {
          if (req.body.uid < 0 ) {
            res.send("Error :( What are you trying to do? ...")
            res.end()
            return;
          }
        }
        if (req.session && req.session.email) {
          console.log(req.body.uid)
          con.query("SELECT * FROM posts WHERE userid = ? ORDER BY RAND() LIMIT 11", [req.body.uid], function (err, result) {
            if (err) throw err

            if (result.lenght < 0) {
              res.send("Error :( This user this not exist... yet!")
              res.end()
              return;
            }

            console.log("User : " + req.session.email + " fetched user gallery for " + req.body.uid)

            var html_to_send = "<div class='grid' style='width:100%;'>" ;
            console.log(result)
            html_to_send += "<div class='grid-sizer'>";
            for (var i = 0; i < result.length; i++) {
              //var j = (Math.random() * Math.floor(100)) % 3;
              var j = i % 2;
              if (j == 0) {
                html_to_send += "<div class='grid-item'>";
              } else {
                html_to_send += "<div class='grid-item grid-item--width2'>";
              }
            html_to_send += "<div class='m_image' style='background-image:url(/uploads/" + result[i].filename + ");background-size:cover;'></div>"
            html_to_send += "</div>"
            }

            html_to_send += "</div></div>";
            res.write(html_to_send);
            res.end()
          });
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }

      })

      router.post('/fetch_user', function(req,res,next) {
        console.log(req.body.uid)
        if (typeof req.body.uid == 'undefined' || req.body.uid == null) {
          res.send("Error :( try again...")
          res.end()
          return;
        } else {
          if (req.body.uid < 0 ) {
            res.send("Error :( What are you trying to do? ...")
            res.end()
            return;
          }
        }
        if (req.session && req.session.email) {
          console.log(req.body.uid)
          con.query("SELECT * FROM users WHERE users.uid = ? LIMIT 1", [req.body.uid], function (err, result) {
            if (err) throw err

            if (result.lenght <= 0) {
              res.send("Error :( This user this not exist... yet!")
              res.end()
              return;
            }

            console.log("User : " + req.session.email + " fetched user " + req.body.uid)
            var same_user = 0;
            if (req.session.userid == req.body.uid) {
              same_user = 1;
            }

            console.log(result)
            var avatar_filename = result[0].avatar_fn;
            if (typeof avatar_filename == 'undefined' || avatar_filename === null || avatar_filename == 'null' || avatar_filename == "" || avatar_filename == " ") {
              avatar_filename = "default_avatar.png";
            }
            console.log(avatar_filename)
            var html_to_send = "<div class='user_avatar_container'>"
            html_to_send += "<div class='user_avatar'><img class='avatar_img' src='/avatar/" + avatar_filename + "'></div>";
            html_to_send += "</div>";

            //show username
            var username = result[0].email
            html_to_send += "<div class='username'>" + username + "</div>";

            html_to_send += "<div class='follow_or_scrap'>"
            con.query("SELECT * FROM followers WHERE followers.followerid = ? AND followers.userid = ? LIMIT 1", [req.session.userid,req.body.uid], function (err, result) {
              if (err) throw err

              var is_following = parseInt(result.length);
              console.log("IS FOLLOWING : " + is_following + "  " + typeof is_following)
              //here is a query to count all of them
              con.query("SELECT * FROM followers WHERE followers.userid = ?", [req.body.uid], function (err, result) {
                if (err) throw err

                var follower_count = 0; //init
                follower_count = result.length;

                html_to_send += "<div class='numba_followers'>" + follower_count + " Follower(s)</div>"

                if (same_user <= 0) {
                  //show follow button
                  if (is_following <= 0) {
                    html_to_send += "<button class='button_user' id='id_button_follow' onclick='follow_user()'>Follow</button>"
                  } else {
                    html_to_send += "<button class='unfollow_button_user' id='id_button_follow' onclick='unfollow_user()'>Unfollow</button>"
                  }
                } else {
                  //don't show follow button
                }

                html_to_send += "<button class='button_user' id='id_scrap_button_user' onclick='scrap_user()'>Scrap</button>"
                html_to_send += "</div>"

                res.write(html_to_send);
                res.end()
              })
            })

          });
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }

      })

      //basicly a copy paste from the other one... so we need to decouple it
      router.post('/unfollow_user', function(req,res,next) {
        console.log(req.body.uid)
        if (typeof req.body.uid == 'undefined' || req.body.uid == null) {
          res.send("Error :( try again...")
          res.end()
          return;
        } else {
          if (req.body.uid < 0 ) {
            res.send("Error :( What are you trying to do? ...")
            res.end()
            return;
          }
        }
        if (req.session && req.session.email) {
          console.log(req.body.uid)
          con.query("SELECT * FROM users WHERE users.uid = ? LIMIT 1", [req.body.uid], function (err, result) {
            if (err) throw err

            if (result.lenght <= 0) {
              res.send("Error :( This user this not exist... yet!")
              res.end()
              return;
            }

            console.log("User : " + req.session.email + " wanna unfollow user " + req.body.uid)
            var same_user = 0;
            if (req.session.userid == req.body.uid) {
              same_user = 1;
              res.send("Error :{ You can't unfollow yourself!")
              res.end();
              return;
            }

            console.log(result)
            var avatar_filename = result[0].avatar_fn;
            if (typeof avatar_filename == 'undefined' || avatar_filename === null || avatar_filename == 'null' || avatar_filename == "" || avatar_filename == " ") {
              avatar_filename = "default_avatar.png";
            }
            console.log(avatar_filename)
            var html_to_send = "<div class='user_avatar_container'>"
            html_to_send += "<div class='user_avatar'><img class='avatar_img' src='/avatar/" + avatar_filename + "'></div>";
            html_to_send += "</div>";

            //show username
            var username = result[0].email
            html_to_send += "<div class='username'>" + username + "</div>";

            html_to_send += "<div class='follow_or_scrap'>"
            con.query("SELECT * FROM followers WHERE followers.followerid = ? AND followers.userid = ? LIMIT 1", [req.session.userid,req.body.uid], function (err, result) {
              if (err) throw err

              var is_following = parseInt(result.length);

              //here is a query to count all of them
              con.query("SELECT * FROM followers WHERE followers.userid = ?", [req.body.uid], function (err, result) {
                if (err) throw err

                var follower_count = 0; //init
                follower_count = result.length;

                if (is_following > 0) {
                  con.query("DELETE FROM followers WHERE followers.followerid = ? AND followers.userid = ?", [req.session.userid,req.body.uid], function (err, result) {
                    html_to_send += "<div class='numba_followers'>" + parseInt(follower_count - 1) + " Follower(s)</div>"
                    html_to_send += "<button class='button_user' id='id_button_follow' onclick='follow_user()'>Follow</button>"
                    html_to_send += "<button class='button_user' id='id_scrap_button_user' onclick='scrap_user()'>Scrap</button>"
                    html_to_send += "</div>"
                    res.write(html_to_send);
                    res.end()
                  })
                } else {
                  html_to_send += "<div class='numba_followers'>" + follower_count +  " Follower(s)</div>"
                  html_to_send += "<button class='button_user' id='id_button_follow' onclick='follow_user()'>Follow</button>"
                  html_to_send += "<button class='button_user' id='id_scrap_button_user' onclick='scrap_user()'>Scrap</button>"
                  html_to_send += "</div>"
                  res.write(html_to_send);
                  res.end()
                }
              })
            })

          });
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }

      })

      router.post('/follow_user', function(req,res,next) {
        console.log(req.body.uid)
        if (typeof req.body.uid == 'undefined' || req.body.uid == null) {
          res.send("Error :( try again...")
          res.end()
          return;
        } else {
          if (req.body.uid < 0 ) {
            res.send("Error :( What are you trying to do? ...")
            res.end()
            return;
          }
        }
        if (req.session && req.session.email) {
          console.log(req.body.uid)
          con.query("SELECT * FROM users WHERE users.uid = ? LIMIT 1", [req.body.uid], function (err, result) {
            if (err) throw err

            if (result.lenght <= 0) {
              res.send("Error :( This user this not exist... yet!")
              res.end()
              return;
            }

            console.log("User : " + req.session.email + " wanna follow user " + req.body.uid)
            var same_user = 0;
            if (req.session.userid == req.body.uid) {
              same_user = 1;
              res.send("Error :{ You can't follow yourself!")
              res.end();
              return;
            }

            console.log(result)
            var avatar_filename = result[0].avatar_fn;
            if (typeof avatar_filename == 'undefined' || avatar_filename === null || avatar_filename == 'null' || avatar_filename == "" || avatar_filename == " ") {
              avatar_filename = "default_avatar.png";
            }
            console.log(avatar_filename)
            var html_to_send = "<div class='user_avatar_container'>"
            html_to_send += "<div class='user_avatar'><img class='avatar_img' src='/avatar/" + avatar_filename + "'></div>";
            html_to_send += "</div>";

            //show username
            var username = result[0].email
            html_to_send += "<div class='username'>" + username + "</div>";

            html_to_send += "<div class='follow_or_scrap'>"
            con.query("SELECT * FROM followers WHERE followers.followerid = ? AND followers.userid = ? LIMIT 1", [req.session.userid,req.body.uid], function (err, result) {
              if (err) throw err

              var is_following = parseInt(result.length);

              //here is a query to count all of them
              con.query("SELECT * FROM followers WHERE followers.userid = ?", [req.body.uid], function (err, result) {
                if (err) throw err

                var follower_count = 0; //init
                follower_count = result.length;

                if (is_following <= 0) {
                  con.query("INSERT INTO followers VALUES (0,?,?)", [req.body.uid, req.session.userid], function (err, result) {
                    html_to_send += "<div class='numba_followers'>" + parseInt(follower_count + 1) + " Follower(s)</div>"
                    html_to_send += "<button class='unfollow_button_user' id='id_button_follow' onclick='unfollow_user()'>Unfollow</button>"
                    html_to_send += "<button class='button_user' id='id_scrap_button_user' onclick='scrap_user()'>Scrap</button>"
                    html_to_send += "</div>"
                    res.write(html_to_send);
                    res.end()
                  })
                } else {
                  html_to_send += "<div class='numba_followers'>" + follower_count +  " Follower(s)</div>"
                  html_to_send += "<button class='unfollow_button_user' id='id_button_follow' onclick='unfollow_user()'>Unfollow</button>"
                  html_to_send += "<button class='button_user' id='id_scrap_button_user' onclick='scrap_user()'>Scrap</button>"
                  html_to_send += "</div>"
                  res.write(html_to_send);
                  res.end()
                }
              })
            })

          });
        } else {
          res.send("Error :( log back again") //Make if receive that redirect to main...
        }
      })

      // GET /logout
      router.get('/logout', function(req, res, next) {
        if (req.session) {
          //delete session object
          if (req.session.email)
            console.log("User " + req.session.email + " has successfully logged out...")

          req.session.destroy(function(err) {
            if(err) {
              return next(err);
            } else {
              return res.redirect('/?e=2')
            }
          });
        }
      });

      //add the router to the express app
      app.use('/', router)

      //add to the app the route to all static files (csv data, images, etc)
      app.use(express.static(__dirname + '/'))
      app.use(express.static(__dirname + '/client/'))
      app.use(express.static(__dirname + '/client/assets/'))

      console.log("Server ready and running!")

      //return the promise of having a server instance
      return server_instance

    } catch (err) {
      console.log(err)
    }
}

/////////////////////////////////////
///
/// DB init
///
/////////////////////////////////////

async function initDB() {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "test123", // corresponding password
    database: "scrapbook_db", // use the specified database
    acquireTimeout:100000
  });

  con.connect(function(err) {
    if (err) throw err
  })

  return con
}

//initialize server
initDB()
  .then( con_instance => {
    initialize_server(con_instance)
})
