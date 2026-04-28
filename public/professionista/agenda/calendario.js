let dataSelezionata = null;

document.addEventListener("DOMContentLoaded", async () => {
  const today = new Date();
  const anno = today.getFullYear();
  const mese = today.getMonth();
  const oggiISO = today.toISOString().split("T")[0];

  document.getElementById("titolo-mese").textContent = today.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric"
  });

  generaCalendario(anno, mese);
  await caricaPazienti(); // Carica la lista dei pazienti nella tendina
  await caricaEventi(); // Attendi il caricamento
  apriModal(oggiISO);   // Seleziona oggi come giorno attivo

  document.getElementById("form-appuntamento").onsubmit = creaAppuntamento;
  document.getElementById("form-promemoria").onsubmit = creaPromemoria;
});

function generaCalendario(anno, mese) {
  const ul = document.getElementById("calendar-list");
  const giorni = new Date(anno, mese + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  for (let i = 1; i <= giorni; i++) {
    const data = new Date(anno, mese, i);
    const iso = data.toISOString().split("T")[0];

    const li = document.createElement("li");
    li.dataset.date = iso;

    const time = document.createElement("time");
    time.setAttribute("datetime", iso);
    time.textContent = i;

    li.appendChild(time);
    if (iso === today) li.classList.add("today");

    li.onclick = () => apriModal(iso);
    ul.appendChild(li);
  }
}

async function caricaPazienti() {
  try {
    const res = await fetch("/professionista/pazienti");
    if (!res.ok) throw new Error("Errore fetch pazienti");
    const pazienti = await res.json();
    
    const select = document.getElementById("select-paziente");
    if (!select) return;
    
    // Resettiamo la tendina con il placeholder di default
    select.innerHTML = '<option value="" disabled selected>Seleziona un paziente</option>';
    
    pazienti.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id; // L'ID vero che invieremo al database
      opt.textContent = `${p.nome} ${p.cognome}`; // Il testo che vede il medico
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Errore nel caricamento dei pazienti:", err);
    const select = document.getElementById("select-paziente");
    if (select) {
      select.innerHTML = '<option value="" disabled selected>Errore caricamento pazienti</option>';
    }
  }
}

async function caricaEventi() {
  let [apps, proms] = await Promise.all([
    fetch("/professionista/agenda").then(r => r.json()),
    fetch("/professionista/promemoria").then(r => r.json())
  ]);

  if (!apps || apps.length === 0) {
    apps = []; // Rimosso mock data per farti vedere quelli reali dal DB
  }

  if (!proms || proms.length === 0) {
    proms = [];
  }

  apps.forEach(app => {
    creaEventoHTML(app.data, app.ora, "appuntamento", `${app.paziente_nome} ${app.paziente_cognome}`, app.id);
  });
  proms.forEach(prom => {
    creaEventoHTML(prom.data, prom.ora_notifica, "promemoria", prom.nota, prom.id);
  });
}

function creaEventoHTML(data, ora, tipo, descrizione, id) {
  const box = document.querySelector(`li[data-date="${data}"]`);
  if (!box) return;

  const div = document.createElement("div");
  div.className = `event ${tipo}`;
  div.textContent = `${ora} - ${descrizione}`;
  div.dataset.id = id;
  box.appendChild(div);
}

function apriModal(data) {
  dataSelezionata = data;
  document.getElementById("data-attiva").textContent = data;
  mostraEliminazione();
}

function mostraEliminazione() {
  const lista = document.getElementById("eventi-giorno");
  lista.innerHTML = "";
  document.querySelectorAll(`#calendar-list li[data-date="${dataSelezionata}"] .event`)
    .forEach(ev => {
      const li = document.createElement("li");
      li.textContent = ev.textContent;

      const btn = document.createElement("button");
      btn.textContent = "X";
      btn.onclick = () => eliminaEvento(ev.dataset.id, ev.classList.contains("appuntamento"));

      li.appendChild(btn);
      lista.appendChild(li);
    });
}

function eliminaEvento(id, isAppuntamento) {
  const url = isAppuntamento ? `/professionista/agenda/${id}/elimina` : `/professionista/promemoria/${id}/elimina`;
  fetch(url, { method: "POST" }).then(r => r.ok && location.reload());
}

// --- FUNZIONE AGGIORNATA CON GESTIONE ERRORI AVANZATA ---
async function creaAppuntamento(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const dati = {
    data: form.get('data'),
    ora: form.get('ora'),
    sede: form.get('sede'),
    paziente_id: form.get('paziente_id')
  };

  if (!dati.data) {
    alert("Inserisci una data valida.");
    return;
  }

  try {
    const res = await fetch("/professionista/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati)
    });

    if (res.ok) {
      alert("✅ Appuntamento salvato!");
      location.reload();
    } else {
      // Leggiamo l'errore personalizzato dal server
      const errorData = await res.json();
      
      if (errorData.code === 'PAZIENTE_NON_VALIDO') {
        // Mostriamo un pop-up interattivo con possibilità di reindirizzamento
        const goToPatients = confirm(`⚠️ ${errorData.message}\n\nVuoi andare alla tua Home / Lista Pazienti per verificare l'ID corretto o aggiungere il paziente?`);
        
        if (goToPatients) {
          // Reindirizzamento alla rotta dove vedi i pazienti (modifica l'URL se necessario)
          window.location.href = "/professionista/home"; 
        }
      } else {
        alert("❌ Errore: " + (errorData.error || "Errore sconosciuto nel salvataggio."));
      }
    }
  } catch (err) {
    console.error("Errore di rete:", err);
    alert("❌ Impossibile comunicare con il server.");
  }
}

async function creaPromemoria(e) {
  e.preventDefault();
  const dati = Object.fromEntries(new FormData(e.target).entries());

  if (!dati.data) {
    alert("Inserisci una data valida.");
    return;
  }

  const res = await fetch("/professionista/promemoria", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dati)
  });

  if (res.ok) {
    alert("✅ Promemoria salvato!");
    location.reload();
  } else {
    alert("❌ Errore nel salvataggio del promemoria.");
  }
}