const REALTIME_SAMPLE_RATE = 16000;
const REALTIME_CHUNK_SAMPLES = 3200;

const state = {
  health: null,
  session: null,
  committed: [],
  partial: ""
};

const els = {
  message: document.querySelector("#message"),
  statusBadge: document.querySelector("#statusBadge"),
  qualityMeta: document.querySelector("#qualityMeta"),
  startLive: document.querySelector("#startLive"),
  stopLive: document.querySelector("#stopLive"),
  clearTranscript: document.querySelector("#clearTranscript"),
  copyTranscript: document.querySelector("#copyTranscript"),
  liveTranscript: document.querySelector("#liveTranscript"),
  finalTranscript: document.querySelector("#finalTranscript")
};

bindControls();
loadHealth();

function bindControls() {
  els.startLive.addEventListener("click", async () => {
    try {
      clearMessage();
      state.committed = [];
      state.partial = "";
      renderTranscript();
      await startRealtimeTranscription();
      setListeningUi(true);
      showMessage("Listening. Final text appears after a natural pause.");
    } catch (error) {
      await stopRealtimeTranscription();
      showError(error);
    }
  });

  els.stopLive.addEventListener("click", async () => {
    await stopRealtimeTranscription();
    setListeningUi(false);
    showMessage("Stopped.");
  });

  els.clearTranscript.addEventListener("click", () => {
    state.committed = [];
    state.partial = "";
    renderTranscript();
    showMessage("Transcript cleared.");
  });

  els.copyTranscript.addEventListener("click", async () => {
    const text = els.finalTranscript.value.trim();
    if (!text) {
      showError(new Error("No final transcript to copy yet."));
      return;
    }

    await navigator.clipboard.writeText(text);
    showMessage("Transcript copied.");
  });
}

async function loadHealth() {
  try {
    const response = await fetch("/api/health");
    const health = await response.json();
    state.health = health;

    els.statusBadge.textContent = health.configured ? "Ready" : "Key missing";
    els.statusBadge.classList.toggle("ready", health.configured);
    els.statusBadge.classList.toggle("missing", !health.configured);
    els.qualityMeta.textContent = `${health.realtimeSttModel || "scribe_v2_realtime"} · stable VAD mode`;
  } catch {
    els.statusBadge.textContent = "Offline";
    els.statusBadge.classList.add("missing");
  }
}

async function startRealtimeTranscription() {
  if (state.session) {
    await stopRealtimeTranscription();
  }

  const tokenResponse = await fetch("/api/scribe-token");
  await assertOk(tokenResponse);
  const tokenData = await tokenResponse.json();
  const params = new URLSearchParams({
    model_id: tokenData.modelId || "scribe_v2_realtime",
    token: tokenData.token,
    audio_format: "pcm_16000",
    commit_strategy: "vad",
    vad_silence_threshold_secs: "1.5",
    vad_threshold: "0.4",
    min_speech_duration_ms: "250",
    min_silence_duration_ms: "400",
    include_timestamps: "true",
    no_verbatim: "false"
  });

  if (tokenData.languageCode) {
    params.set("language_code", tokenData.languageCode);
  }

  const socket = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params}`);
  const session = {
    socket,
    stream: null,
    audioContext: null,
    source: null,
    processor: null,
    mute: null,
    pcmChunks: [],
    sampleCount: 0
  };

  state.session = session;

  socket.addEventListener("open", async () => {
    try {
      await startMicStream(session);
    } catch (error) {
      showError(error);
      await stopRealtimeTranscription();
      setListeningUi(false);
    }
  });

  socket.addEventListener("message", (event) => {
    handleRealtimeMessage(event.data);
  });

  socket.addEventListener("error", () => {
    showError(new Error("Realtime connection failed. Check Realtime Speech-to-Text and Single Use Tokens on the ElevenLabs key."));
  });

  socket.addEventListener("close", () => {
    cleanupRealtimeSession(session);
    if (state.session === session) {
      state.session = null;
      setListeningUi(false);
    }
  });
}

async function startMicStream(session) {
  session.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1
    }
  });
  session.audioContext = new AudioContext();
  session.source = session.audioContext.createMediaStreamSource(session.stream);
  session.processor = session.audioContext.createScriptProcessor(4096, 1, 1);
  session.mute = session.audioContext.createGain();
  session.mute.gain.value = 0;

  session.processor.onaudioprocess = (event) => {
    if (session.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const input = event.inputBuffer.getChannelData(0);
    const pcm = downsampleToPcm16(input, session.audioContext.sampleRate, REALTIME_SAMPLE_RATE);
    queuePcmChunk(session, pcm);
  };

  session.source.connect(session.processor);
  session.processor.connect(session.mute);
  session.mute.connect(session.audioContext.destination);
}

async function stopRealtimeTranscription() {
  const session = state.session;
  if (!session) {
    return;
  }

  flushPcmChunks(session, true);
  cleanupRealtimeSession(session);
  state.session = null;

  if (session.socket.readyState === WebSocket.OPEN || session.socket.readyState === WebSocket.CONNECTING) {
    window.setTimeout(() => session.socket.close(1000, "Stopped"), 180);
  }
}

function cleanupRealtimeSession(session) {
  session.processor?.disconnect();
  session.source?.disconnect();
  session.mute?.disconnect();
  session.stream?.getTracks().forEach((track) => track.stop());
  session.audioContext?.close().catch(() => {});
  session.processor = null;
  session.source = null;
  session.mute = null;
  session.stream = null;
  session.audioContext = null;
  session.pcmChunks = [];
  session.sampleCount = 0;
}

function handleRealtimeMessage(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  if (data.message_type === "partial_transcript") {
    state.partial = (data.text || "").trim();
    renderTranscript();
    return;
  }

  if (data.message_type === "committed_transcript" || data.message_type === "committed_transcript_with_timestamps") {
    const text = cleanTranscriptSegment(data.text || "");
    if (text) {
      appendCommittedTranscript(text);
    }
    state.partial = "";
    renderTranscript();
    return;
  }

  if (data.message_type && data.message_type.includes("error")) {
    showError(new Error(data.message || data.error || "Realtime transcription error."));
  }
}

function cleanTranscriptSegment(text) {
  return text.replace(/\s+/g, " ").trim();
}

function appendCommittedTranscript(nextText) {
  const currentText = state.committed.join(" ").trim();
  const cleanNext = cleanTranscriptSegment(nextText);

  if (!cleanNext) {
    return;
  }

  if (!currentText) {
    state.committed.push(cleanNext);
    return;
  }

  const normalizedCurrent = normalizeTranscriptText(currentText);
  const normalizedNext = normalizeTranscriptText(cleanNext);

  if (normalizedCurrent.endsWith(normalizedNext)) {
    return;
  }

  const lastSegment = state.committed[state.committed.length - 1] || "";
  if (isLikelyDuplicateSegment(lastSegment, cleanNext)) {
    return;
  }

  const overlap = findWordOverlap(currentText, cleanNext);
  if (overlap > 0) {
    const nextWords = cleanNext.split(/\s+/).slice(overlap);
    if (nextWords.length) {
      state.committed.push(nextWords.join(" "));
    }
    return;
  }

  state.committed.push(cleanNext);
}

function normalizeTranscriptText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyDuplicateSegment(previousText, nextText) {
  const previous = normalizeTranscriptText(previousText);
  const next = normalizeTranscriptText(nextText);

  if (!previous || !next) {
    return false;
  }

  if (previous === next || previous.includes(next) || next.includes(previous)) {
    return true;
  }

  const previousWords = previous.split(" ");
  const nextWords = next.split(" ");
  const minWords = Math.min(previousWords.length, nextWords.length);

  if (minWords < 4) {
    return false;
  }

  const previousSet = new Set(previousWords);
  const sharedWords = nextWords.filter((word) => previousSet.has(word)).length;
  return sharedWords / Math.max(previousWords.length, nextWords.length) >= 0.82;
}

function findWordOverlap(currentText, nextText) {
  const currentWords = normalizeTranscriptText(currentText).split(" ").filter(Boolean);
  const nextWords = normalizeTranscriptText(nextText).split(" ").filter(Boolean);
  const maxOverlap = Math.min(currentWords.length, nextWords.length);

  for (let size = maxOverlap; size >= 2; size -= 1) {
    const currentTail = currentWords.slice(-size).join(" ");
    const nextHead = nextWords.slice(0, size).join(" ");

    if (currentTail === nextHead) {
      return size;
    }
  }

  return 0;
}

function renderTranscript() {
  els.liveTranscript.textContent = state.partial;
  els.finalTranscript.value = state.committed.join(" ").trim();
}

function queuePcmChunk(session, pcm) {
  if (!pcm.length) {
    return;
  }

  session.pcmChunks.push(pcm);
  session.sampleCount += pcm.length;

  if (session.sampleCount >= REALTIME_CHUNK_SAMPLES) {
    flushPcmChunks(session, false);
  }
}

function flushPcmChunks(session, commit) {
  if (!session.pcmChunks.length || session.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const merged = mergePcmChunks(session.pcmChunks, session.sampleCount);
  session.pcmChunks = [];
  session.sampleCount = 0;
  sendPcmChunk(session.socket, merged, commit);
}

function sendPcmChunk(socket, pcm, commit) {
  socket.send(
    JSON.stringify({
      message_type: "input_audio_chunk",
      audio_base_64: bytesToBase64(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength)),
      commit,
      sample_rate: REALTIME_SAMPLE_RATE
    })
  );
}

function downsampleToPcm16(input, sourceRate, targetRate) {
  if (sourceRate === targetRate) {
    return floatToPcm16(input);
  }

  const ratio = sourceRate / targetRate;
  const length = Math.floor(input.length / ratio);
  const output = new Int16Array(length);

  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    let count = 0;

    for (let j = start; j < end; j += 1) {
      sum += input[j];
      count += 1;
    }

    output[i] = floatSampleToInt16(count ? sum / count : input[start] || 0);
  }

  return output;
}

function floatToPcm16(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    output[i] = floatSampleToInt16(input[i]);
  }
  return output;
}

function floatSampleToInt16(value) {
  const clamped = Math.max(-1, Math.min(1, value));
  return clamped < 0 ? clamped * 32768 : clamped * 32767;
}

function mergePcmChunks(chunks, sampleCount) {
  const merged = new Int16Array(sampleCount);
  let offset = 0;

  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  return merged;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function assertOk(response) {
  if (response.ok) {
    return;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await response.json();
    const detail = detailToText(body.detail);
    throw new Error([body.error, detail].filter(Boolean).join(" "));
  }

  throw new Error((await response.text()) || "Request failed.");
}

function detailToText(detail) {
  if (!detail) {
    return "";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (typeof detail === "object") {
    if (typeof detail.detail === "string") {
      return detail.detail;
    }

    if (typeof detail.message === "string") {
      return detail.message;
    }
  }

  return "";
}

function setListeningUi(isListening) {
  els.startLive.disabled = isListening;
  els.stopLive.disabled = !isListening;
  els.startLive.textContent = isListening ? "Listening" : "Start Live";
  document.querySelector('[data-recording-for="stt"]')?.classList.toggle("active", isListening);
}

function showMessage(text) {
  els.message.textContent = text;
  els.message.classList.remove("error");
}

function clearMessage() {
  showMessage("");
}

function showError(error) {
  els.message.textContent = error instanceof Error ? error.message : "Something went wrong.";
  els.message.classList.add("error");
}
