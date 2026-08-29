import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(frontendDir, "../backend");
const BACKEND_PORT = 8080;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

function springBootPlugin() {
  let child;

  function stopBackend() {
    if (!child || child.killed) {
      return;
    }
    child.kill();
  }

  return {
    name: "spring-boot",
    apply: "serve",
    async configureServer(server) {
      const alreadyUp = await isPortOpen(BACKEND_PORT);

      if (alreadyUp) {
        server.config.logger.info(
          "Spring Boot já está em http://127.0.0.1:8080"
        );
        return;
      }

      const mvnw = path.join(backendDir, "mvnw.cmd");

      server.config.logger.info(
        "Iniciando Spring Boot (backend) na porta 8080..."
      );

      const tmpDir = path.join(backendDir, ".tmp");

      child = spawn(mvnw, ["spring-boot:run"], {
        cwd: backendDir,
        stdio: "inherit",
        windowsHide: true,
        env: {
          ...process.env,
          JAVA_TOOL_OPTIONS: `-Djava.io.tmpdir=${tmpDir}`
        }
      });

      child.on("exit", (code) => {
        if (code && code !== 0) {
          server.config.logger.error(
            `Spring Boot encerrou com código ${code}`
          );
        }
      });

      process.once("exit", stopBackend);
      server.httpServer?.once("close", stopBackend);
    }
  };
}

export default defineConfig({
  plugins: [react(), springBootPlugin()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${BACKEND_PORT}`,
        changeOrigin: true
      }
    }
  }
});
