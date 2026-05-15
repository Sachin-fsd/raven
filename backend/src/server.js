import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chats.js';
import Chat from './models/Chat.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*', credentials: true }));
app.use(express.json());
app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    socket.join(userId);
  });

  socket.on('message:send', async (payload) => {
    const msg = await Chat.create({
      sender: payload.sender,
      receiver: payload.receiver,
      text: payload.text,
      status: 'sent'
    });

    socket.emit('message:status', { tempId: payload.tempId, messageId: msg._id, status: 'sent' });

    const receiverRoom = io.sockets.adapter.rooms.get(payload.receiver);
    if (receiverRoom && receiverRoom.size > 0) {
      await Chat.findByIdAndUpdate(msg._id, { status: 'delivered' });
      io.to(payload.receiver).emit('message:new', { ...msg.toObject(), status: 'delivered' });
      socket.emit('message:delivered', { messageId: msg._id, status: 'delivered' });
    }
  });

  socket.on('message:read', async ({ messageId }) => {
    await Chat.findByIdAndUpdate(messageId, { status: 'read' });
    const message = await Chat.findById(messageId);
    io.to(message.sender.toString()).emit('message:read:update', { messageId, status: 'read' });
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`));
});
