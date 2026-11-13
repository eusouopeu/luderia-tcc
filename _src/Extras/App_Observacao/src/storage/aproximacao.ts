import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

/** Plugin nativo AproximacaoPlugin.java: NFC dispara, Bluetooth (L2CAP) transfere. */
type Aproximacao = {
  disponivel(): Promise<{ android10: boolean; nfc: boolean; nfcLigado: boolean; bluetooth: boolean; bluetoothLigado: boolean }>
  enviar(o: { dados: string }): Promise<{ bytes: number }>
  receber(): Promise<{ dados: string }>
  cancelar(): Promise<void>
  addListener(evento: 'toque', f: () => void): Promise<PluginListenerHandle>
}

export const Aproximacao = registerPlugin<Aproximacao>('Aproximacao')
export const aproximacaoSuportada = () => Capacitor.isNativePlatform()
