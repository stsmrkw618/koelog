export type RecorderResult = {
  blob: Blob;
  duration: number;
};

export async function startRecording(): Promise<{
  mediaRecorder: MediaRecorder;
  analyser: AnalyserNode;
  stop: () => Promise<RecorderResult>;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Web Audio API for visualizer
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  // MediaRecorder
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/mp4";
  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  const startTime = Date.now();

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start(1000); // collect data every second

  const stop = (): Promise<RecorderResult> => {
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const blob = new Blob(chunks, { type: mimeType });
        // Clean up
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        resolve({ blob, duration });
      };
      mediaRecorder.stop();
    });
  };

  return { mediaRecorder, analyser, stop };
}
