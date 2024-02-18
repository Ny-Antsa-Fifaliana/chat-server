//import
const cors = require('cors');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const {addUser, removeUser, getUser, getUsersInRoom} =require('./users');

const router = require('./router');
const PORT = process.env.PORT || 5000;

//Create server
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
    //receive connection
    io.on('connection',(socket)=>{
        // event joindre
        socket.on('joindre', ({name,room}, callback)=>{
          const{error,user}= addUser({id: socket.id,name,room });

          if(error){
            return callback(error);
          }
          socket.emit('message',{user: 'admin', text: user.name+', Bienvenue dans : ' + user.room});
          socket.broadcast.to(user.room).emit('message',{user: 'admin', text: user.name+' a rejoint le salon'}); // tous le monde sauf le client actuel
          socket.join(user.room); // ajouter au room ou creer un room s'il n'existe pas
        
          io.to(user.room).emit('roomData',{users: getUsersInRoom(user.room)});
          // callback();
          
        });


        //event sendMessage
        socket.on('sendMessage',(message, callback)=>{
          const user = getUser(socket.id);
          io.to(user.room).emit('message',{user: user.name, text:message});// send to all
          io.to(user.room).emit('roomData',{users: getUsersInRoom(user.room)}); 
         
          callback();
        })

        // event disconnect
        socket.on('disconnect', ()=>{
            const user= removeUser(socket.id);
            if(user){
              io.to(user.room).emit('roomData',{users: getUsersInRoom(user.room)});
              io.to(user.room).emit('message',{user: 'admin', text: user.name+' a été déconnecté!'});

            }
        })
    });
   
 // Configurer CORS avec des options spécifiques
 app.use(cors({
  origin: '*'
  }));  
// use middleware
app.use(router);
//listen
server.listen(PORT, ()=> console.log('server started on port '+ PORT));

