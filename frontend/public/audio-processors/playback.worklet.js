// Runs in the AudioWorklet thread.
// Receives Float32 chunks from the main thread and drains them to the speaker.
// The process() callback always runs — it outputs audio if the queue has data,
// silence otherwise. No _isPlaying flag needed.

const BUFFER_MAX_SAMPLES = 24000 * 10; // 10 s safety cap at 24 kHz

class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._queue = [];
    this._totalSamples = 0;
    this._chunkOffset = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === "audio") {
        this._enqueue(event.data.data); // Float32Array
      } else if (event.data.type === "clear") {
        this._clear();
      }
    };
  }

  _enqueue(float32Array) {
    if (this._totalSamples + float32Array.length > BUFFER_MAX_SAMPLES) return;
    this._queue.push(float32Array);
    this._totalSamples += float32Array.length;
  }

  _clear() {
    this._queue = [];
    this._totalSamples = 0;
    this._chunkOffset = 0;
    this.port.postMessage({ type: "cleared" });
  }

  process(inputs, outputs) {
    const output = outputs[0][0];
    const outputLength = output.length;
    let outputOffset = 0;

    while (outputOffset < outputLength && this._queue.length > 0) {
      const chunk = this._queue[0];
      const toCopy = Math.min(chunk.length - this._chunkOffset, outputLength - outputOffset);

      output.set(chunk.subarray(this._chunkOffset, this._chunkOffset + toCopy), outputOffset);

      outputOffset += toCopy;
      this._chunkOffset += toCopy;

      if (this._chunkOffset >= chunk.length) {
        this._queue.shift();
        this._totalSamples -= chunk.length;
        this._chunkOffset = 0;
      }
    }

    // Fill any remaining output with silence
    if (outputOffset < outputLength) {
      output.fill(0, outputOffset);
    }

    return true;
  }
}

registerProcessor("audio-playback-processor", AudioPlaybackProcessor);
