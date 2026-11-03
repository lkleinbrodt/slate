import { PipecatClient, type Transport, type TransportState } from "@pipecat-ai/client-js";
import { type CallMessage, type SessionRequest, type ThreepioClient } from "./threepio";

import { DailyMediaManager } from "@pipecat-ai/react-native-daily-media-manager";
import { RNSmallWebRTCTransport } from "@pipecat-ai/react-native-small-webrtc-transport";

// One voice call with Threepio: create the session, connect over WebRTC (Pipecat's React
// Native client), follow the call's events, hang up. Threepio sends `call_started` with the
// call's id once the client is ready, and a `message` for each line as it's saved; the saved
// transcript is fetched afterwards with GET /v1/calls/{id}.

// A connection that never comes up, or a disconnect that never returns (the server hung or
// died), must not leave the call stuck with buttons that do nothing.
const CONNECT_TIMEOUT_MS = 30_000;
const DISCONNECT_TIMEOUT_MS = 4_000;

function within<T>(work: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export type CallPhase = "connecting" | "live" | "ended" | "failed";

export interface CallEvents {
  onPhase?: (phase: CallPhase, error?: string) => void;
  onCallId?: (callId: string) => void;
  onMessage?: (index: number, message: CallMessage) => void;
}

export class VoiceCall {
  private client: PipecatClient | null = null;
  private ended = false;
  callId: string | null = null;

  constructor(
    private readonly threepio: ThreepioClient,
    private readonly events: CallEvents = {}
  ) {}

  async start(request: SessionRequest): Promise<void> {
    this.events.onPhase?.("connecting");
    try {
      const session = await this.threepio.createSession(request);
      this.client = new PipecatClient({
        // The cast is for types only: RN WebRTC's device kinds include "audio", the DOM's don't
        transport: new RNSmallWebRTCTransport({ mediaManager: new DailyMediaManager() }) as unknown as Transport,
        enableMic: true,
        enableCam: false,
        callbacks: {
          onBotReady: () => this.events.onPhase?.("live"),
          onServerMessage: (data: { type?: string } & Record<string, unknown>) => this.handleServerMessage(data),
          onTransportStateChanged: (state: TransportState) => {
            if (state === "error") this.finish("failed", "The call's connection failed.");
          },
          onDisconnected: () => this.finish("ended"),
          onError: (message) => {
            const text = (message.data as { message?: string } | undefined)?.message;
            this.finish("failed", text ?? "Something went wrong on the call.");
          },
        },
      });
      await within(
        this.client.connect({ webrtcRequestParams: { endpoint: this.threepio.url(session.connect_url) } }),
        CONNECT_TIMEOUT_MS,
        "Threepio didn't answer the call. Is it running?"
      );
    } catch (e) {
      this.finish("failed", e instanceof Error ? e.message : String(e));
      await this.disconnect();
    }
  }

  async hangUp(): Promise<void> {
    // Finish first: the phone is done with the call whether or not the server noticed
    this.finish("ended");
    await this.disconnect();
  }

  private async disconnect() {
    const client = this.client;
    this.client = null;
    await within(client?.disconnect() ?? Promise.resolve(), DISCONNECT_TIMEOUT_MS, "disconnect timed out").catch(() => {});
  }

  setMuted(muted: boolean) {
    try {
      this.client?.enableMic(!muted);
    } catch {
      // the connection is going away anyway
    }
  }

  private handleServerMessage(data: { type?: string } & Record<string, unknown>) {
    if (data.type === "call_started" && typeof data.call_id === "string") {
      this.callId = data.call_id;
      this.events.onCallId?.(data.call_id);
    } else if (data.type === "message" && typeof data.index === "number") {
      const { role, text, at, interrupted } = data as unknown as CallMessage;
      this.events.onMessage?.(data.index, { role, text, at, ...(interrupted === undefined ? {} : { interrupted }) });
    }
  }

  private finish(phase: "ended" | "failed", error?: string) {
    if (this.ended) return;
    this.ended = true;
    this.events.onPhase?.(phase, error);
  }
}
