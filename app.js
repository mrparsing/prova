import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.2';

const init = async () => {
const embedder = await pipeline('feature-extraction', 'model_quantized.onnx');
  
  const getEmbedding = async (text) => {
    const output = await embedder(text);
    const vectors = output[0];
    const sum = vectors.reduce((acc, vec) => acc.map((v, i) => v + vec[i]), new Array(vectors[0].length).fill(0));
    return sum.map(x => x / vectors.length);
  };

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  };

  document.getElementById('genera').addEventListener('click', async () => {
    const date = document.getElementById('data').value;
    if (!date) return alert("Inserisci una data!");

    const formattedDate = date.replace(/-/g, '');
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const url = `${proxyUrl}https://www.chiesacattolica.it/liturgia-del-giorno/?data-liturgia=${formattedDate}`;

    try {
      const page = await fetch(url).then(r => r.text());
      const parser = new DOMParser();
      const doc = parser.parseFromString(page, 'text/html');
      const sezioni = doc.querySelectorAll('.cci-liturgia-giorno-dettagli-content');

      const letture = {
        antifona: '',
        prima_lettura: '',
        salmo: '',
        seconda_lettura: '',
        vangelo: '',
        antifona_comunione: ''
      };

      sezioni.forEach(section => {
        const titolo = section.querySelector('h2')?.textContent.toLowerCase();
        const contenuto = section.querySelector('div.cci-liturgia-giorno-section-content')?.textContent.trim();
        if (!titolo || !contenuto) return;

        if (titolo.includes('antifona') && !letture.antifona) letture.antifona = contenuto;
        else if (titolo.includes('prima lettura')) letture.prima_lettura = contenuto;
        else if (titolo.includes('salmo')) letture.salmo = contenuto;
        else if (titolo.includes('seconda lettura')) letture.seconda_lettura = contenuto;
        else if (titolo.includes('vangelo')) letture.vangelo = contenuto;
        else if (titolo.includes('comunione')) letture.antifona_comunione = contenuto;
      });

      const fullText = Object.values(letture).filter(Boolean).join(' ');
      const embLetture = await getEmbedding(fullText);

      const songs = await fetch('./canti.json').then(r => r.json());

      const momenti = ['ingresso', 'offertorio', 'comunione', 'finale'];
      const risultati = document.getElementById('risultati');
      risultati.innerHTML = '';

      for (const momento of momenti) {
        const candidati = songs.filter(c => (c.momento || []).includes(momento));
        const scored = candidati.map(c => ({
          ...c,
          similarita: cosineSimilarity(c.embedding, embLetture)
        }));

        scored.sort((a, b) => b.similarita - a.similarita);
        const top = scored.slice(0, 3);

        const div = document.createElement('div');
        div.innerHTML = `<h2>${momento.toUpperCase()}</h2>`;
        top.forEach(c => {
          div.innerHTML += `
            <div class="canto">
              <strong>${c.titolo}</strong><br>
              Similarità: ${c.similarita.toFixed(3)}<br>
              ${c.link_pdf ? `<a href="${c.link_pdf}" target="_blank">PDF</a>` : ''}
              ${c.ascolta ? ` | <a href="${c.ascolta}" target="_blank">Ascolta</a>` : ''}
            </div>
          `;
        });
        risultati.appendChild(div);
      }
    } catch (error) {
      console.error('Errore durante il caricamento dei dati:', error);
      alert('Errore durante il caricamento dei dati. Verifica la console per maggiori dettagli.');
    }
  });
};

init();
