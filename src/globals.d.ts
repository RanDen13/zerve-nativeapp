declare module "*.css";

type HealthCheckResult = {
  ok: boolean;
  status: number;
  body: string | null;
  reason?: string;
};

interface Window {
  kioskApi: {
    checkHealth: () => Promise<HealthCheckResult>;
  };
}
