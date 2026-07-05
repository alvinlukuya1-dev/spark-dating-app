import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  _id: string;
  user: Types.ObjectId;
  content?: string;
  image?: string;
  likes: Types.ObjectId[];
  comments: { user: Types.ObjectId; text: string; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 1000 },
  image: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

PostSchema.index({ createdAt: -1 });

export const Post = model<IPost>('Post', PostSchema);
