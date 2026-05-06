import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);

  const unsupported = useMemo(() => {
    if (typeof window === "undefined") return true;
    return !("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const setListeningSafely = (nextValue) => {
      if (isMountedRef.current) {
        setListening(nextValue);
      }
    };

    if (unsupported) return undefined;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListeningSafely(true);
    };

    recognition.onend = () => {
      // Unexpected stops should only update state and keep transcript intact.
      console.log("Speech recognition ended");
      setListeningSafely(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListeningSafely(false);
    };

    recognition.onresult = (event) => {
      console.log("Speech result event", event);
      let nextTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        nextTranscript += event.results[i][0].transcript;
      }
      console.log("Transcript:", nextTranscript);
      setTranscript(nextTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      isMountedRef.current = false;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch (_error) {
        // Ignore invalid-state errors during teardown.
      }
      recognitionRef.current = null;
    };
  }, [unsupported]);

  const startListening = useCallback(() => {
    if (unsupported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (_error) {
      // Prevent invalid state errors from breaking UI
    }
  }, [unsupported]);

  const stopListening = useCallback(() => {
    if (unsupported || !recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_error) {
      // Prevent invalid state errors from breaking UI
    }
  }, [unsupported]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    unsupported,
  };
}
