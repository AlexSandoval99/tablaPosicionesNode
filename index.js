const express = require('express');
const axios = require('axios');
const path = require('path');
const XLSX = require('xlsx');
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Ruta para leer y procesar el Excel
app.get('/', async (req, res) => {
  try {
    const fileUrl = "https://docs.google.com/spreadsheets/d/1HKikMoNr5RR05IS9iNkqvIm7DU8Zcy0NcgQQVfTQlyI/export?format=xlsx";
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let positions = {};
    data.forEach(matches => {
      if (matches[0] && matches[3]) {
        if (matches[1] !== '' && matches[1] >= 0 && matches[2] !== '' && matches[2] >= 0) {
          const team1 = matches[0];
          const score1 = matches[1];
          const score2 = matches[2];
          const team2 = matches[3];

          if (!positions[team1]) {
            positions[team1] = { team: team1, played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
          }

          if (!positions[team2]) {
            positions[team2] = { team: team2, played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
          }

          positions[team1].played++;
          positions[team2].played++;

          if (score1 > score2) {
            positions[team1].won++;
            positions[team1].points += 3;
            positions[team2].lost++;
          } else if (score1 < score2) {
            positions[team2].won++;
            positions[team2].points += 3;
            positions[team1].lost++;
          } else {
            positions[team1].drawn++;
            positions[team2].drawn++;
            positions[team1].points++;
            positions[team2].points++;
          }
        }
      }
    });

    positions = Object.values(positions).sort((a, b) => b.points - a.points);

    res.render('inicio', { positions, data, error: null });
  } catch (error) {
    console.error(error);
    res.render('inicio', { positions: null, data: null, error: 'Error al procesar el archivo Excel' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});