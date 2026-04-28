document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-profilo');
  const esito = document.getElementById('esito');

  // Gestione menu Avatar in Navbar
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

  // 1. Fetch profilo professionista dalla sessione utente
  fetch('/professionista/profilo')
    .then(res => {
      if (!res.ok) throw new Error("Errore nel recupero dati profilo");
      return res.json();
    })
    .then(data => {
      // Popola i campi del form
      document.getElementById('user_id').value = data.id || '';
      document.getElementById('nome').value = data.nome || '';
      document.getElementById('cognome').value = data.cognome || '';
      document.getElementById('data_nascita').value = data.data_nascita || '';
      document.getElementById('sede').value = data.sede || '';
      document.getElementById('specializzazione').value = data.specializzazione || '';
      
      // Popola i dati visivi laterali e nella navbar
      if (data.cognome && data.nome) {
        document.getElementById('display-name').textContent = `Dr. ${data.nome} ${data.cognome}`;
        document.getElementById('dropdown-name').textContent = `Dr. ${data.cognome}`;
      }
      if (data.specializzazione) {
        document.getElementById('display-spec').textContent = data.specializzazione;
      }
    })
    .catch(err => {
      console.error(err);
      mostraEsito("Errore nel caricamento del profilo", "error");
    });

  // 2. Salvataggio modifiche (Usando l'evento submit sul form invece che click sul button)
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita il ricaricamento della pagina

    const payload = {
      // Leggiamo anche nome e cognome, anche se UI li mostra disabilitati, 
      // per compatibilità con il vecchio backend.
      nome: document.getElementById('nome').value,
      cognome: document.getElementById('cognome').value,
      data_nascita: document.getElementById('data_nascita').value,
      sede: document.getElementById('sede').value,
      specializzazione: document.getElementById('specializzazione').value
    };

    // Resetta esito
    esito.className = "esito-message";
    esito.textContent = "Salvataggio in corso...";
    esito.classList.add("show");

    fetch('/professionista/profilo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        mostraEsito("✅ Profilo aggiornato con successo!", "success");
        // Aggiorna anche la label laterale se l'utente ha cambiato specializzazione
        document.getElementById('display-spec').textContent = payload.specializzazione || 'Professionista WordCare';
      } else {
        throw new Error("Salvataggio non riuscito");
      }
    })
    .catch(err => {
      console.error(err);
      mostraEsito("❌ Errore durante il salvataggio dei dati", "error");
    });
  });

  // Funzione Helper per mostrare messaggi di esito belli
  function mostraEsito(messaggio, tipo) {
    esito.textContent = messaggio;
    esito.className = `esito-message ${tipo} show`;
    
    // Nascondi automaticamente dopo 4 secondi
    setTimeout(() => {
      esito.classList.remove("show");
    }, 4000);
  }
});