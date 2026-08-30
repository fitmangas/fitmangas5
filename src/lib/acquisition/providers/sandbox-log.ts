/** Journal visible des envois simulés (mode SANDBOX). */
const sandboxLog: Array<{ at: string; provider: string; action: string; detail: string }> = [];
const MAX = 200;

export function logSandboxSend(provider: string, action: string, detail: string): string {
  const line = `[SANDBOX ${provider}] ${action} — ${detail}`;
  sandboxLog.unshift({ at: new Date().toISOString(), provider, action, detail: line });
  if (sandboxLog.length > MAX) sandboxLog.length = MAX;
  console.info(`[Acquisition SANDBOX] ${line}`);
  return line;
}

export function getSandboxLog(limit = 50): typeof sandboxLog {
  return sandboxLog.slice(0, limit);
}
