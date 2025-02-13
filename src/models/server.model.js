import mongoose from "mongoose";

export const serverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    serverId: { type: String, required: true },
    serverType: { type: String, required: true },
    fullpath: { type: String, required: true },
    status: { type: String, default: "offline" },
    mode: { type: String, default: "" },
    pid: { type: Number, default: 0 },
    cpu: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const serverModel = mongoose.model("servers", serverSchema);
export default serverModel;
