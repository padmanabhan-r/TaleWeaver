// Runs in the AudioWorklet thread.
// Buffers incoming Int16 PCM chunks and plays them out as Float32.

const BUFFER_MAX_SAMPLES = 48000 * 10; // 10 seconds max buffer

class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = [];
    this._totalSamples = 0;
    this._isPlaying = false;
    this._chunkOffset = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === "audio") {
        this._enqueue(event.data.data);
      } else if (event.data.type === "clear") {
        this._clear();
      }
    };
  }

  _enqueue(int16Array) {
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
    }

    if (this._totalSamples < BUFFER_MAX_SAMPLES) {
      this._queue.push(float32);
      this._totalSamples += float32.length;
      this._isPlaying = true;
    }
  }

  _clear() {
    this._queue = [];
    this._totalSamples = 0;
    this._isPlaying = false;
    this._chunkOffset = 0;
    this.port.postMessage({ type: "cleared" });
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    const outputLength = output.length;

    if (!this._isPlaying || this._queue.length === 0) {
      output.fill(0);
      return true;
    }

    let outputOffset = 0;

    while (outputOffset < outputLength && this._queue.length > 0) {
      const chunk = this._queue[0];
      const chunkRemaining = chunk.length - this._chunkOffset;
      const toCopy = Math.min(chunkRemaining, outputLength - outputOffset);

      output.set(
        chunk.subarray(this._chunkOffset, this._chunkOffset + toCopy),
        outputOffset
      );

      outputOffset += toCopy;
      this._chunkOffset += toCopy;

      if (this._chunkOffset >= chunk.length) {
        this._queue.shift();
        this._totalSamples -= chunk.length;
        this._chunkOffset = 0;
      }
    }

    if (outputOffset < outputLength) {
      output.fill(0, outputOffset);
      this._isPlaying = this._queue.length > 0;
    }

    return true;
  }
}

registerProcessor("audio-playback-processor", AudioPlaybackProcessor);
