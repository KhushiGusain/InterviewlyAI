export function speakText(text, { onEnd } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  const synth = window.speechSynthesis;
  const content = typeof text === "string" ? text.trim() : "";
  if (!content) {
    onEnd?.();
    return;
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(content);
  const voices = synth.getVoices();

  if (voices.length > 0) {
    const preferredVoice =
      voices.find(
        (voice) =>
          voice.lang?.toLowerCase().startsWith("en") &&
          /natural|neural|enhanced|premium|google|samantha|alex/i.test(
            `${voice.name} ${voice.voiceURI}`
          )
      ) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ||
      voices[0];

    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang || "en-US";
  } else {
    utterance.lang = "en-US";
  }

  if (onEnd) {
    // fireOnce guards against Chrome's known bug of onend firing multiple times
    let fallbackTimer;
    let called = false;
    const fireOnce = () => {
      if (called) return;
      called = true;
      clearTimeout(fallbackTimer);
      onEnd();
    };
    utterance.onend = fireOnce;
    // Fallback in case speechSynthesis.onend never fires (~130 wpm + 3s buffer, min 6s)
    const wordCount = content.split(/\s+/).length;
    const fallbackMs = Math.max(6000, Math.ceil((wordCount / 130) * 60 * 1000) + 3000);
    fallbackTimer = setTimeout(fireOnce, fallbackMs);
  }

  synth.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
