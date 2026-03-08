/* eslint-disable @typescript-eslint/no-explicit-any */

export type SpeechCallbacks = {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
};

function getSpeechRecognitionCtor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ??
    (window as any).webkitSpeechRecognition ??
    null
  );
}

export function isSpeechSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function createSpeechRecognition(callbacks: SpeechCallbacks) {
  const Ctor = getSpeechRecognitionCtor()!;
  const recognition = new Ctor();
  recognition.lang = "ja-JP";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = "";

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
        callbacks.onFinal(finalTranscript);
      } else {
        interim += result[0].transcript;
      }
    }
    if (interim) {
      callbacks.onInterim(finalTranscript + interim);
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error !== "aborted") {
      callbacks.onError(event.error);
    }
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  return {
    start: () => {
      finalTranscript = "";
      recognition.start();
    },
    stop: () => {
      recognition.stop();
    },
    getFinalTranscript: () => finalTranscript,
  };
}
