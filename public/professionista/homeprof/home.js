document.addEventListener("DOMContentLoaded", () => {
  
  // Gestione menu Avatar
  const avatarTrigger = document.getElementById("avatar-dropdown-trigger");
  const avatarMenu = document.getElementById("avatar-dropdown-menu");
  
  avatarTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarMenu.classList.toggle("active");
  });

  document.addEventListener("click", () => {
      if(avatarMenu.classList.contains("active")) {
          avatarMenu.classList.remove("active");
      }
  });

  // 1. Messaggio di benvenuto e info Profilo
  fetch("/professionista/profilo")
    .then(res => res.json())
    .then(data => {
      console.log("✅ Dati ricevuti:", data);
      const welcome = document.getElementById("welcomeMessage");
      const dropdownName = document.getElementById("dropdown-name");
      
      if (welcome && data.cognome) {
        welcome.textContent = `Bentornato, Dr. ${data.cognome} ${data.nome}`;
        dropdownName.textContent = `Dr. ${data.cognome}`;
      }
    })
    .catch(err => {
      console.error("❌ Errore nel caricamento del profilo:", err);
    });

  // 2. Appuntamenti
  fetch("/professionista/agenda")
    .then(res => res.json())
    .then(data => {
      const today = new Date();
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);

      // Dati demo per la presentazione
      if (!data || data.length === 0) {
        data = [
          { data: "2025-06-04", ora: "10:00", paziente_nome: "Marco", paziente_cognome: "Verdi" },
          { data: "2025-06-05", ora: "14:00", paziente_nome: "Sara", paziente_cognome: "Rossi" },
          { data: "2025-06-06", ora: "16:30", paziente_nome: "Luca", paziente_cognome: "Bianchi" }
        ];
      }

      const filtered = data.filter(app => {
        const appDate = new Date(app.data);
        return appDate >= today && appDate <= weekAhead;
      }).slice(0, 3);

      const listContainer = document.getElementById("appuntamentiList");
      listContainer.innerHTML = ""; // Pulisce loading state

      if(filtered.length === 0) {
          listContainer.innerHTML = `<p style="text-align:center; color: var(--subtext)">Nessun appuntamento imminente.</p>`;
          return;
      }

      filtered.forEach(app => {
        const dataObj = new Date(app.data);
        const mese = dataObj.toLocaleString('it-IT', { month: 'short' });
        const giorno = String(dataObj.getDate()).padStart(2, '0');

        // Creazione HTML della Card stile Paziente
        listContainer.innerHTML += `
            <div class="appointment-list-item">
                <div class="date-badge">
                    <div class="month">${mese}</div>
                    <div class="day">${giorno}</div>
                </div>
                <div class="appointment-details">
                    <div class="appointment-date"><i class="far fa-clock"></i> Ore ${app.ora}</div>
                    <div class="appointment-professional">
                        <i class="fas fa-user-injured"></i> ${app.paziente_nome} ${app.paziente_cognome}
                    </div>
                </div>
            </div>
        `;
      });
    });

  // 3. Promemoria
  fetch("/professionista/promemoria")
    .then(res => res.json())
    .then(data => {
      const today = new Date();
      const weekAhead = new Date();
      weekAhead.setDate(today.getDate() + 7);

      // Dati demo per la presentazione
      if (!data || data.length === 0) {
        data = [
          { data: "2025-06-05", ora_notifica: "09:00", nota: "Controllare referti paziente Rossi" },
          { data: "2025-06-06", ora_notifica: "11:30", nota: "Inviare report alla logopedista" },
          { data: "2025-06-07", ora_notifica: "15:00", nota: "Telefonata di follow-up a Bianchi" }
        ];
      }

      const filtered = data.filter(p => {
        const promDate = new Date(p.data);
        return promDate >= today && promDate <= weekAhead;
      }).slice(0, 3);

      const listContainer = document.getElementById("promemoriaList");
      listContainer.innerHTML = "";

      if(filtered.length === 0) {
          listContainer.innerHTML = `<p style="text-align:center; color: var(--subtext)">Nessun promemoria attivo.</p>`;
          return;
      }

      filtered.forEach(p => {
        const dataObj = new Date(p.data);
        const mese = dataObj.toLocaleString('it-IT', { month: 'short' });
        const giorno = String(dataObj.getDate()).padStart(2, '0');

        // Card Promemoria con colori d'allerta (giallo/arancione)
        listContainer.innerHTML += `
            <div class="appointment-list-item warning">
                <div class="date-badge warning-badge">
                    <div class="month">${mese}</div>
                    <div class="day">${giorno}</div>
                </div>
                <div class="appointment-details">
                    <div class="appointment-date"><i class="fas fa-bell"></i> Ore ${p.ora_notifica}</div>
                    <div class="appointment-professional">
                        <i class="fas fa-sticky-note"></i> ${p.nota}
                    </div>
                </div>
            </div>
        `;
      });
    });
});