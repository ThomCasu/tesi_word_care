// /professionista/i tuoi pazienti/pazienti.js

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('lista-pazienti');
  const form = document.getElementById('form-aggiungi-paziente');

  // Gestione menu Avatar
  const avatarTrigger = document.getElementById("avatar-dropdown-trigger");
  const avatarMenu = document.getElementById("avatar-dropdown-menu");
  
  if (avatarTrigger && avatarMenu) {
      avatarTrigger.addEventListener("click", (e) => {
          e.stopPropagation();
          avatarMenu.classList.toggle("active");
      });
      document.addEventListener("click", () => {
          if(avatarMenu.classList.contains("active")) avatarMenu.classList.remove("active");
      });
  }

  // Caricamento Dati Profilo per Navbar
  fetch("/professionista/profilo")
    .then(res => res.json())
    .then(data => {
      const dropdownName = document.getElementById("dropdown-name");
      if (dropdownName && data.cognome) dropdownName.textContent = `Dr. ${data.cognome}`;
    }).catch(err => console.error(err));

  // 🔄 Funzione di caricamento pazienti (con o senza filtri)
  function caricaPazienti(query = '', eta = '') {
    let url = '/professionista/pazienti';
    
    // Se l'utente ha inserito dei filtri, dirottiamo la chiamata sul nuovo endpoint di ricerca
    if (query || eta) {
        url = `/professionista/pazienti/ricerca?query=${encodeURIComponent(query)}&eta=${encodeURIComponent(eta)}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Errore durante il caricamento dei pazienti");
        return res.json();
      })
      .then(data => {
        container.innerHTML = '';

        // Mostriamo il paziente Demo solo se NON ci sono filtri attivi
        if (!query && !eta) {
            const pazienteDemo = {
              id: 'demo',
              nome: 'Mario',
              cognome: 'Rossi (Demo)',
              data_nascita: '1980-01-01',
              patologia: 'Paziente Dimostrativo'
            };
            const urlDettagliDemo = `/professionista/i tuoi pazienti/dettagli/dettagli.html?id=${pazienteDemo.id}`;
            container.appendChild(creaCardPaziente(pazienteDemo, urlDettagliDemo));
        }

        if (data.length === 0) {
            container.innerHTML += '<p style="grid-column: 1/-1; text-align: center; color: #555; padding: 20px;">Nessun paziente trovato con i filtri correnti.</p>';
        }

        // Popola la lista vera e propria con i dati dal database
        data.forEach(p => {
          const urlDettagli = `/professionista/i tuoi pazienti/dettagli/dettagli.html?id=${p.id}`;
          container.appendChild(creaCardPaziente(p, urlDettagli));
        });
      })
      .catch(err => {
        console.error(err);
        container.innerHTML = '<p style="color: var(--danger); grid-column: 1/-1;">Si è verificato un errore durante il caricamento dei pazienti.</p>';
      });
  }

  // Eseguiamo il caricamento iniziale (senza filtri)
  caricaPazienti();

  // 🔍 Configurazione Dinamica Barra di Ricerca
  // Inseriamo la UI di ricerca dinamicamente per non dover toccare l'HTML
  let searchContainer = document.getElementById('search-container');
  if (!searchContainer) {
      searchContainer = document.createElement('div');
      searchContainer.id = 'search-container';
      searchContainer.style.cssText = 'margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; grid-column: 1/-1;';
      
      searchContainer.innerHTML = `
          <input type="text" id="searchBar" placeholder="Cerca per nome o cognome..." style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex-grow: 1; min-width: 200px; font-family: inherit;">
          <input type="number" id="ageFilter" placeholder="Età" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; width: 100px; font-family: inherit;">
          <button id="btnSearch" class="btn" style="padding: 10px 20px; border-radius: 8px; background: var(--primary, #007bff); color: white; cursor: pointer; border: none; font-weight: bold;"><i class="fas fa-search"></i> Cerca</button>
          <button id="btnClearSearch" class="btn" style="padding: 10px 20px; border-radius: 8px; background: #6c757d; color: white; cursor: pointer; border: none; font-weight: bold;"><i class="fas fa-times"></i> Reset</button>
      `;
      
      // Inseriamo il box di ricerca subito prima della griglia dei pazienti
      container.parentNode.insertBefore(searchContainer, container);
      
      // Agganciamo gli eventi ai pulsanti
      document.getElementById('btnSearch').addEventListener('click', () => {
          const query = document.getElementById('searchBar').value.trim();
          const eta = document.getElementById('ageFilter').value.trim();
          caricaPazienti(query, eta);
      });

      document.getElementById('btnClearSearch').addEventListener('click', () => {
          document.getElementById('searchBar').value = '';
          document.getElementById('ageFilter').value = '';
          caricaPazienti(); // Ricarica tutto svuotando i filtri
      });
  }

  // ➕ Aggiunta paziente
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const nome = document.getElementById('nome').value.trim();
      const cognome = document.getElementById('cognome').value.trim();
      const data_nascita = document.getElementById('data_nascita').value;
      const patologia = document.getElementById('patologia').value.trim();

      fetch('/professionista/pazienti/aggiungi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cognome, data_nascita, patologia })
      })
      .then(async res => {
        // Se riceviamo lo status 409, estraiamo l'errore custom e lo lanciamo
        if (res.status === 409) {
          const errData = await res.json();
          throw new Error(errData.error);
        }
        if (!res.ok) throw new Error("Errore generico durante l'aggiunta del paziente");
        return res.json();
      })
      .then(data => {
        alert("✅ Paziente aggiunto con successo!");
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
        // Mostriamo all'utente il messaggio esatto
        alert(`❌ ${err.message}`);
      });
    });
  }
});

// 🛠️ Funzione Helper per mostrare il Modale Personalizzato
function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('custom-confirm-modal');
  const messageEl = document.getElementById('confirm-modal-message');
  const btnCancel = document.getElementById('btn-modal-cancel');
  const btnConfirm = document.getElementById('btn-modal-confirm');

  // Imposta il messaggio
  messageEl.textContent = message;
  
  // Mostra il modale
  modal.classList.add('active');

  // Rimuovi vecchi event listener clonando i bottoni (per evitare esecuzioni multiple)
  const newBtnCancel = btnCancel.cloneNode(true);
  btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
  
  const newBtnConfirm = btnConfirm.cloneNode(true);
  btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

  // Gestore per l'annullamento
  newBtnCancel.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Gestore per la conferma
  newBtnConfirm.addEventListener('click', () => {
    modal.classList.remove('active');
    onConfirm(); // Esegui la funzione passata come parametro
  });
}

// 🛠️ Funzione Helper per creare l'HTML della Card
function creaCardPaziente(p, urlDestinazione) {
  const card = document.createElement('div');
  card.className = 'patient-card';
  
  // Crea le iniziali per l'avatar circolare
  const iniziali = (p.nome.charAt(0) + p.cognome.charAt(0)).toUpperCase();
  const patologiaText = p.patologia ? p.patologia : 'Nessuna patologia specificata';

  // Pulsante di rimozione (solo se NON è il paziente demo) con data-tooltip per il popup visivo
  const isDemo = p.id === 'demo';
  const btnHtml = isDemo ? '' : `
    <button class="btn-remove-patient" data-tooltip="Termina cura" data-id="${p.id}">
      <i class="fas fa-user-slash"></i>
    </button>
  `;

  card.innerHTML = `
    <div class="patient-avatar-circle">${iniziali}</div>
    <div class="patient-info" style="flex-grow: 1;">
      <h3>${p.nome} ${p.cognome}</h3>
      <p><i class="fas fa-birthday-cake"></i> ${calcolaEta(p.data_nascita)} anni</p>
      <p><i class="fas fa-notes-medical"></i> ${patologiaText}</p>
    </div>
    ${btnHtml}
  `;

  // Al click sulla card
  card.onclick = (e) => {
    // 🛑 IMPORTANTE: Se il click avviene sul bottone di rimozione (o sulla sua icona),
    // ignoriamo il reindirizzamento alla pagina di dettaglio.
    if (e.target.closest('.btn-remove-patient')) {
      return; 
    }
    window.location.href = urlDestinazione;
  };

  // Gestione click del pulsante di rimozione
  if (!isDemo) {
    const btnRemove = card.querySelector('.btn-remove-patient');
    if (btnRemove) {
      btnRemove.onclick = (e) => {
        e.stopPropagation(); // Ferma la propagazione dell'evento per sicurezza

        // Messaggio per il modale
        const modalMessage = `Sei sicuro di voler terminare il percorso di cura con ${p.nome} ${p.cognome}?\n\nQuesta azione lo rimuoverà dalla tua lista pazienti.`;

        // Chiama il nostro Modale personalizzato invece del confirm() standard
        showConfirmModal(modalMessage, () => {
          // Callback di conferma: Esegue la chiamata all'API
          fetch(`/professionista/pazienti/${p.id}/rimuovi`, { 
            method: 'DELETE' 
          })
          .then(res => {
            if (!res.ok) throw new Error("Errore durante la rimozione dal server.");
            return res.json();
          })
          .then(data => {
            if (data.success) {
              // Rimuove la card dalla UI in tempo reale
              card.style.transform = 'scale(0.9)';
              card.style.opacity = '0';
              setTimeout(() => card.remove(), 300);
            }
          })
          .catch(err => {
            console.error(err);
            alert("❌ Si è verificato un errore durante la rimozione del paziente.");
          });
        });
      };
    }
  }

  return card;
}

// 🔧 Calcolo età da data di nascita (formato YYYY-MM-DD)
function calcolaEta(dataNascita) {
  if (!dataNascita) return 'N/A';
  const oggi = new Date();
  const nascita = new Date(dataNascita);
  let eta = oggi.getFullYear() - nascita.getFullYear();
  const m = oggi.getMonth() - nascita.getMonth();
  if (m < 0 || (m === 0 && oggi.getDate() < nascita.getDate())) {
    eta--;
  }
  return eta;
}