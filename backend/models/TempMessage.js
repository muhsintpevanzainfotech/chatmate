import mongoose from 'mongoose';

const tempMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ciphertext: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    senderPublicKey: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index: document expires at specified date
    },
  },
  {
    timestamps: true,
  }
);

const TempMessage = mongoose.model('TempMessage', tempMessageSchema);
export default TempMessage;
