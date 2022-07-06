const path=require('path');
const http=require('http');
const express=require('express');
const socketio=require('socket.io');
const app=express();
const server=http.createServer(app);
const io=socketio(server);
const formatMessage=require('./utils/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users');
const { Socket } = require('dgram');
app.use(express.static(path.join(__dirname,'chatApp')));
const Admin='chatBot'
io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{
        const user=userJoin(socket.id,username,room);
        socket.join(user.room);
        socket.emit('message',formatMessage(Admin,'Welcome to GupShup!'))
        // broadcast when a new user joins
        socket.broadcast.to(user.room).emit('message',formatMessage(Admin,`${user.username} has joined the chat`))
         // send users and room info
         io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room),
         })
    })
   
    // LISTEN FOR CHAT MESSAGES
    socket.on('chatMessage',msg=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg))
    });
  // RUNS WHEN CLIENT DISSCONECTS
  socket.on('disconnect',()=>{
    const user=userLeave(socket.id);
    if(user){

        io.to(user.room).emit('message',formatMessage(Admin,`${user.username} has left the chat`));
    }
    io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room),
     })
    
});
});

const PORT=3000 || process.env.PORT; 

server.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
