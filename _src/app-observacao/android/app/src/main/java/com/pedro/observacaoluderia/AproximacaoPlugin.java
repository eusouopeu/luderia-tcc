package com.pedro.observacaoluderia;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.ComponentName;
import android.content.Context;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.cardemulation.CardEmulation;
import android.nfc.tech.IsoDep;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.UUID;

/**
 * Transferência entre dois celulares por aproximação.
 *
 * O NFC só dispara: quem envia abre um canal Bluetooth L2CAP (LE), anuncia por
 * BLE o código da sessão e emula um cartão NFC (AproximacaoHce) com
 * código + PSM do canal. Quem recebe lê o cartão ao encostar os celulares,
 * procura por BLE o anúncio com aquele código e conecta no canal. Os dados vão
 * como tamanho (int) + texto UTF-8; quem recebe devolve 1 byte de confirmação.
 * Android Beam (NFC → Bluetooth do sistema) saiu no Android 10, por isso o
 * caminho próprio. Exige Android 10+ (L2CAP CoC), NFC e Bluetooth ligados.
 */
@CapacitorPlugin(
    name = "Aproximacao",
    permissions = {
        @Permission(alias = "bt", strings = {Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT}),
        @Permission(alias = "local", strings = {Manifest.permission.ACCESS_FINE_LOCATION})
    }
)
public class AproximacaoPlugin extends Plugin {
    private static final ParcelUuid SERVICO = ParcelUuid.fromString("7a1c0d2e-4b5f-4c6a-9e1d-0b5e1a7c9f31");
    private static final int PRAZO_MS = 90_000;
    private static AproximacaoPlugin atual;

    private final Handler main = new Handler(Looper.getMainLooper());
    private PluginCall chamada;
    private BluetoothServerSocket servidor;
    private BluetoothSocket socket;
    private BluetoothLeAdvertiser anunciante;
    private BluetoothLeScanner scanner;
    private boolean lendoNfc;
    private volatile boolean ativo;

    private final AdvertiseCallback aoAnunciar = new AdvertiseCallback() {
        @Override
        public void onStartFailure(int errorCode) {
            falhar("Não consegui anunciar pelo Bluetooth (erro " + errorCode + ").");
        }
    };

    @Override
    public void load() {
        atual = this;
    }

    static void avisarToque() {
        AproximacaoPlugin p = atual;
        if (p != null) p.notifyListeners("toque", new JSObject());
    }

    private String aliasBt() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? "bt" : "local";
    }

    private BluetoothAdapter adaptador() {
        BluetoothManager bm = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        return bm == null ? null : bm.getAdapter();
    }

    @PluginMethod
    public void disponivel(PluginCall call) {
        NfcAdapter nfc = NfcAdapter.getDefaultAdapter(getContext());
        BluetoothAdapter bt = adaptador();
        JSObject r = new JSObject();
        r.put("android10", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q);
        r.put("nfc", nfc != null);
        r.put("nfcLigado", nfc != null && nfc.isEnabled());
        r.put("bluetooth", bt != null);
        r.put("bluetoothLigado", bt != null && bt.isEnabled());
        call.resolve(r);
    }

    /** Confere requisitos; devolve mensagem de erro ou null. */
    private String requisitos(boolean precisaNfcLeitura) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return "Precisa de Android 10 ou mais novo.";
        NfcAdapter nfc = NfcAdapter.getDefaultAdapter(getContext());
        if (nfc == null) return "Este celular não tem NFC.";
        if (!nfc.isEnabled()) return "Ligue o NFC nas configurações rápidas.";
        BluetoothAdapter bt = adaptador();
        if (bt == null) return "Este celular não tem Bluetooth.";
        if (!bt.isEnabled()) return "Ligue o Bluetooth.";
        return null;
    }

    @PluginMethod
    public void enviar(PluginCall call) {
        if (getPermissionState(aliasBt()) != PermissionState.GRANTED) {
            requestPermissionForAlias(aliasBt(), call, "depoisPermissaoEnviar");
            return;
        }
        iniciarEnvio(call);
    }

    @PermissionCallback
    private void depoisPermissaoEnviar(PluginCall call) {
        if (getPermissionState(aliasBt()) != PermissionState.GRANTED) call.reject("Sem permissão de Bluetooth.");
        else iniciarEnvio(call);
    }

    @PluginMethod
    public void receber(PluginCall call) {
        if (getPermissionState(aliasBt()) != PermissionState.GRANTED) {
            requestPermissionForAlias(aliasBt(), call, "depoisPermissaoReceber");
            return;
        }
        iniciarRecebimento(call);
    }

    @PermissionCallback
    private void depoisPermissaoReceber(PluginCall call) {
        if (getPermissionState(aliasBt()) != PermissionState.GRANTED) call.reject("Sem permissão de Bluetooth.");
        else iniciarRecebimento(call);
    }

    @PluginMethod
    public void cancelar(PluginCall call) {
        if (chamada != null) chamada.reject("Cancelado.");
        limpar();
        call.resolve();
    }

    @SuppressWarnings("MissingPermission")
    private void iniciarEnvio(PluginCall call) {
        String erro = requisitos(false);
        if (erro != null) {
            call.reject(erro);
            return;
        }
        String dados = call.getString("dados");
        if (dados == null) {
            call.reject("Sem dados.");
            return;
        }
        limpar();
        chamada = call;
        ativo = true;
        try {
            BluetoothAdapter bt = adaptador();
            servidor = bt.listenUsingInsecureL2capChannel();
            int psm = servidor.getPsm();
            byte[] codigo = new byte[4];
            new SecureRandom().nextBytes(codigo);
            byte[] carga = {codigo[0], codigo[1], codigo[2], codigo[3], (byte) (psm >> 8), (byte) psm};

            anunciante = bt.getBluetoothLeAdvertiser();
            if (anunciante == null) throw new IllegalStateException("Este celular não anuncia por Bluetooth LE.");
            AdvertiseSettings conf = new AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .build();
            AdvertiseData dadosAnuncio = new AdvertiseData.Builder().addServiceData(SERVICO, carga).setIncludeDeviceName(false).build();
            anunciante.startAdvertising(conf, dadosAnuncio, aoAnunciar);

            AproximacaoHce.carga = carga;
            main.post(() -> {
                try {
                    CardEmulation ce = CardEmulation.getInstance(NfcAdapter.getDefaultAdapter(getContext()));
                    ce.setPreferredService(getActivity(), new ComponentName(getContext(), AproximacaoHce.class));
                } catch (Exception ignored) {
                    // sem serviço preferido o AID próprio ainda costuma ser roteado
                }
            });
            main.postDelayed(this::prazoEsgotado, PRAZO_MS);

            byte[] bytes = dados.getBytes(StandardCharsets.UTF_8);
            new Thread(() -> {
                try {
                    socket = servidor.accept(PRAZO_MS);
                    DataOutputStream out = new DataOutputStream(socket.getOutputStream());
                    out.writeInt(bytes.length);
                    out.write(bytes);
                    out.flush();
                    new DataInputStream(socket.getInputStream()).readByte(); // confirmação
                    JSObject r = new JSObject();
                    r.put("bytes", bytes.length);
                    concluir(r);
                } catch (Exception e) {
                    if (ativo) falhar("Envio interrompido: " + e.getMessage());
                }
            }).start();
        } catch (Exception e) {
            falhar(e.getMessage() != null ? e.getMessage() : "Falha ao preparar o envio.");
        }
    }

    private void iniciarRecebimento(PluginCall call) {
        String erro = requisitos(true);
        if (erro != null) {
            call.reject(erro);
            return;
        }
        limpar();
        chamada = call;
        ativo = true;
        NfcAdapter nfc = NfcAdapter.getDefaultAdapter(getContext());
        int flags = NfcAdapter.FLAG_READER_NFC_A | NfcAdapter.FLAG_READER_NFC_B | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK;
        main.post(() -> {
            nfc.enableReaderMode(getActivity(), this::tagLida, flags, null);
            lendoNfc = true;
        });
        main.postDelayed(this::prazoEsgotado, PRAZO_MS);
    }

    private void tagLida(Tag tag) {
        IsoDep iso = IsoDep.get(tag);
        if (iso == null) return;
        try {
            iso.connect();
            byte[] aid = AproximacaoHce.AID;
            byte[] select = new byte[6 + aid.length];
            select[0] = 0x00;
            select[1] = (byte) 0xA4;
            select[2] = 0x04;
            select[3] = 0x00;
            select[4] = (byte) aid.length;
            System.arraycopy(aid, 0, select, 5, aid.length);
            select[select.length - 1] = 0x00;
            byte[] r = iso.transceive(select);
            iso.close();
            if (r == null || r.length != 8 || r[6] != (byte) 0x90 || r[7] != 0x00) return; // outro cartão
            byte[] carga = Arrays.copyOf(r, 6);
            notifyListeners("toque", new JSObject());
            pararNfc();
            procurar(carga);
        } catch (Exception ignored) {
            // afastou cedo demais: espera o próximo toque
        }
    }

    @SuppressWarnings("MissingPermission")
    private void procurar(byte[] carga) {
        int psm = ((carga[4] & 0xFF) << 8) | (carga[5] & 0xFF);
        scanner = adaptador().getBluetoothLeScanner();
        if (scanner == null) {
            falhar("Bluetooth LE indisponível.");
            return;
        }
        ScanSettings conf = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();
        scanner.startScan(null, conf, new ScanCallback() {
            private boolean achou;

            @Override
            public void onScanResult(int callbackType, ScanResult res) {
                if (achou || res.getScanRecord() == null) return;
                byte[] d = res.getScanRecord().getServiceData(SERVICO);
                if (d == null || !Arrays.equals(d, carga)) return;
                achou = true;
                try {
                    scanner.stopScan(this);
                } catch (Exception ignored) {
                }
                conectar(res.getDevice(), psm);
            }

            @Override
            public void onScanFailed(int errorCode) {
                falhar("Busca Bluetooth falhou (erro " + errorCode + ").");
            }
        });
    }

    @SuppressWarnings("MissingPermission")
    private void conectar(BluetoothDevice dispositivo, int psm) {
        new Thread(() -> {
            try {
                socket = dispositivo.createInsecureL2capChannel(psm);
                socket.connect();
                DataInputStream in = new DataInputStream(socket.getInputStream());
                int n = in.readInt();
                if (n < 0 || n > 50_000_000) throw new IllegalStateException("tamanho inválido");
                byte[] bytes = new byte[n];
                in.readFully(bytes);
                DataOutputStream out = new DataOutputStream(socket.getOutputStream());
                out.writeByte(1);
                out.flush();
                JSObject r = new JSObject();
                r.put("dados", new String(bytes, StandardCharsets.UTF_8));
                concluir(r);
            } catch (Exception e) {
                if (ativo) falhar("Recebimento interrompido: " + e.getMessage());
            }
        }).start();
    }

    private void prazoEsgotado() {
        if (ativo) falhar("Tempo esgotado. Encoste as costas dos celulares e tente de novo.");
    }

    private synchronized void concluir(JSObject r) {
        PluginCall c = chamada;
        chamada = null;
        limpar();
        if (c != null) c.resolve(r);
    }

    private synchronized void falhar(String msg) {
        PluginCall c = chamada;
        chamada = null;
        limpar();
        if (c != null) c.reject(msg);
    }

    private void pararNfc() {
        if (!lendoNfc) return;
        lendoNfc = false;
        main.post(() -> {
            try {
                NfcAdapter.getDefaultAdapter(getContext()).disableReaderMode(getActivity());
            } catch (Exception ignored) {
            }
        });
    }

    @SuppressWarnings("MissingPermission")
    private void limpar() {
        ativo = false;
        main.removeCallbacksAndMessages(null);
        AproximacaoHce.carga = null;
        pararNfc();
        main.post(() -> {
            try {
                CardEmulation.getInstance(NfcAdapter.getDefaultAdapter(getContext())).unsetPreferredService(getActivity());
            } catch (Exception ignored) {
            }
        });
        try {
            if (anunciante != null) anunciante.stopAdvertising(aoAnunciar);
        } catch (Exception ignored) {
        }
        anunciante = null;
        try {
            if (socket != null) socket.close();
        } catch (Exception ignored) {
        }
        socket = null;
        try {
            if (servidor != null) servidor.close();
        } catch (Exception ignored) {
        }
        servidor = null;
    }

    @Override
    protected void handleOnPause() {
        // reader mode e serviço preferido só valem em primeiro plano
        if (ativo) falhar("O app saiu da tela; a transferência foi cancelada.");
    }
}
