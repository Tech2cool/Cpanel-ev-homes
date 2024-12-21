import mongoose from "mongoose";

export const serverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: Boolean, default: false },
    serverId: { type: String, required: true },
    fullpath: { type: String, required: true },
  },
  { timestamps: true }
);
const serverModel = mongoose.model("servers", serverSchema);
export default serverModel;
