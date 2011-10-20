# What is Eagle Lib
Eagle is a realtime connection Lib for Node.JS with API support based on Socket.IO and Express Framework
It uses Socket.IO to provide real time connection and express to provide API routes

## How it works?
Target browser client should run Socket.IO-Client to start transport. the client can create a room, and then get a room id or join a existed room.
Eagle provide APIs to get all room ids and other information about clients in room. you also can ```POST``` to room API to broadcast events to all clients in room.

## What can I do by using Eagle?
* You can monitor information of LBS Native App at web browser on computer
* You can create a native admin client to notify online users
* You can let a mobile device as a controller to control web game
* and a lot of other stuffs by using this Lib

## How to use
//TODO not ready _for now it is under development. so you can run demo first to try_

# Dependence
* The lib should be run on express framework(for session and router support)
* Using Socket.IO

# Contact me
* Weibo: http://weibo.com/boisgames
* Mail: btspoony[AT]gmail.com