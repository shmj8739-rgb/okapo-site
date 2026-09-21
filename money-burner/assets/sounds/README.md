# assets/sounds/

現状、効果音はすべて Web Audio API でその場で合成しており（`js/audio.js`）、音声ファイルは使用していません。

将来、実際の音声ファイル（.mp3 / .ogg / .wav）に差し替えたい場合は、このフォルダにファイルを置いたうえで `js/audio.js` の各関数（`ignite` / `burnTick` / `laser` / `shred` / `explosion` / `wind` / `destroy` / `combo` / `missionComplete` / `missionFailed`）を `new Audio("../assets/sounds/xxx.mp3").play()` に置き換えてください。
