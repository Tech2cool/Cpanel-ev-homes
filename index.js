import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import { exec } from "child_process";
import serverModel from "./src/models/server.model.js";

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoURI = "mongodb://evhomes:EVHomes92025@127.0.0.1:27017/ev_homes_main";

connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Endpoint to trigger git pull and pm2 restart
app.post("/start/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).send("serverId is required");

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) return res.status(404).send("server not found");

    const { fullpath, serverId } = repo;

    // Run git pull and pm2 restart
    const command = `cd ${fullpath} && npm i && pm2 start --name ${serverId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).send(`Error: ${error.message}`);
      }
      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).send(`stderr: ${stderr}`);
      }
      console.log("stdout:", stdout);
      repo.status = true;
      repo.save();
      res.send({ message: "Server Started Succesfully", stdout });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Endpoint to trigger git pull and pm2 restart
app.post("/update/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).send("serverId is required");

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) return res.status(404).send("server not found");

    const { fullpath, serverId } = repo;

    // Run git pull and pm2 restart
    const command = `cd ${fullpath} && git pull --force && npm i && pm2 restart ${serverId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).send(`Error: ${error.message}`);
      }
      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).send(`stderr: ${stderr}`);
      }
      console.log("stdout:", stdout);
      repo.status = true;
      repo.save();

      res.send({ message: "Update successful", stdout });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Endpoint to stop server
app.post("/stop/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).send("serverId is required");

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) return res.status(404).send("server not found");

    const { fullpath, serverId } = repo;

    // Run git pull and pm2 restart
    const command = `cd ${fullpath} && pm2 stop ${serverId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).send(`Error: ${error.message}`);
      }
      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).send(`stderr: ${stderr}`);
      }
      console.log("stdout:", stdout);
      repo.status = false;
      repo.save();

      res.send({ message: "Update successful", stdout });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
// Endpoint to restart server
app.post("/restart/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).send("serverId is required");

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) return res.status(404).send("server not found");

    const { fullpath, serverId } = repo;

    // Run git pull and pm2 restart
    const command = `cd ${fullpath} && npm i && pm2 restart ${serverId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).send(`Error: ${error.message}`);
      }
      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).send(`stderr: ${stderr}`);
      }
      console.log("stdout:", stdout);
      repo.status = true;
      repo.save();

      res.send({ message: "Server Started Succesfully", stdout });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Endpoint to get server info
app.get("/server/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).send("serverId is required");

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });
    res.status(200).json({
      data: repo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
// Endpoint to get all servers
app.get("/servers", async (req, res) => {
  try {
    const repo = await serverModel.find();
    return res.send({ data: repo });
  } catch (error) {
    return res.send(error);
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Git Update Server is Running 🚀");
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
