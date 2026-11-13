// Copiado do app Brita (rotinas/webapp/src/ui/useLeitorQr.ts) em 10/10/2026.
// Leitor de QR code pela câmera (BarcodeDetector quando há, com jsQR — carregado
// só aqui — como reserva; é o caminho do WebView do Android). Saiu de
// LerNotaFiscal (NFC-e) em 10/10/2026 para servir também ao desafio de QR do
// alarme persistente.
import { useEffect, useRef, useState } from "react";

type Detector = { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

/** Liga a câmera no <video> e chama `onQr` com o primeiro QR lido que `aceita`
 *  aprova; um QR lido e recusado mostra `avisoOutro`. */
export function useLeitorQr(
  ativo: boolean,
  onQr: (texto: string) => void,
  aceita: (texto: string) => boolean = (t) => !!t,
  avisoOutro = "Esse não é o QR code esperado."
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const cb = useRef(onQr);
  cb.current = onQr;
  const aceitaRef = useRef(aceita);
  aceitaRef.current = aceita;
  const avisoRef = useRef(avisoOutro);
  avisoRef.current = avisoOutro;
  useEffect(() => {
    if (!ativo) return;
    let parar = false;
    let stream: MediaStream | null = null;
    let timer = 0;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro("Câmera indisponível aqui. Cole o link do QR code abaixo.");
        return;
      }
      try {
        // Resolução alta: o QR da NFC-e é denso e no padrão (640×480) os
        // módulos ficam pequenos demais; foco contínuo onde o aparelho deixa.
        stream = await navigator.mediaDevices
          .getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false,
          })
          .catch(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }));
      } catch {
        setErro("Sem acesso à câmera. Libere a permissão ou cole o link do QR code abaixo.");
        return;
      }
      const v = videoRef.current;
      if (parar || !v) return stream.getTracks().forEach((t) => t.stop());
      const track = stream.getVideoTracks()[0];
      await track
        ?.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] })
        .catch(() => {});
      v.srcObject = stream;
      await v.play().catch(() => {});
      const Ctor = (
        window as unknown as { BarcodeDetector?: DetectorCtor & { getSupportedFormats?: () => Promise<string[]> } }
      ).BarcodeDetector;
      const formatos = Ctor?.getSupportedFormats ? await Ctor.getSupportedFormats().catch(() => []) : [];
      let detector = Ctor && formatos.includes("qr_code") ? new Ctor({ formats: ["qr_code"] }) : null;
      // jsQR sempre carregado: é o caminho do WebView do Android (sem
      // BarcodeDetector) e a reserva quando o detector nativo falha.
      const jsQR = (await import("jsqr")).default;
      if (parar) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let quadro = 0;
      /** Alterna entre o recorte central em resolução cheia (onde o guia
       *  manda pôr o QR) e o quadro inteiro reduzido. */
      const lerJsQr = (): string[] => {
        if (!ctx) return [];
        const w = v.videoWidth;
        const h = v.videoHeight;
        const centro = quadro++ % 2 === 0;
        const lado = centro ? Math.round(Math.min(w, h) * 0.8) : Math.max(w, h);
        const sx = centro ? Math.round((w - lado) / 2) : 0;
        const sy = centro ? Math.round((h - lado) / 2) : 0;
        const sw = centro ? lado : w;
        const sh = centro ? lado : h;
        const escala = Math.min(1, 1100 / Math.max(sw, sh));
        canvas.width = Math.round(sw * escala);
        canvas.height = Math.round(sh * escala);
        ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const r = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
        return r?.data ? [r.data] : [];
      };
      const tentar = async () => {
        if (parar) return;
        let textos: string[] = [];
        try {
          if (v.readyState >= 2 && v.videoWidth) {
            if (detector) {
              try {
                textos = (await detector.detect(v)).map((c) => c.rawValue);
              } catch {
                detector = null; // detector nativo quebrado: segue só no jsQR
              }
            }
            if (!textos.length) textos = lerJsQr();
          }
        } catch {
          /* quadro ruim: tenta o próximo */
        }
        if (parar) return;
        const lido = textos.map((t) => t.trim()).find((t) => aceitaRef.current(t)) || "";
        if (lido) return cb.current(lido);
        setAviso(textos.length ? avisoRef.current : "");
        timer = window.setTimeout(tentar, 150);
      };
      void tentar();
    })();
    return () => {
      parar = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [ativo]);
  return { videoRef, erro, aviso };
}

