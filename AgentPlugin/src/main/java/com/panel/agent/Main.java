package com.panel.agent;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.Chunk;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class Main extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info("PanelAgent aktif edildi! Web paneline veriler gonderiliyor...");

        // Senkron Toplayici (Bukkit API'sine erismek icin Ana Thread'de calismali)
        new BukkitRunnable() {
            @Override
            public void run() {
                String jsonData = collectData();
                
                // Asenkron Gonderici
                new BukkitRunnable() {
                    @Override
                    public void run() {
                        sendDataAsync(jsonData);
                    }
                }.runTaskAsynchronously(Main.this);
            }
        }.runTaskTimer(this, 0L, 60L);
    }

    private String collectData() {
        try {
            int players = Bukkit.getOnlinePlayers().size();
            Runtime r = Runtime.getRuntime();
            long usedRam = (r.totalMemory() - r.freeMemory()) / 1048576L;
            long maxRam = r.maxMemory() / 1048576L;

            double tps = 20.0;
            try {
                Object tpsArray = Bukkit.getServer().getClass().getMethod("getTPS").invoke(Bukkit.getServer());
                tps = ((double[]) tpsArray)[0]; 
            } catch (Exception e) {
            }

            // Gercek Oyuncu Ping Analizi
            StringBuilder packetAnalysis = new StringBuilder("[");
            boolean firstP = true;
            for (Player p : Bukkit.getOnlinePlayers()) {
                if (!firstP) packetAnalysis.append(",");
                int ping = p.getPing();
                String status = ping > 100 ? "Şüpheli/Gecikmeli" : "Normal";
                packetAnalysis.append(String.format(java.util.Locale.US,
                        "{\"player\":\"%s\", \"ping\": %d, \"status\": \"%s\"}",
                        p.getName(), ping, status));
                firstP = false;
            }
            packetAnalysis.append("]");

            // Gercek Agir Chunk Analizi
            List<Chunk> allChunks = new ArrayList<>();
            for (World w : Bukkit.getWorlds()) {
                for (Chunk c : w.getLoadedChunks()) {
                    allChunks.add(c);
                }
            }
            
            allChunks.sort(new Comparator<Chunk>() {
                @Override
                public int compare(Chunk c1, Chunk c2) {
                    return Integer.compare(c2.getEntities().length, c1.getEntities().length);
                }
            });

            StringBuilder chunkAnalysis = new StringBuilder("[");
            boolean firstC = true;
            for (int i = 0; i < Math.min(5, allChunks.size()); i++) {
                Chunk c = allChunks.get(i);
                int ents = c.getEntities().length;
                if (!firstC) chunkAnalysis.append(",");
                String reason = ents > 70 ? "Olası Farm / Lag" : "Doğal Dağılım";
                chunkAnalysis.append(String.format(java.util.Locale.US,
                        "{\"x\": %d, \"z\": %d, \"entities\": %d, \"reason\": \"%s\"}",
                        c.getX(), c.getZ(), ents, reason));
                firstC = false;
            }
            chunkAnalysis.append("]");

            return String.format(java.util.Locale.US,
                "{\"tps\": \"%.2f\", \"players\": %d, \"ram\": %d, \"maxRam\": %d, \"packetAnalysis\": %s, \"chunkAnalysis\": %s}",
                tps, players, usedRam, maxRam, packetAnalysis.toString(), chunkAnalysis.toString()
            );

        } catch (Exception e) {
            return "{}";
        }
    }

    private void sendDataAsync(String jsonInputString) {
        if (jsonInputString == null || jsonInputString.equals("{}")) return;
        try {
            URL url = new URL("http://localhost:3000/api/server-stats");
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("POST");
            con.setRequestProperty("Content-Type", "application/json");
            con.setRequestProperty("Accept", "application/json");
            String authInfo = "admin:123456";
            String encodedAuth = java.util.Base64.getEncoder().encodeToString(authInfo.getBytes("UTF-8"));
            con.setRequestProperty("Authorization", "Basic " + encodedAuth);
            con.setDoOutput(true);

            try(OutputStream os = con.getOutputStream()) {
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            con.getResponseCode();
        } catch (Exception e) {
        }
    }
}
