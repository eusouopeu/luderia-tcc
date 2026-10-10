import { Capacitor } from '@capacitor/core'
import { horariosRestantes, nomeEtapa, etapas } from '../domain/temporizador'
import type { Visita } from '../domain/model'

const IDS = Array.from({ length: 40 }, (_, i) => ({ id: 100 + i }))

/** Reagenda os lembretes das contagens que faltam (tela apagada inclusive); sem visita ativa, só cancela. */
export async function agendarLembretes(v: Visita | null, unidade = '') {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: IDS })
    if (!v) return
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') {
      if ((await LocalNotifications.requestPermissions()).display !== 'granted') return
    }
    const total = etapas(v).length
    const proximas = horariosRestantes(v)
    await LocalNotifications.schedule({
      notifications: proximas.slice(0, IDS.length).map((p, i) => ({
        id: IDS[i].id,
        title: `${nomeEtapa(p.etapa, total)} · ${unidade}`,
        body: p.etapa === total - 1 ? 'Última contagem: hora de encerrar a visita.' : 'Hora de marcar as mesas ocupadas.',
        schedule: { at: p.quando, allowWhileIdle: true },
      })),
    })
  } catch (e) {
    console.error('lembretes', e)
  }
}
