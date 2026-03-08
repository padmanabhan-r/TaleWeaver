// Runs in the AudioWorklet thread.
// Buffers incoming Int16 PCM chunks and plays them out as Float32.

const BUFFER_MAX_SAMPLES = 24000 * 10; // 10 seconds max buffer at 24 kHz
// Hold back this many samples before starting playback to absorb network jitter.
// 100 ms at 24 kHz = 2 400 samples.
const PRE_BUFFER_SAMPLES = 2400;

class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = [];
    this._totalSamples = 0;
    this._isPlaying = false;
    this._chunkOffset = 0;
    // Start in "buffering" mode — don't begin draining until PRE_BUFFER_SAMPLES ready.
    this._buffering = true;

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
    }

    // Begin playback once the pre-buffer is filled.
    if (this._buffering && this._totalSamples >= PRE_BUFFER_SAMPLES) {
      this._buffering = false;
      this._isPlaying = true;
    }
  }

  _clear() {
    this._queue = [];
    this._totalSamples = 0;
    this._isPlaying = false;
    this._chunkOffset = 0;
    this._buffering = true;
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
      // Buffer ran dry — fill remaining output with silence.
      output.fill(0, outputOffset);
      this._isPlaying = this._queue.length > 0;
    }

    return true;
  }
}

registerProcessor("audio-playback-processor", AudioPlaybackProcessor);
