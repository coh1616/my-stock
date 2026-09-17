import mongoose, { Schema } from "mongoose";

export interface WatchlistItemDoc {
  stockNo: string;
  name: string;
  createdAt: Date;
}

const WatchlistItemSchema = new Schema<WatchlistItemDoc>({
  stockNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const WatchlistItem =
  mongoose.models.WatchlistItem ??
  mongoose.model<WatchlistItemDoc>("WatchlistItem", WatchlistItemSchema);
