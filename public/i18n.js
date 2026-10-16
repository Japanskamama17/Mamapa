window.BEBI_I18N = {
  hr: {
    sub: "Mjesta za roditelje s djecom 0–3 god.",
    search: "Traži mjesto ili adresu…", all: "Sve", allDistricts: "Svi kvartovi", places: "Mjesta",
    add: "+ Dodaj mjesto", login: "Prijava s Googleom", loginShort: "Prijava", logout: "Odjava",
    loginToPost: "Za dodavanje mjesta i recenzija prijavi se Google računom.",
    emptyT: "Još nema mjesta", emptyD: "Dodaj prvo mjesto koje poznaješ — stol za previjanje, igraonicu ili kafić bez dima.",
    noMatch: "Nema mjesta za ovaj filter.", loading: "Učitavanje…", offline: "Podaci trenutno nisu dostupni. Pokušaj ponovno kasnije.",
    shareLbl: "Zalijepi Google Maps poveznicu", shareHelp: "Google Maps → mjesto → Dijeli → Kopiraj, pa zalijepi ovdje.",
    finding: "Tražim mjesto…", found: "Pronađeno", notFound: "Iz poveznice ne mogu pročitati sve podatke. Dopuni ih ispod.",
    name: "Naziv", address: "Adresa", district: "Kvart",
    loc: "Lokacija na karti", locSet: "Lokacija je na karti", locMissing: "Lokacija nije pronađena", pickOnMap: "Označi na karti", moveLoc: "Pomakni",
    pick: "Dodirni kartu točno na mjestu", cancel: "Odustani",
    cats: "Što ima", writeReview: "Recenzija", optional: "neobavezno",
    reviewText: "Što treba znati (kat, gdje je stol, ulaz s kolicima…)", addPhoto: "Fotografije",
    photoTip: "Molimo bez lica djece na fotografijama.",
    save: "Spremi", saving: "Spremam…", saved: "Spremljeno",
    needLink: "Zalijepi Google Maps poveznicu ili upiši naziv.", needName: "Upiši naziv mjesta.", needLoc: "Postavi lokaciju na karti.", needCat: "Odaberi barem jednu kategoriju.",
    saveErr: "Spremanje nije uspjelo. Provjeri vezu i pokušaj ponovno.", photoErr: "Neke fotografije se nisu učitale.",
    dupe: "Ovo mjesto već postoji. Otvori ga i dodaj recenziju.", openIt: "Otvori",
    gmaps: "Otvori u Google kartama", reviews: "Recenzije", noReviews: "Još nema recenzija.",
    post: "Objavi", del: "Obriši", delPlace: "Obriši mjesto", confirmDel: "Sigurno obrisati?", yes: "Da, obriši",
    someone: "Roditelj", foot: "Karta © OpenStreetMap suradnici, OpenFreeMap. Podatke dodaju roditelji iz Zagreba.",
    reviewsN: n => n === 1 ? "1 recenzija" : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? n + " recenzije" : n + " recenzija"
  },
  en: {
    sub: "Places for parents with kids aged 0–3",
    search: "Search places or addresses…", all: "All", allDistricts: "All districts", places: "Places",
    add: "+ Add place", login: "Sign in with Google", loginShort: "Sign in", logout: "Sign out",
    loginToPost: "Sign in with your Google account to add places and reviews.",
    emptyT: "No places yet", emptyD: "Add the first spot you know — a changing table, a play area or a smoke-free café.",
    noMatch: "No places match this filter.", loading: "Loading…", offline: "Data isn't available right now. Try again later.",
    shareLbl: "Paste a Google Maps link", shareHelp: "Google Maps → the place → Share → Copy, then paste here.",
    finding: "Looking up the place…", found: "Found", notFound: "Couldn't read everything from the link. Fill in the rest below.",
    name: "Name", address: "Address", district: "District",
    loc: "Location on map", locSet: "Location is on the map", locMissing: "Location not found", pickOnMap: "Mark on map", moveLoc: "Move",
    pick: "Tap the map exactly at the spot", cancel: "Cancel",
    cats: "What's there", writeReview: "Review", optional: "optional",
    reviewText: "Good to know (floor, where the table is, stroller entrance…)", addPhoto: "Photos",
    photoTip: "Please keep children's faces out of photos.",
    save: "Save", saving: "Saving…", saved: "Saved",
    needLink: "Paste a Google Maps link or type a name.", needName: "Enter the place name.", needLoc: "Set the location on the map.", needCat: "Choose at least one category.",
    saveErr: "Couldn't save. Check your connection and try again.", photoErr: "Some photos didn't upload.",
    dupe: "This place is already listed. Open it and add your review.", openIt: "Open",
    gmaps: "Open in Google Maps", reviews: "Reviews", noReviews: "No reviews yet.",
    post: "Post", del: "Delete", delPlace: "Delete place", confirmDel: "Delete for sure?", yes: "Yes, delete",
    someone: "Parent", foot: "Map © OpenStreetMap contributors, OpenFreeMap. Places added by parents in Zagreb.",
    reviewsN: n => n === 1 ? "1 review" : n + " reviews"
  }
};
window.BEBI_CATS = [
  { id: "changing",   hr: "Stol za previjanje", en: "Changing table" },
  { id: "playarea",   hr: "Igraonica",          en: "Indoor play area" },
  { id: "playground", hr: "Dječje igralište",   en: "Playground" },
  { id: "nosmoke",    hr: "Kafić bez pušenja",  en: "Smoke-free café" },
  { id: "nursing",    hr: "Kutak za dojenje",   en: "Nursing room" },
  { id: "stroller",   hr: "Pristup s kolicima", en: "Stroller-friendly" }
];
window.BEBI_COLORS = { changing:"#17A99B", playarea:"#F15A2B", playground:"#F5B21B", nosmoke:"#1F6DB3", nursing:"#E9677A", stroller:"#5E6F7E" };
