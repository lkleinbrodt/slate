// Stands in for lib/voice/call.ts, which loads native WebRTC modules. Tests give the voice
// store a fake call through setVoiceDeps instead.
export class VoiceCall {
  constructor() {
    throw new Error("VoiceCall is native; pass createCall to setVoiceDeps in tests");
  }
}
