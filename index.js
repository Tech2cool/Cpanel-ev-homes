import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import { exec } from "child_process";
import serverModel from "./src/models/server.model.js";
import pm2 from "pm2";
import "dotenv/config";

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

    const { fullpath, serverId } = repo;

    // Run git pull, install dependencies, and restart the server
    const command = `cd ${fullpath} && npm i && pm2 start --name ${serverId} --json`;

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

    const { fullpath, serverId } = repo;

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

    const { fullpath, serverId } = repo;

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

// Endpoint to get all servers
app.get("/servers-pm2", (req, res) => {
  const list = [];
  try {
    pm2.connect((err) => {
      if (err) {
        console.error("Error connecting to PM2:", err);
        process.exit(2);
      }

      pm2.list((err, processList) => {
        if (err) {
          console.error("Error fetching process list:", err);
          pm2.disconnect(); // Disconnect from PM2
          return;
        }

        // Map the process list to get name, ID, and status
        const processDetails = processList.map((proc) => {
          list.push({
            id: proc?.pm_id,
            name: proc?.name,
            status: proc?.pm2_env?.status,
          });
          return {
            id: proc?.pm_id,
            name: proc?.name,
            status: proc?.pm2_env?.status,
          };
        });
        console.log("All PM2 Processes:");
        console.table(list);

        pm2.disconnect(); // Disconnect from PM2
      });
    });
    return res.send({ data: list });
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
