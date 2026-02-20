# Rendszer útmutató

## Alap használat

- Húzd az elemeket az **Elem palettáról** a vászonra.
- Kapcsold össze az elemeket az output handle-ről az input handle-re húzva.
- Jelölj ki egy node-ot vagy edge-et a jobb oldali sávban történő szerkesztéshez.
- A **Beállítások** panelen állíthatod az irányt, él stílust, címkéket és a minimapet.
- A felső kapcsolóval válthatsz:
  - **Fejlesztés** flow
  - **Üzleti terv** flow

## Billentyűk

- `Delete` / `Backspace`: kijelölt node vagy edge törlése.
- `Ctrl + C`: kijelölt node(ok) másolása.
- `Ctrl + V`: másolt node(ok) beillesztése.
- `Ctrl + D`: kijelölt node(ok) duplikálása.
- `Ctrl + Z`: visszavonás (globális előzmény, legfeljebb 3 lépés).
- `Ctrl + K`: élcímkék globális ki/be kapcsolása (ugyanaz, mint Beállítások -> Címkék elrejtése).

## Csoportosítás (Stack)

- Jelölj ki legalább 2 node-ot.
- Jobb klikk egy kijelölt node-on, majd **Kijelöltek csoportosítása**.
- A node-ok egy stack node-ba kerülnek a vizuális zaj csökkentésére.
- Jobb klikk a stack node-on, majd **Csoport szétbontása** a visszaállításhoz.

## Jegyzet és kód csatolás (node-ra húzással)

- Húzz egy `Comment` vagy `Code` node-ot a cél node közelébe.
- Engedd el, amikor megjelenik a csatolási előnézet.
- A csatolt node-ok a cél node alá kerülnek elrejtve.
- A cél node külön számlálót mutat:
  komment buborék ikon kommentekhez, kód ikon kód blokkokhoz.
- A badge-re kattintva ki/be csukhatod a csatolt elemeket.

## Navigátor

- A felső sávban kapcsold be az **Elem navigátort**.
- Kattints egy node-ra a navigátorban az adott ág fókuszálásához.
- A szem ikonnal elrejthetsz egy node-ot/részfát.
- A rejtett és fókusz állapot csak a vászon nézetét érinti.

## Két flow-s adatmodell (visszafelé kompatibilis)

- A projektfájl két tervezési flow-t támogat:
  - `development`
  - `business`
- Új opcionális felső szintű mezők:
  - `activeFlow`
  - `flows`
- A régi mezők (`ui`, `pages`) kompatibilitás miatt megmaradnak.
- Betöltéskor:
  - a régi fájlok automatikusan migrálódnak a `flows.development` alá
  - az `ui/pages` az aktív flow-ból tükröződik
- Mentés/export közben:
  - az aktív flow visszaszinkronizálódik a `flows[activeFlow]` mezőbe
  - a régi `ui/pages` mezők megmaradnak a kompatibilitás miatt

## Flow starterek és bridge

- Minden flow-hoz van kezdő vászon sablon:
  - `development`: implementáció-központú kezdő sablon
  - `business`: üzleti brief-központú kezdő sablon
- Ha üres flow-ra váltasz először, a starter tartalom automatikusan létrejön.
- Az új `Flow Bridge` node másik flow/page/node célra mutathat:
  - `toFlow`
  - `toPageId`
  - `toNodeId`
- A Bridge node validálja a cél hivatkozásokat, és az állapotot közvetlenül a node-on jelzi.
