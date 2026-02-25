// Runs in the AudioWorklet thread.
// Converts Float32 microphone samples to Int16 PCM and posts to main thread.

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this._buffer = [];
    this._bufferSize = options.processorOptions?.bufferSize ?? 2048;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // Mono channel

    for (let i = 0; i < channelData.length; i++) {
      this._buffer.push(channelData[i]);
    }

    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.splice(0, this._bufferSize);
      const pcm16 = this._float32ToInt16(new Float32Array(chunk));
      this.port.postMessage({ type: "audio", data: pcm16 }, [pcm16.buffer]);
    }

    return true;
  }

  _float32ToInt16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return int16;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
