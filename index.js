//import
const cors = require("cors");
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const router = require("./router");
const PORT = process.env.PORT || 5000;

// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");

    if (fs.existsSync(uploadPath)) {
      const files = fs.readdirSync(uploadPath);
      files.forEach((file) => {
        const filePath = path.join(uploadPath, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    } else {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//Create server
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Exposez le dossier 'uploads' pour qu'il soit accessible publiquement
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.post("/upload", upload.array("file"), (req, res) => {
  const filePaths = req.files.map((file) => `/uploads/${file.filename}`);
  const { name, room } = req.body;
  res.json({ filePaths });

  io.to(room).emit("message", {
    user: name,
    text: filePaths.join(", "),
  });
});

//receive connection
io.on("connection", (socket) => {
  // event joindre
  socket.on("joindre", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      return callback(error);
    }
    socket.emit("message", {
      user: "admin",
      text: user.name + ", Bienvenue dans : " + user.room,
    });
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: user.name + " a rejoint le salon",
    }); // tous le monde sauf le client actuel
    socket.join(user.room); // ajouter au room ou creer un room s'il n'existe pas

    io.to(user.room).emit("roomData", { users: getUsersInRoom(user.room) });
    // callback();
  });

  //event sendMessage
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message }); // send to all
    io.to(user.room).emit("roomData", { users: getUsersInRoom(user.room) });

    callback();
  });

  // event disconnect
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("roomData", { users: getUsersInRoom(user.room) });
      io.to(user.room).emit("message", {
        user: "admin",
        text: user.name + " a été déconnecté!",
      });
    }
  });
});

// use middleware
app.use(router);
//listen
server.listen(PORT, () => console.log("server started on port " + PORT));
