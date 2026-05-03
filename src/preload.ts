// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

type HealthCheckResult = {
  ok: boolean;
  status: number;
  body: string | null;
  reason?: string;
};

contextBridge.exposeInMainWorld("kioskApi", {
  checkHealth: () =>
    ipcRenderer.invoke("kiosk:health-check") as Promise<HealthCheckResult>,
});
