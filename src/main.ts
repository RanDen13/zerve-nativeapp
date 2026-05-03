import { app, BrowserWindow, ipcMain } from "electron";
import started from "electron-squirrel-startup";
import path from "node:path";

const HEALTH_ENDPOINT = "https://reservation.safehub-lcup.uk/api/health";

type HealthCheckResult = {
  ok: boolean;
  status: number;
  body: string | null;
  reason?: string;
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#f6f8fb",
    icon: path.join(__dirname, "../icon.ico"),
    // Start in fullscreen/kiosk for a dedicated kiosk experience
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

ipcMain.handle("kiosk:health-check", async (): Promise<HealthCheckResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(HEALTH_ENDPOINT, {
      method: "GET",
      signal: controller.signal,
      headers: {
        accept: "text/plain,application/json;q=0.9,*/*;q=0.8",
      },
    });

    const body = await response.text();
    const normalized = body.trim().toLowerCase();
    const hasOkMarker = normalized.length > 0 && normalized.includes("ok");

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body,
        reason: `Health endpoint returned HTTP ${response.status}.`,
      };
    }

    if (!hasOkMarker) {
      return {
        ok: false,
        status: response.status,
        body,
        reason: "Health endpoint did not return an OK payload.",
      };
    }

    return {
      ok: true,
      status: response.status,
      body,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown health check error.";

    return {
      ok: false,
      status: 0,
      body: null,
      reason: message,
    };
  } finally {
    clearTimeout(timeout);
  }
});

// Set app icon for taskbar/dock
app.setAppUserModelId("com.zerve.kiosk");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
