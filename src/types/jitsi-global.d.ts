export {};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        jwt?: string;
        parentNode: HTMLElement;
        width?: string | number;
        height?: string | number;
        lang?: string;
        userInfo?: {
          displayName: string;
          email: string;
        };
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
      },
    ) => {
      dispose: () => void;
      addListener: (event: string, callback: (...args: unknown[]) => void) => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
    };
  }
}
