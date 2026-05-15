import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

chatSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export default mongoose.model('Chat', chatSchema);
