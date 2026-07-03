import { Schema, model, Document, Types } from 'mongoose';

export interface IMatch extends Document {
  _id: string;
  user1: Types.ObjectId; // Reference to User
  user2: Types.ObjectId; // Reference to User
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>({
  user1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Ensure that each pair of users only has one match (unique combination)
MatchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Prevent matching with oneself
MatchSchema.pre('save', function(next) {
  if (this.user1.equals(this.user2)) {
    const err = new Error('User cannot match with themselves');
    next(err);
  } else {
    next();
  }
});

export const Match = model<IMatch>('Match', MatchSchema);