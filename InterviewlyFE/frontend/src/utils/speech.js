export function speakText(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  const content = typeof text === "string" ? text.trim() : "";
  if (!content) return;

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

  synth.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
