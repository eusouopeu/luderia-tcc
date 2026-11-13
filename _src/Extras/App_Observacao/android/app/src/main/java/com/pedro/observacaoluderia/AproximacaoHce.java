package com.pedro.observacaoluderia;

import android.nfc.cardemulation.HostApduService;
import android.os.Bundle;

/**
 * Cartão NFC emulado pelo celular que envia: responde ao SELECT do AID do app
 * com a carga da sessão (código de 4 bytes + PSM do canal Bluetooth L2CAP).
 * Fora de uma transferência (carga nula), responde "arquivo não encontrado".
 */
public class AproximacaoHce extends HostApduService {
    static volatile byte[] carga = null;

    static final byte[] AID = {(byte) 0xF0, 0x4F, 0x42, 0x53, 0x4C, 0x55, 0x44};
    private static final byte[] OK = {(byte) 0x90, 0x00};
    private static final byte[] NAO_ENCONTRADO = {(byte) 0x6A, (byte) 0x82};

    @Override
    public byte[] processCommandApdu(byte[] apdu, Bundle extras) {
        byte[] c = carga;
        boolean select = apdu != null && apdu.length >= 5 && apdu[0] == 0x00 && apdu[1] == (byte) 0xA4;
        if (c == null || !select) return NAO_ENCONTRADO;
        byte[] r = new byte[c.length + 2];
        System.arraycopy(c, 0, r, 0, c.length);
        System.arraycopy(OK, 0, r, c.length, 2);
        AproximacaoPlugin.avisarToque();
        return r;
    }

    @Override
    public void onDeactivated(int reason) {}
}
