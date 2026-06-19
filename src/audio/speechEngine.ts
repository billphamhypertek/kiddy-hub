/**
 * Pluggable text-to-speech engine. The real implementation wraps the Web Speech
 * API (`window.speechSynthesis`); tests inject a fake. `speak` invokes `onDone`
 * when the utterance ends OR errors (never hangs), and returns a `cancel()`
 * handle that stops playback early.
 */
export interface SpeechEngine {
  speak(text: string, lang: string, onDone: () => void): () => void;
}

/**
 * Real engine backed by the Web Speech API. Voices load asynchronously, so we
 * resolve a matching voice lazily (and listen for `voiceschanged`). If no voice
 * matches `lang`, we set `utterance.lang` and let the browser pick a default.
 * If `speechSynthesis` is unavailable, every call is a safe no-op that fires
 * `onDone` immediately.
 */
export function createWebSpeechEngine(): SpeechEngine {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

  // Cache voices; refresh when the browser fires `voiceschanged`.
  let voices: SpeechSynthesisVoice[] = [];
  function refreshVoices(): void {
    if (synth) voices = synth.getVoices();
  }
  if (synth) {
    refreshVoices();
    // Some browsers populate voices only after this event.
    synth.addEventListener?.('voiceschanged', refreshVoices);
  }

  function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
    if (voices.length === 0) refreshVoices();
    const prefix = lang.split('-')[0].toLowerCase();
    return (
      voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
    );
  }

  return {
    speak(text, lang, onDone) {
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        onDone();
        return () => {};
      }
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        onDone();
      };

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      const voice = pickVoice(lang);
      if (voice) utt.voice = voice;
      // Fire onDone on BOTH end and error so the caller's promise never hangs.
      utt.onend = finish;
      utt.onerror = finish;
      synth.speak(utt);

      return () => {
        // Cancelling stops the current utterance; `onerror`/`onend` may or may
        // not fire, so resolve defensively here too.
        synth.cancel();
        finish();
      };
    },
  };
}
