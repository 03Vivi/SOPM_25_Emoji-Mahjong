# SOPM_25_Emoji-Mahjong

🧩 Emoji Mahjong Club

Emoji Mahjong Club este un joc de puzzle relaxant, dezvoltat în React, care reinterpretează clasicul Mahjong Solitaire folosind emoji-uri moderne și colorate în locul caracterelor tradiționale chinezești.

🎮 Cum se joacă

Obiectivul este simplu: elimină toate piesele de pe tablă găsind perechi identice.

Selectează o piesă: Poți da click doar pe piesele "libere".

Regula de "Piesă Liberă": O piesă este considerată liberă dacă:

Nu are nicio altă piesă deasupra ei (pe axa Z).

Nu este blocată simultan și în stânga, și în dreapta de alte piese.

Potrivire: Găsește o altă piesă liberă cu același emoji pentru a le elimina pe ambele.

Victorie: Câștigi nivelul când tabla este complet goală!

✨ Funcționalități Principale

3 Niveluri de Dificultate:

🟢 Ușor: Layout simplu, perfect pentru începători.

🟡 Mediu: Provocare echilibrată.

🔴 Greu: Structuri complexe de tip piramidă înaltă.

Sistem de Scor și Timp: Cronometrul pornește automat, iar cel mai bun timp este salvat local.

Salvare Progres: Folosește localStorage pentru a ține minte cel mai bun timp (High Score) pentru fiecare dificultate, chiar dacă dai refresh la pagină.

Grafică 3D CSS: Piesele au un efect tridimensional realizat exclusiv din CSS, fără librării grafice grele.

🛠️ Tehnologii Folosite

React.js: Pentru logica de joc și gestionarea stării.

CSS3: Pentru stilizare, animații și efecte 3D.

JavaScript (ES6+): Pentru algoritmii de generare a hărții și verificare a mutărilor valide.
