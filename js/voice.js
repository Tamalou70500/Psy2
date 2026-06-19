/* ═══════════════════════════════════════════
   voice.js — Dictée vocale (Web Speech API)
   Compatible Opera / Chrome / Edge
═══════════════════════════════════════════ */

let recognition   = null;
let voiceActive   = false;
let voiceTarget   = null;  // textarea cible

/* ─── Initialiser la reconnaissance ──────── */
function voiceInit(targetId, btnId) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    const btn = document.getElementById(btnId);
    if (btn) { btn.disabled = true; btn.title = "Dictée vocale non supportée par ce navigateur"; }
    return false;
  }

  voiceTarget = document.getElementById(targetId);
  const btn   = document.getElementById(btnId);

  recognition                 = new SpeechRecognition();
  recognition.lang            = "fr-FR";
  recognition.continuous      = true;
  recognition.interimResults  = true;

  let finalTranscript = "";

  recognition.onstart = () => {
    voiceActive = true;
    if (btn) { btn.classList.add("voice-active"); btn.textContent = "⏹ Arrêter la dictée"; }
  };

  recognition.onend = () => {
    voiceActive = false;
    if (btn) { btn.classList.remove("voice-active"); btn.textContent = "🎙 Dicter"; }
    finalTranscript = "";
  };

  recognition.onerror = (e) => {
    voiceActive = false;
    if (btn) { btn.classList.remove("voice-active"); btn.textContent = "🎙 Dicter"; }
    if (e.error === "no-speech") return;
    console.warn("Erreur dictée vocale :", e.error);
  };

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalTranscript += t + " ";
      else interim = t;
    }
    if (voiceTarget) {
      voiceTarget.value = finalTranscript + interim;
      voiceTarget.scrollTop = voiceTarget.scrollHeight;
    }
  };

  if (btn) btn.addEventListener("click", voiceToggle);
  return true;
}

/* ─── Démarrer / Arrêter ─────────────────── */
function voiceToggle() {
  if (!recognition) return;
  if (voiceActive) recognition.stop();
  else             recognition.start();
}
