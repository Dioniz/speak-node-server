// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data, id) {
    // we tell the client to execute 'new message' in a id
    socket.broadcast.to(id).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, id) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected in that id
    socket.broadcast.to(id).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });
  
  socket.on('join room', function (id){
    socket.join(id);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function (id) {
    socket.broadcast.to(id).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function (id) {
    socket.broadcast.to(id).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function (id) {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(id).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});