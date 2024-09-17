Reversi AI - Hra s umelou inteligenciou
Autor kódu: Ing. Robert Polák

Popis projektu
Táto aplikácia je implementáciou stolovej hry Reversi (známej aj ako Othello) pomocou HTML5 Canvas a JavaScriptu. Hra umožňuje hrať proti počítaču, ktorý využíva kombináciu knihy otvorení a heuristického algoritmu Minimax s orezávaním alfa-beta.

Funkcionality
Hra proti počítaču: Vyskúšajte si svoje strategické schopnosti proti AI hráčovi.
Kniha otvorení: AI využíva preddefinovanú knihu otvorení, ktorá obsahuje známe sekvencie ťahov na začiatku hry. Zohľadňuje sa aj symetria dosky (rotácie o 90°, 180°, 270°).
Heuristická evaluácia: Pri absencii ťahov v knihe otvorení AI prechádza na heuristickú evaluáciu pozícií na doske.
Nastaviteľná hĺbka vyhľadávania: Možnosť nastaviť hĺbku pre algoritmus Minimax (1 až 10).
Intuitívne rozhranie: Moderný a príjemný dizajn pre lepší herný zážitok.
Inštalácia a spustenie
Klonujte alebo stiahnite tento repozitár do vášho počítača.
Uistite sa, že súbory index.html a reversi.js sú v rovnakom adresári.
Otvorte súbor index.html vo vašom obľúbenom webovom prehliadači (odporúča sa Chrome alebo Firefox).
Začnite hrať kliknutím na dosku a vykonaním svojho prvého ťahu.
Ako hrať
Hráte s čiernymi kameňmi a začínate hru.
Kliknite na políčko, kam chcete umiestniť svoj kameň. Platné ťahy sú zvýraznené.
Cieľom je mať na konci hry viac svojich kameňov na doske než súper.
Počítač vykoná svoj ťah automaticky po vás.
Môžete nastaviť hĺbku vyhľadávania pre AI. Vyššia hodnota znamená inteligentnejšie rozhodnutia, ale dlhší čas výpočtu.
Použitá heuristika
Váhovanie pozícií: Každé políčko na doske má pridelenú váhu podľa jeho strategického významu. Rohy majú najvyššiu hodnotu, okraje strednú a vnútorné polia nižšiu.
Minimax algoritmus: AI používa algoritmus Minimax s orezávaním alfa-beta na predikciu najlepšieho ťahu do určitej hĺbky.
Kniha otvorení: AI začína hru pomocou knihy otvorení, ktorá obsahuje preddefinované sekvencie ťahov. Kniha zohľadňuje aj rotácie dosky, takže AI dokáže rozpoznať otvorenia aj pri symetrických pozíciách.
Prispôsobenie
Pridanie vlastných otvorení: Môžete upraviť alebo pridať nové otvorenia do knihy v súbore reversi.js v časti openingBook.
Úprava heuristiky: Zmeňte váhy v matice POSITION_WEIGHTS pre experimentovanie s rôznymi stratégiami AI.
Dizajn: Upraviť vzhľad stránky môžete v súbore index.html v sekcii <style>.
Ukážka
Tu môžete pridať screenshoty alebo GIFy hry pre lepšiu vizualizáciu.

Licencia
Tento projekt je licencovaný pod licenciou MIT. Podrobnosti nájdete v súbore LICENSE.

Kontakt
Ak máte otázky alebo návrhy, môžete ma kontaktovať na e-mailovej adrese: [robopol@gmail.com]
