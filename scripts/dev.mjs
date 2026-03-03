import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
let shuttingDown = false;

startProcess("dev:web");
startProcess("dev:party");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

function startProcess(scriptName) {
  const child = spawn(npmCommand, ["run", scriptName], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const exitCode = signal ? 1 : (code ?? 1);
    shutdown(exitCode);
  });

  child.on("error", () => {
    if (shuttingDown) {
      return;
    }

    shutdown(1);
  });
}

function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(exitCode);
}
