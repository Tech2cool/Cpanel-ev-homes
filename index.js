import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import { exec } from "child_process";
import serverModel from "./src/models/server.model.js";
import pm2 from "pm2";
import "dotenv/config";
import axios from "axios";
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoURI = process.env.DB_URL;

connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Endpoint to trigger git pull and pm2 restart
app.post("/start/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "serverId is required",
    });
  }

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      });
    }

    const { fullpath, serverId, serverType } = repo;
    let command = `cd ${fullpath} && npm i && pm2 start --name ${serverId} --json`;
    if (serverType === "flutter-web") {
      command = `cd ${fullpath} && flutter pub get && flutter build web`;
    }
    // Run git pull, install dependencies, and restart the server

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Command execution failed",
          error: error.message,
        });
      }

      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).json({
          success: false,
          message: "Command execution error",
          error: stderr,
        });
      }

      console.log("stdout:", stdout);

      try {
        const parsedOutput = JSON.parse(stdout); // Parse the JSON output from the PM2 command
        repo.status = true;
        repo.save();

        res.json({
          success: true,
          message: "Server started successfully",
          data: parsedOutput,
        });
      } catch (parseError) {
        console.error("Parsing Error:", parseError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to parse PM2 output",
          error: parseError.message,
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
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

    const { fullpath, serverId, serverType } = repo;

    // Run git pull and pm2 restart
    let command = `cd ${fullpath} && git reset --hard HEAD && git pull --force && npm i && pm2 restart ${serverId}`;
    if (serverType === "flutter-web") {
      command = `cd ${fullpath} && git reset --hard HEAD && git pull --force && flutter pub get && flutter build web`;
    }

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

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "serverId is required",
    });
  }

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      });
    }

    const { fullpath, serverId, serverType } = repo;

    // Run PM2 stop command
    const command = `cd ${fullpath} && pm2 stop ${serverId} --json`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Command execution failed",
          error: error.message,
        });
      }

      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).json({
          success: false,
          message: "Command execution error",
          error: stderr,
        });
      }

      console.log("stdout:", stdout);

      try {
        const parsedOutput = JSON.parse(stdout); // Parse JSON output from PM2
        repo.status = false; // Update server status
        repo.save();

        res.json({
          success: true,
          message: "Server stopped successfully",
          data: parsedOutput,
        });
      } catch (parseError) {
        console.error("Parsing Error:", parseError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to parse PM2 output",
          error: parseError.message,
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
// Endpoint to restart server
app.post("/restart/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "serverId is required",
    });
  }

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      });
    }

    const { fullpath, serverId, serverType } = repo;

    // Run git pull, install dependencies, and restart the server
    const command = `cd ${fullpath} && npm i && pm2 restart ${serverId} --json`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Command execution failed",
          error: error.message,
        });
      }

      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).json({
          success: false,
          message: "Command execution error",
          error: stderr,
        });
      }

      console.log("stdout:", stdout);

      try {
        const parsedOutput = JSON.parse(stdout); // Parse the JSON output from PM2
        repo.status = true; // Update server status
        repo.save();

        res.json({
          success: true,
          message: "Server restarted successfully",
          data: parsedOutput,
        });
      } catch (parseError) {
        console.error("Parsing Error:", parseError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to parse PM2 output",
          error: parseError.message,
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// Endpoint to get server info
app.get("/server/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) return res.status(400).send("serverId is required");

  try {
    // Fetch repository details from MongoDB
    const repo = await serverModel.findOne({ serverId: id });

    if (!repo) return res.status(404).send("Server not found");

    // Execute PM2 command to get info about the specific server by name
    const command = `pm2 jlist --name ${repo.serverId}`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
          success: false,
          message: `Error: ${error.message}`,
        });
      }

      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).json({
          success: false,
          message: `stderr: ${stderr}`,
        });
      }

      // Parse the output from pm2 jlist (it's JSON)
      try {
        const pm2Info = JSON.parse(stdout);

        // Update the repo with the new info from PM2
        if (pm2Info.length > 0) {
          const serverInfo = pm2Info[0]; // The first entry is the one with the matching serverId
          repo.status = serverInfo.pm2_env.status; // Example: Update status based on PM2 info
          repo.memory = serverInfo.monit.memory; // Example: Update memory usage
          repo.cpu = serverInfo.monit.cpu; // Example: Update memory usage
          repo.mode = serverInfo.pm2_env.exec_mode; // Example: Update memory usage
          repo.pid = serverInfo.pid; // Example: Update memory usage

          // Save updated repo
          await repo.save();

          // Return the updated server info
          res.status(200).json({
            success: true,
            message: "Server info updated successfully",
            data: repo,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Server not found in PM2 list",
          });
        }
      } catch (parseError) {
        console.error("Parsing error:", parseError.message);
        return res.status(500).json({
          success: false,
          message: "Error parsing PM2 output",
        });
      }
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

// Endpoint to trigger
app.post("/pm2-servers-list", async (req, res) => {
  try {
    const command = `pm2 jlist`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error:", error.message);
        return res.status(500).json({
          success: false,
          message: "Command execution failed",
          error: error.message,
        });
      }

      if (stderr) {
        console.error("stderr:", stderr);
        return res.status(500).json({
          success: false,
          message: "Command execution error",
          error: stderr,
        });
      }

      try {
        const processes = JSON.parse(stdout); // Parse the JSON output
        const runningInstances = processes.map((proc) => ({
          id: proc.pm_id,
          serverId: proc.name,
          mode: proc.pm2_env.exec_mode,
          pid: proc.pid,
          status: proc.pm2_env.status,
          cpu: proc.monit.cpu,
          memory: proc.monit.memory,
        }));

        if (runningInstances?.length > 0) {
          runningInstances.map(async (rp) => {
            await serverModel.findOneAndUpdate(
              { serverId: rp?.serverId },
              {
                ...rp,
              }
            );
          });
        }

        res.json({
          success: true,
          message: "PM2 running instances fetched successfully",
          data: runningInstances,
        });
      } catch (parseError) {
        console.error("Parsing Error:", parseError.message);
        res.status(500).json({
          success: false,
          message: "Failed to parse PM2 output",
          error: parseError.message,
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
