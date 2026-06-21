// Barramento de áudio partilhado entre o botão de música (que gera o som)
// e a animação do hero (que reage ao som). Singleton em memória no cliente.

type AudioBus = {
  analyser: AnalyserNode | null;
  playing: boolean;
};

export const audioBus: AudioBus = {
  analyser: null,
  playing: false,
};

let _buf: Uint8Array | null = null;

/** Nível de energia (0..1) das frequências graves/médias. 0 se nada a tocar. */
export function getAudioLevel(): number {
  const a = audioBus.analyser;
  if (!a || !audioBus.playing) return 0;
  if (!_buf || _buf.length !== a.frequencyBinCount) {
    _buf = new Uint8Array(a.frequencyBinCount);
  }
  a.getByteFrequencyData(_buf);
  const n = Math.min(40, _buf.length); // graves/médios
  let sum = 0;
  for (let i = 0; i < n; i++) sum += _buf[i];
  return sum / n / 255;
}
