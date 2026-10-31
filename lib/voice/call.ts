import { PipecatClient, type Transport, type TransportState } from "@pipecat-ai/client-js";
import { type CallMessage, type SessionRequest, type ThreepioClient } from "./threepio";

import { DailyMediaManager } from "@pipecat-ai/react-native-daily-media-manager";
import { RNSmallWebRTCTransport } from "@pipecat-ai/react-native-small-webrtc-transport";

// One voice call with Threepio: create the session, connect over WebRTC (Pipecat's React
// Native client), follow the call's events, hang up. Threepio sends `call_started` with the
// call's id once the client is ready, and a `message` for each line as it's saved; the saved
// transcript is fetched afterwards with GET /v1/calls/{id}.

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
      await this.client.connect({ webrtcRequestParams: { endpoint: this.threepio.url(session.connect_url) } });
    } catch (e) {
      this.finish("failed", e instanceof Error ? e.message : String(e));
      await this.client?.disconnect().catch(() => {});
    }
  }

  async hangUp(): Promise<void> {
    await this.client?.disconnect().catch(() => {});
    this.finish("ended");
  }

  setMuted(muted: boolean) {
    this.client?.enableMic(!muted);
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
