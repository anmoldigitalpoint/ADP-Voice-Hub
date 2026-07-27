// ===== ADP Voice Hub — shared engine helpers =====

// ---------- Generic helpers ----------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function fmtBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return bytes.toFixed(1) + " " + units[i];
}

function setProgress(barEl, pct) {
  if (!barEl) return;
  barEl.style.display = "block";
  barEl.firstElementChild.style.width = Math.min(100, Math.max(0, pct)) + "%";
}

// ---------- Text to Speech ----------
let adpVoices = [];
function loadVoicesOnce(callback) {
  const populate = () => {
    adpVoices = window.speechSynthesis.getVoices();
    if (adpVoices.length) callback(adpVoices);
  };
  populate();
  if (!adpVoices.length) {
    window.speechSynthesis.onvoiceschanged = populate;
  }
}

function classifyVoiceLang(voice) {
  const l = voice.lang.toLowerCase();
  if (l.startsWith("hi")) return "Hindi";
  if (l.startsWith("en")) return "English";
  return voice.lang;
}

function speakText({ text, voice, rate, pitch, onend }) {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (voice) utter.voice = voice;
  utter.rate = rate || 1;
  utter.pitch = pitch || 1;
  if (onend) utter.onend = onend;
  window.speechSynthesis.speak(utter);
  return utter;
}

// ---------- ffmpeg.wasm singleton (used by converter/trim/merge/speed/ringtone/mp4->mp3) ----------
let adpFFmpegInstance = null;
let adpFFmpegLoading = null;

async function getFFmpeg(onProgress) {
  if (adpFFmpegInstance) return adpFFmpegInstance;
  if (adpFFmpegLoading) return adpFFmpegLoading;
  adpFFmpegLoading = (async () => {
    const { createFFmpeg } = FFmpeg; // global from CDN script
    const ff = createFFmpeg({
      log: false,
      progress: (p) => { if (onProgress) onProgress(Math.round((p.ratio || 0) * 100)); }
    });
    await ff.load();
    adpFFmpegInstance = ff;
    return ff;
  })();
  return adpFFmpegLoading;
}

async function readFileAsUint8(file) {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

// ---------- Web Audio: decode file to AudioBuffer ----------
async function decodeAudioFile(file) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuf = await file.arrayBuffer();
  const audioBuf = await ctx.decodeAudioData(arrayBuf);
  return { ctx, audioBuf };
}

function audioBufferToWavBlob(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length - 44, true);

  let offset = 44;
  const channels = [];
  for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, channels[c][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}
