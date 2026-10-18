# 太空漫遊 Space Roam

A calm first-person Three.js space flight. Open `index.html` via any static server.

## Texture credits / licenses
- Earth (atmos, normal, specular, clouds), Moon, Milky Way cube map (`tex/milkyway/`): three.js examples, MIT License (see `tex/LICENSE-three.js.txt`). https://github.com/mrdoob/three.js
- Venus, Mars, Jupiter, Saturn (+ ring), Neptune maps: from threex.planets (MIT) by Jerome Etienne, based on Planet Pixel Emporium maps by James Hastings-Trew (http://planetpixelemporium.com). https://github.com/jeromeetienne/threex.planets

v2: three.js r164 is vendored in `lib/` (minified, no CDN). Game textures are compressed WebP copies in `tex2/` (originals kept in `tex/`), streamed progressively after the first frame. The Milky Way/nebula sky is generated procedurally on the GPU (no download), so `tex/milkyway/` is no longer used.


## v4 — 太空時間任務「秒」（P3 課後鞏固）
- 5 個站，每局 19 個任務（15 個動手任務 + 4 題選擇題），每次重玩隨機。
- 每完成一站，學生自己駕駛飛船飛往下一站：跟着黃色箭咀飛進光圈。
  - 電腦：W／↑ 前進，A D／← → 轉彎，Shift 加速。
  - iPad／手機：左下搖桿，右下「加速」。
  - 可以收集 💎 時間晶石。飛了 45 秒仍未到，會出現「自動導航」按鈕。
- 發布到 GitHub Pages：把整個資料夾推上 repo，在 Pages 設定選 main branch / root。全部路徑都是相對路徑，並附 `.nojekyll`。
