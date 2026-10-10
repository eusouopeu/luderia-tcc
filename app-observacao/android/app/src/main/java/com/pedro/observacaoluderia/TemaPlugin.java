package com.pedro.observacaoluderia;

import android.graphics.Color;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Tema claro/escuro nas barras do sistema: a área atrás delas é o fundo da
 * janela (o conteúdo fica recuado pelos insets em MainActivity), então pinta
 * esse fundo com a cor do papel do tema e ajusta a cor dos ícones.
 */
@CapacitorPlugin(name = "Tema")
public class TemaPlugin extends Plugin {
    @PluginMethod
    public void aplicar(PluginCall call) {
        boolean escuro = Boolean.TRUE.equals(call.getBoolean("escuro", false));
        String cor = call.getString("cor", escuro ? "#0a0f1a" : "#ffffff");
        getActivity().runOnUiThread(() -> {
            try {
                Window w = getActivity().getWindow();
                int c = Color.parseColor(cor);
                w.getDecorView().setBackgroundColor(c);
                getBridge().getWebView().setBackgroundColor(c);
                WindowInsetsControllerCompat ic = WindowCompat.getInsetsController(w, w.getDecorView());
                ic.setAppearanceLightStatusBars(!escuro);
                ic.setAppearanceLightNavigationBars(!escuro);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }
}
