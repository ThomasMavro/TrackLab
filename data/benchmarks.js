// Real 400m championship finals. Cumulative splits at 100/200/300 m and official time (s), lane, reaction time (s).
// Only athletes with published 100 m splits are included.
(function (root) {
  const SRC = {
    wa17: 'World Athletics biomechanical report, London 2017 (100 m segments) + official results (lanes, reaction, conditions)',
    seiko: 'Official World Athletics race analysis and results PDFs (Seiko timing)',
    af: 'Split compilation by Athlete First (2025), citing official timing and published analyses',
  };
  const R = (name, nat, lane, rt, s100, s200, s300, fin) => ({ name, nat, lane, rt, splits: [s100, s200, s300, fin] });
  // London 2017 men: segments exclude reaction time, so cumulative = segments + official RT
  const L17 = (name, nat, lane, rt, a, b, c, fin) => R(name, nat, lane, rt, +(a + rt).toFixed(2), +(a + b + rt).toFixed(2), +(a + b + c + rt).toFixed(2), fin);
  const RACES = [
    { round: 'Final', id: 'm2017', sex: 'M', champ: 'World Championships', city: 'London', year: 2017, alt: 15, temp: 19, hum: 56, src: 'wa17', athletes: [
      L17('Wayde van Niekerk', 'RSA', 6, 0.157, 10.69, 9.93, 10.86, 43.98),
      L17('Steven Gardiner', 'BAH', 4, 0.188, 10.85, 9.97, 10.93, 44.41),
      L17('Abdalelah Haroun', 'QAT', 3, 0.190, 11.07, 10.33, 11.06, 44.48),
      L17('Baboloki Thebe', 'BOT', 9, 0.182, 10.76, 10.10, 10.83, 44.66),
      L17('Nathon Allen', 'JAM', 5, 0.158, 10.78, 10.00, 11.02, 44.88),
      L17('Demish Gaye', 'JAM', 8, 0.179, 10.83, 9.98, 11.28, 45.04),
      L17('Fred Kerley', 'USA', 2, 0.142, 10.90, 10.15, 11.17, 45.23),
    ]},
    { round: 'Final', id: 'm2019', sex: 'M', champ: 'World Championships', city: 'Doha', year: 2019, alt: 10, temp: 26, hum: 61, src: 'af', note: 'Cooled stadium.', athletes: [
      R('Steven Gardiner', 'BAH', 4, 0.164, 11.00, 20.96, 31.59, 43.48),
      R('Anthony Zambrano', 'COL', 8, 0.182, 10.98, 21.13, 32.10, 44.15),
      R('Fred Kerley', 'USA', 5, 0.144, 10.87, 20.87, 31.79, 44.17),
    ]},
    { round: 'Final', id: 'm2021', sex: 'M', champ: 'Olympic Games', city: 'Tokyo', year: 2021, alt: 40, temp: null, hum: null, src: 'af', note: 'Tokyo 2020 Games, held in 2021.', athletes: [
      R('Steven Gardiner', 'BAH', 7, 0.179, 11.15, 21.00, 31.83, 43.85),
      R('Anthony Zambrano', 'COL', 5, 0.166, 11.08, 21.21, 32.07, 44.08),
      R('Kirani James', 'GRN', 4, 0.157, 10.74, 20.72, 31.78, 44.19),
      R('Michael Cherry', 'USA', 6, 0.179, 10.92, 21.23, 32.18, 44.21),
    ]},
    { round: 'Final', id: 'm2022', sex: 'M', champ: 'World Championships', city: 'Eugene', year: 2022, alt: 130, temp: 25, hum: 50, src: 'seiko', athletes: [
      R('Michael Norman', 'USA', 4, 0.140, 10.83, 21.12, 32.04, 44.29),
      R('Kirani James', 'GRN', 3, 0.140, 10.81, 20.95, 31.98, 44.48),
      R('Matthew Hudson-Smith', 'GBR', 5, 0.169, 10.98, 21.14, 32.13, 44.66),
      R('Champion Allison', 'USA', 6, 0.148, 11.22, 21.57, 32.76, 44.77),
      R('Wayde van Niekerk', 'RSA', 7, 0.248, 10.98, 21.33, 32.21, 44.97),
      R('Bayapo Ndori', 'BOT', 8, 0.137, 11.05, 21.45, 32.62, 45.29),
      R('Christopher Taylor', 'JAM', 1, 0.169, 10.91, 21.43, 32.81, 45.30),
      R('Jonathan Jones', 'BAR', 2, 0.155, 11.07, 21.46, 32.86, 46.13),
    ]},
    { round: 'Final', id: 'm2023', sex: 'M', champ: 'World Championships', city: 'Budapest', year: 2023, alt: 105, temp: 27, hum: 51, src: 'seiko', note: 'Watson\'s splits from the Athlete First compilation (the official analysis sheet misprints his row).', athletes: [
      R('Antonio Watson', 'JAM', 7, 0.165, 11.18, 21.28, 32.23, 44.22),
      R('Matthew Hudson-Smith', 'GBR', 5, 0.151, 11.08, 21.06, 31.97, 44.31),
      R('Quincy Hall', 'USA', 6, 0.192, 11.39, 21.57, 32.51, 44.37),
      R('Vernon Norwood', 'USA', 8, 0.163, 11.20, 21.36, 32.38, 44.39),
      R('Sean Bailey', 'JAM', 9, 0.169, 11.18, 21.67, 32.90, 44.96),
      R('Håvard Bentdal Ingvaldsen', 'NOR', 3, 0.199, 11.39, 21.66, 32.91, 45.08),
      R('Wayde van Niekerk', 'RSA', 2, 0.171, 11.05, 21.35, 32.44, 45.11),
    ]},
    { round: 'Final', id: 'm2024', sex: 'M', champ: 'Olympic Games', city: 'Paris', year: 2024, alt: 35, temp: null, hum: null, src: 'af', athletes: [
      R('Quincy Hall', 'USA', 8, 0.168, 11.01, 21.00, 31.81, 43.40),
      R('Matthew Hudson-Smith', 'GBR', 6, 0.149, 10.81, 20.62, 31.35, 43.44),
      R('Muzala Samukonga', 'ZAM', 7, 0.185, 10.87, 20.95, 31.91, 43.74),
      R('Jereem Richards', 'TTO', 9, 0.144, 10.69, 20.46, 31.42, 43.78),
      R('Kirani James', 'GRN', 5, 0.147, 10.75, 20.63, 31.50, 43.87),
    ]},
    { round: 'Final', id: 'm2025', sex: 'M', champ: 'World Championships', city: 'Tokyo', year: 2025, alt: 40, temp: 25, hum: 74, src: 'seiko', athletes: [
      R('Busang Collen Kebinatshipi', 'BOT', 5, 0.134, 10.57, 20.56, 31.33, 43.53),
      R('Jereem Richards', 'TTO', 2, 0.145, 10.66, 20.71, 31.67, 43.72),
      R('Bayapo Ndori', 'BOT', 8, 0.144, 10.84, 21.05, 31.91, 44.20),
      R('Rusheen McDonald', 'JAM', 6, 0.201, 10.90, 20.81, 31.65, 44.28),
      R('Zakithi Nene', 'RSA', 7, 0.139, 10.57, 20.69, 31.59, 44.55),
      R('Yuki Joseph Nakajima', 'JPN', 9, 0.201, 11.19, 21.68, 32.67, 44.62),
      R('Jacory Patterson', 'USA', 3, 0.141, 10.64, 20.60, 31.74, 44.70),
      R('Lee Bhekempilo Eppie', 'BOT', 4, 0.151, 10.77, 21.06, 32.14, 44.77),
    ]},
    { round: 'Final', id: 'w2019', sex: 'W', champ: 'World Championships', city: 'Doha', year: 2019, alt: 10, temp: 26, hum: 61, src: 'af', note: 'Cooled stadium.', athletes: [
      R('Salwa Eid Naser', 'BRN', 5, 0.186, 12.09, 23.20, 35.10, 48.14),
      R('Shaunae Miller-Uibo', 'BAH', 7, 0.145, 12.06, 23.61, 35.67, 48.37),
      R('Shericka Jackson', 'JAM', 3, 0.184, 12.19, 23.70, 35.96, 49.47),
    ]},
    { round: 'Final', id: 'w2021', sex: 'W', champ: 'Olympic Games', city: 'Tokyo', year: 2021, alt: 40, temp: null, hum: null, src: 'af', note: 'Tokyo 2020 Games, held in 2021.', athletes: [
      R('Shaunae Miller-Uibo', 'BAH', 7, 0.162, 12.11, 23.40, 35.36, 48.36),
      R('Marileidy Paulino', 'DOM', 5, 0.176, 12.24, 23.64, 35.92, 49.20),
      R('Allyson Felix', 'USA', 9, 0.158, 11.85, 23.40, 35.68, 49.46),
    ]},
    { round: 'Final', id: 'w2022', sex: 'W', champ: 'World Championships', city: 'Eugene', year: 2022, alt: 130, temp: 25, hum: 50, src: 'seiko', athletes: [
      R('Shaunae Miller-Uibo', 'BAH', 3, 0.123, 11.76, 23.24, 35.61, 49.11),
      R('Marileidy Paulino', 'DOM', 6, 0.189, 12.21, 23.78, 36.10, 49.60),
      R('Sada Williams', 'BAR', 7, 0.181, 12.13, 23.55, 35.80, 49.75),
      R('Lieke Klaver', 'NED', 8, 0.107, 11.87, 23.42, 36.17, 50.33),
      R('Stephenie Ann McPherson', 'JAM', 2, 0.131, 12.36, 23.98, 36.52, 50.36),
      R('Fiordaliza Cofil', 'DOM', 4, 0.173, 12.12, 23.71, 36.65, 50.57),
      R('Candice McLeod', 'JAM', 5, 0.159, 12.30, 24.17, 36.83, 50.78),
      R('Anna Kiełbasińska', 'POL', 1, 0.147, 12.28, 24.12, 36.89, 50.81),
    ]},
    { round: 'Final', id: 'w2023', sex: 'W', champ: 'World Championships', city: 'Budapest', year: 2023, alt: 105, temp: 27, hum: 60, src: 'seiko', note: 'McLeod and Diggs are left out: their published splits are missing or inconsistent.', athletes: [
      R('Marileidy Paulino', 'DOM', 7, 0.200, 12.28, 23.36, 35.34, 48.76),
      R('Natalia Kaczmarek', 'POL', 6, 0.168, 12.30, 23.46, 35.92, 49.57),
      R('Sada Williams', 'BAR', 8, 0.183, 12.08, 23.49, 35.90, 49.60),
      R('Rhasidat Adeleke', 'IRL', 4, 0.181, 12.22, 23.54, 35.90, 50.13),
      R('Cynthia Bolingo', 'BEL', 2, 0.190, 12.19, 23.66, 36.30, 50.33),
      R('Lieke Klaver', 'NED', 5, 0.145, 11.96, 23.06, 35.61, 50.33),
    ]},
    { round: 'Final', id: 'w2024', sex: 'W', champ: 'Olympic Games', city: 'Paris', year: 2024, alt: 35, temp: null, hum: null, src: 'af', athletes: [
      R('Marileidy Paulino', 'DOM', 6, 0.187, 11.87, 22.81, 34.78, 48.17),
      R('Salwa Eid Naser', 'BRN', 8, 0.165, 11.73, 23.12, 35.23, 48.53),
      R('Natalia Kaczmarek', 'POL', 7, 0.176, 12.09, 23.22, 35.66, 48.98),
      R('Rhasidat Adeleke', 'IRL', 4, 0.153, 12.01, 23.29, 35.51, 49.28),
      R('Amber Anning', 'GBR', 5, 0.185, 11.95, 23.39, 35.97, 49.29),
    ]},
    { round: 'Final', id: 'w2025', sex: 'W', champ: 'World Championships', city: 'Tokyo', year: 2025, alt: 40, temp: 25, hum: 74, src: 'seiko', athletes: [
      R('Sydney McLaughlin-Levrone', 'USA', 5, 0.171, 11.71, 22.95, 34.87, 47.78),
      R('Marileidy Paulino', 'DOM', 9, 0.183, 11.92, 23.09, 34.97, 47.98),
      R('Salwa Eid Naser', 'BRN', 7, 0.189, 11.84, 23.13, 35.00, 48.19),
      R('Natalia Bukowiecka', 'POL', 8, 0.168, 12.01, 23.38, 35.85, 49.27),
      R('Amber Anning', 'GBR', 6, 0.175, 11.99, 23.45, 35.92, 49.36),
      R('Roxana Gómez', 'CUB', 4, 0.195, 12.49, 23.97, 36.13, 49.48),
      R('Henriette Jæger', 'NOR', 3, 0.148, 12.21, 23.81, 36.12, 49.74),
      R('Nickisha Pryce', 'JAM', 2, 0.158, 12.08, 23.59, 35.99, 49.97),
    ]},
  ];

  // Semi-finals from the official race analysis sheets (2022, 2023, 2025) and partial semis from the compilation (2019, 2024)
  const SEMI = {"S": {"m2025": {"alt": 40, "temp": 28, "hum": 79, "heats": [[["Zakithi Nene", "RSA", 7, 0.159, 10.88, 21.16, 32.19, 44.2], ["Lee Bhekempilo Eppie", "BOT", 6, 0.174, 10.93, 21.15, 32.31, 44.51], ["Reece Holder", "AUS", 8, 0.186, 11.01, 21.01, 32.17, 44.63], ["Ammar Ismail Yahia Ibrahim", "QAT", 2, 0.206, 11.53, 21.85, 32.92, 44.74], ["Attila Molnár", "HUN", 4, 0.173, 11.16, 21.28, 32.62, 44.94], ["Bovel McPherson", "JAM", 9, 0.187, 10.93, 21.05, 32.34, 44.99], ["Christopher Bailey", "USA", 5, 0.178, 11.12, 21.45, 32.58, 45.05], ["Samuel Reardon", "GBR", 3, 0.165, 11.17, 21.35, 32.69, 45.1]], [["Busang Collen Kebinatshipi", "BOT", 3, 0.145, 10.86, 21.07, 32.01, 43.61], ["Rusheen McDonald", "JAM", 7, 0.207, 11.07, 21.29, 32.25, 44.04], ["Jereem Richards", "TTO", 6, 0.169, 10.98, 21.23, 32.44, 44.12], ["Jacory Patterson", "USA", 5, 0.174, 10.83, 21.07, 32.32, 44.19], ["Edoardo Scotti", "ITA", 9, 0.189, 11.1, 21.29, 32.7, 44.77], ["Lythe Pillay", "RSA", 8, 0.172, 11.03, 21.16, 32.37, 44.82], ["Charles Dobson", "GBR", 4, 0.149, 11.12, 21.38, 32.58, 44.85], ["Rok Ferlan", "SLO", 2, 0.195, 11.0, 21.31, 32.71, 45.71]], [["Bayapo Ndori", "BOT", 5, 0.147, 10.81, 20.9, 31.98, 44.21], ["Yuki Joseph Nakajima", "JPN", 7, 0.195, 11.23, 21.65, 32.77, 44.53], ["Muzala Samukonga", "ZAM", 9, 0.193, 11.04, 21.53, 32.69, 44.6], ["Khaleb McRae", "USA", 6, 0.184, 10.99, 21.34, 32.44, 44.82], ["Vernon Norwood", "USA", 8, 0.192, 11.03, 21.38, 32.45, 44.83], ["Matthew Hudson-Smith", "GBR", 2, 0.173, 11.1, 21.0, 32.2, 44.95], ["Kirani James", "GRN", 4, 0.149, 10.68, 20.66, 31.96, 44.97], ["Delano Kennedy", "JAM", 3, 0.184, 11.21, 21.46, 32.84, 44.97]]]}, "w2025": {"alt": 40, "temp": 28, "hum": 76, "heats": [[["Natalia Bukowiecka", "POL", 5, 0.203, 12.01, 23.24, 35.93, 49.67], ["Marileidy Paulino", "DOM", 6, 0.21, 12.04, 23.17, 35.62, 49.82], ["Henriette Jæger", "NOR", 7, 0.176, 11.88, 23.25, 35.93, 49.87], ["Sada Williams", "BAR", 3, 0.185, 12.17, 23.57, 36.1, 50.39], ["Aaliyah Butler", "USA", 4, 0.161, 11.97, 23.37, 36.05, 50.63], ["Wadeline Venlogh", "HAI", 8, 0.202, 11.99, 23.55, 36.19, 50.67], ["Dejanea Oakley", "JAM", 9, 0.179, 12.24, 23.91, 36.91, 51.42], ["Yemi Mary John", "GBR", 2, 0.236, 12.61, 24.47, 37.32, 51.51]], [["Salwa Eid Naser", "BRN", 5, 0.199, 11.85, 23.09, 35.55, 49.47], ["Roxana Gómez", "CUB", 9, 0.223, 12.4, 23.86, 36.12, 49.78], ["Isabella Whittaker", "USA", 6, 0.194, 12.3, 23.75, 36.24, 50.2], ["Lieke Klaver", "NED", 8, 0.243, 12.14, 23.63, 36.37, 50.25], ["Stacey Ann Williams", "JAM", 7, 0.191, 12.12, 23.61, 36.13, 50.39], ["Printassia Johnson", "BAH", 3, 0.184, 12.59, 24.51, 37.07, 50.81], ["Mercy Adongo Oketch", "KEN", 4, 0.251, 12.5, 24.33, 37.11, 51.36], ["Victoria Ohuruogu", "GBR", 2, 0.232, 12.55, 24.24, 37.26, 51.65]], [["Sydney McLaughlin-Levrone", "USA", 8, 0.212, 11.98, 23.43, 35.31, 48.29], ["Amber Anning", "GBR", 6, 0.195, 11.92, 23.23, 35.8, 49.38], ["Nickisha Pryce", "JAM", 7, 0.191, 12.19, 23.45, 35.68, 49.46], ["Martina Weil", "CHI", 5, 0.197, 12.13, 23.7, 36.32, 49.88], ["Bassant Hemida", "EGY", 9, 0.196, 12.33, 23.84, 36.43, 50.69], ["Andrea Miklós", "ROU", 4, 0.167, 12.33, 23.96, 36.83, 50.9], ["Paula Sevilla", "ESP", 2, 0.18, 12.46, 24.17, 37.01, 50.97], ["Sharlene Mawdsley", "IRL", 3, 0.2, 12.57, 23.98, 36.82, 51.22]]]}, "m2023": {"alt": 105, "temp": 29, "hum": 52, "heats": [[["Antonio Watson", "JAM", 5, 0.158, 11.11, 21.01, 32.12, 44.13], ["Vernon Norwood", "USA", 7, 0.181, 11.21, 21.51, 32.98, 44.26], ["Wayde van Niekerk", "RSA", 8, 0.178, 10.94, 21.04, 32.35, 44.65], ["Jereem Richards", "TTO", 4, 0.16, 10.92, 20.91, 32.2, 44.76], ["Kentaro Sato", "JPN", 6, 0.18, 11.16, 21.44, 32.72, 44.99], ["Attila Molnár", "HUN", 9, 0.156, 11.04, 21.21, 32.55, 45.02], ["Michael Joseph", "LCA", 2, 0.161, 11.17, 21.36, 33.01, 45.5], ["Leungo Scotch", "BOT", 3, 0.162, 11.23, 21.56, 33.09, 45.96]], [["Matthew Hudson-Smith", "GBR", 7, 0.167, 10.97, 21.06, 32.23, 44.26], ["Kirani James", "GRN", 5, 0.147, 10.82, 20.85, 32.25, 44.58], ["Håvard Bentdal Ingvaldsen", "NOR", 8, 0.19, 11.16, 21.3, 32.76, 44.7], ["Fuga Sato", "JPN", 6, 0.15, 10.96, 21.09, 32.61, 44.88], ["Liemarvin Bonevacia", "NED", 4, 0.175, 11.32, 21.45, 32.78, 45.23], ["Zandrion Barnes", "JAM", 9, 0.171, 11.16, 21.48, 32.7, 45.38], ["Dylan Borlée", "BEL", 3, 0.153, 11.16, 21.38, 32.93, 45.59], ["Busang Collen Kebinatshipi", "BOT", 2, 0.168, 11.26, 22.3, 34.01, 46.39]], [["Quincy Hall", "USA", 7, 0.176, 11.23, 21.56, 32.58, 44.43], ["Sean Bailey", "JAM", 4, 0.165, 11.08, 21.4, 32.91, 44.94], ["Yuki Joseph Nakajima", "JPN", 9, 0.215, 11.23, 21.56, 32.94, 45.04], ["Davide Re", "ITA", 3, 0.165, 11.33, 21.69, 33.19, 45.29], ["Alexander Doom", "BEL", 5, 0.168, 11.36, 21.56, 33.18, 45.57], ["Zakithi Nene", "RSA", 2, 0.151, 11.06, 21.45, 32.64, 45.64]]]}, "w2023": {"alt": 105, "temp": 28, "hum": 61, "heats": [[["Marileidy Paulino", "DOM", 7, 0.187, 12.29, 23.68, 36.08, 49.54], ["Rhasidat Adeleke", "IRL", 5, 0.161, 12.48, 24.2, 36.63, 49.87], ["Cynthia Bolingo", "BEL", 8, 0.184, 12.23, 23.71, 36.46, 49.96], ["Candice McLeod", "JAM", 9, 0.206, 12.56, 24.15, 36.9, 50.62], ["Evelis Jazmin Aguilar", "COL", 2, 0.157, 12.42, 24.14, 37.06, 51.07], ["Paola Morán", "MEX", 6, 0.215, 12.58, 24.32, 37.18, 51.46], ["Lada Vondrová", "CZE", 3, 0.196, 12.39, 24.02, 37.07, 51.5], ["Zenéy van der Walt", "RSA", 4, 0.202, 12.61, 24.39, 37.42, 51.54]], [["Lieke Klaver", "NED", 6, 0.177, 12.15, 23.52, 36.16, 49.87], ["Talitha Diggs", "USA", 9, 0.174, 12.29, 23.97, 36.72, 50.86], ["Roxana Gómez", "CUB", 7, 0.227, 12.68, 24.33, 36.91, 51.07], ["Ama Pipi", "GBR", 5, 0.173, 12.42, 23.89, 36.8, 51.17], ["Nickisha Pryce", "JAM", 8, 0.186, 12.1, 23.39, 36.25, 51.24], ["Gabby Scott", "PUR", 4, 0.177, 12.45, 24.19, 37.36, 51.52], ["Sharlene Mawdsley", "IRL", 2, 0.177, 12.47, 24.13, 37.24, 51.78], ["Modesta Justė Morauskaitė", "LTU", 3, 0.16, 12.42, 24.13, 37.21, 52.15]], [["Natalia Kaczmarek", "POL", 5, 0.173, 12.19, 23.58, 36.21, 49.5], ["Sada Williams", "BAR", 7, 0.191, 12.21, 23.9, 36.19, 49.58], ["Lynna Irby-Jackson", "USA", 4, 0.173, 12.1, 23.91, 36.84, 50.71], ["Victoria Ohuruogu", "GBR", 8, 0.238, 12.39, 24.21, 36.91, 50.74], ["Andrea Miklós", "ROU", 6, 0.178, 12.43, 24.09, 36.98, 50.77], ["Charokee Young", "JAM", 3, 0.207, 12.62, 24.34, 37.49, 51.4], ["Susanne Gogl-Walli", "AUT", 2, 0.168, 12.5, 24.25, 37.37, 51.5], ["Tereza Petržilková", "CZE", 9, 0.192, 12.83, 24.86, 37.87, 51.94]]]}, "m2022": {"alt": 130, "temp": 32, "hum": 36, "heats": [[["Michael Norman", "USA", 6, 0.127, 10.85, 21.16, 32.19, 44.3], ["Matthew Hudson-Smith", "GBR", 5, 0.16, 10.95, 21.06, 32.02, 44.38], ["Christopher Taylor", "JAM", 3, 0.173, 11.16, 21.66, 32.89, 44.97], ["Zakithi Nene", "RSA", 7, 0.121, 10.92, 21.28, 32.68, 45.24], ["Dylan Borlée", "BEL", 4, 0.163, 11.33, 21.82, 33.01, 45.41], ["Julian Jrummi Walsh", "JPN", 1, 0.134, 11.03, 21.46, 32.72, 45.75], ["Lidio Andrés Feliz", "DOM", 8, 0.192, 11.04, 21.38, 32.96, 46.19], ["Alex Beck", "AUS", 2, 0.14, 11.26, 22.06, 33.43, 46.21]], [["Kirani James", "GRN", 3, 0.148, 10.99, 21.35, 32.64, 44.74], ["Bayapo Ndori", "BOT", 4, 0.141, 11.28, 21.73, 32.77, 44.94], ["Muzala Samukonga", "ZAM", 6, 0.196, 11.45, 22.03, 33.15, 45.02], ["Michael Cherry", "USA", 5, 0.143, 11.23, 21.85, 32.92, 45.28], ["Fuga Sato", "JPN", 1, 0.175, 11.45, 22.21, 33.42, 45.71], ["Alexander Doom", "BEL", 7, 0.17, 11.5, 21.78, 33.25, 45.8], ["Christopher O'Donnell", "IRL", 2, 0.162, 11.54, 22.2, 33.52, 46.01]], [["Champion Allison", "USA", 6, 0.155, 11.34, 21.72, 32.86, 44.71], ["Wayde van Niekerk", "RSA", 4, 0.168, 10.84, 20.97, 32.35, 44.75], ["Jonathan Jones", "BAR", 3, 0.149, 11.27, 21.49, 32.57, 44.78], ["Alex Haydock-Wilson", "GBR", 8, 0.141, 11.46, 21.88, 32.9, 45.08], ["Kevin Borlée", "BEL", 2, 0.139, 11.39, 21.81, 33.0, 45.26], ["Liemarvin Bonevacia", "NED", 5, 0.159, 11.54, 21.77, 32.86, 45.5], ["Mikhail Litvin", "KAZ", 1, 0.189, 11.37, 21.67, 33.04, 45.63], ["Isaac Makwala", "BOT", 7, 0.158, 11.4, 21.89, 32.87, 46.04]]]}, "w2022": {"alt": 130, "temp": 32, "hum": 36, "heats": [[["Shaunae Miller-Uibo", "BAH", 6, 0.129, 11.78, 23.43, 35.71, 49.55], ["Candice McLeod", "JAM", 3, 0.149, 12.25, 23.74, 36.28, 50.05], ["Anna Kiełbasińska", "POL", 4, 0.158, 12.19, 23.93, 36.57, 50.65], ["Rhasidat Adeleke", "IRL", 5, 0.178, 12.33, 24.15, 36.68, 50.81], ["Victoria Ohuruogu", "GBR", 8, 0.178, 12.55, 24.55, 37.29, 50.99], ["Lynna Irby", "USA", 7, 0.184, 12.07, 24.24, 36.8, 51.0], ["Cátia Azevedo", "POR", 1, 0.169, 12.75, 24.73, 37.66, 51.79], ["Tabata Vitorino", "BRA", 2, 0.203, 12.4, 24.64, 37.89, 52.42]], [["Fiordaliza Cofil", "DOM", 5, 0.158, 12.18, 23.83, 36.67, 50.14], ["Lieke Klaver", "NED", 8, 0.14, 12.09, 23.8, 36.69, 50.18], ["Stephenie Ann McPherson", "JAM", 3, 0.133, 12.38, 24.07, 36.72, 50.56], ["Nicole Yeargin", "GBR", 2, 0.156, 12.65, 24.89, 37.57, 51.22], ["Natalia Kaczmarek", "POL", 4, 0.141, 12.51, 24.4, 37.3, 51.34], ["Aliyah Abrams", "GUY", 6, 0.157, 12.46, 24.54, 37.52, 51.79], ["Gabby Scott", "PUR", 7, 0.215, 12.59, 24.65, 37.69, 51.97], ["Susanne Walli", "AUT", 1, 0.157, 12.73, 24.97, 38.13, 52.37]], [["Marileidy Paulino", "DOM", 3, 0.171, 12.18, 23.67, 36.22, 49.98], ["Sada Williams", "BAR", 5, 0.168, 12.37, 24.28, 36.37, 50.12], ["Talitha Diggs", "USA", 6, 0.147, 12.38, 24.48, 37.05, 50.84], ["Roxana Gómez", "CUB", 7, 0.192, 12.7, 24.77, 37.4, 51.12], ["Charokee Young", "JAM", 2, 0.175, 12.49, 24.22, 36.96, 51.41], ["Lada Vondrová", "CZE", 1, 0.199, 12.23, 24.12, 36.85, 51.47], ["Modesta Justė Morauskaitė", "LTU", 4, 0.176, 12.37, 24.29, 37.11, 52.19], ["Ama Pipi", "GBR", 8, 0.174, 12.48, 24.64, 37.7, 52.28]]]}}, "P": {"m2024": {"alt": 35, "temp": null, "hum": null, "heats": {"1": [["Quincy Hall", "USA", 5, 0.179, 11.1, 21.05, 31.92, 43.95]], "2": [["Kirani James", "GRN", 8, 0.147, 10.84, 20.84, 31.79, 43.78], ["Muzala Samukonga", "ZAM", 5, 0.162, 10.77, 20.88, 31.91, 43.81]], "3": [["Matthew Hudson-Smith", "GBR", 7, 0.148, 10.71, 20.56, 31.44, 44.07]]}}, "m2019": {"alt": 10, "temp": null, "hum": null, "heats": {"2": [["Steven Gardiner", "BAH", 6, 0.154, 10.98, 21.09, 32.0, 44.13], ["Kirani James", "GRN", 5, 0.119, 10.89, 21.02, 32.02, 44.23]]}}}, "P50": {"m2019|Steven Gardiner": [6.22, 11.0, 15.92, 20.96, 26.15, 31.59, 37.32, 43.48], "m2019|Anthony Zambrano": [6.08, 10.98, 15.98, 21.13, 26.54, 32.1, 37.91, 44.15], "m2019|Fred Kerley": [6.03, 10.87, 15.78, 20.87, 26.16, 31.79, 37.74, 44.17], "m2021|Steven Gardiner": [6.33, 11.15, 15.96, 21.0, 26.3, 31.83, 37.62, 43.85], "m2021|Anthony Zambrano": [6.12, 11.08, 16.06, 21.21, 26.52, 32.07, 37.86, 44.08], "m2021|Kirani James": [6.01, 10.74, 15.63, 20.72, 26.07, 31.78, 37.8, 44.19], "m2021|Michael Cherry": [6.03, 10.92, 16.02, 21.23, 26.59, 32.18, 37.97, 44.21], "m2024|Quincy Hall": [6.16, 11.01, 15.89, 21.0, 26.34, 31.81, 37.46, 43.4], "m2024|Matthew Hudson-Smith": [6.01, 10.81, 15.65, 20.62, 25.86, 31.35, 37.19, 43.44], "m2024|Muzala Samukonga": [6.11, 10.87, 15.78, 20.95, 26.35, 31.91, 37.68, 43.74], "m2024|Jereem Richards": [6.02, 10.69, 15.43, 20.46, 25.82, 31.42, 37.32, 43.78], "m2024|Kirani James": [5.96, 10.75, 15.61, 20.63, 25.9, 31.5, 37.46, 43.87], "w2019|Salwa Eid Naser": [6.71, 12.09, 17.57, 23.2, 29.03, 35.1, 41.43, 48.14], "w2019|Shaunae Miller-Uibo": [6.58, 12.06, 17.72, 23.61, 29.63, 35.67, 41.81, 48.37], "w2019|Shericka Jackson": [6.64, 12.19, 17.84, 23.7, 29.69, 35.96, 42.47, 49.47], "w2021|Shaunae Miller-Uibo": [6.67, 12.11, 17.65, 23.4, 29.28, 35.36, 41.63, 48.36], "w2021|Marileidy Paulino": [6.76, 12.24, 17.83, 23.64, 29.67, 35.92, 42.33, 49.2], "w2021|Allyson Felix": [6.52, 11.85, 17.52, 23.4, 29.44, 35.68, 42.29, 49.46], "w2024|Marileidy Paulino": [6.56, 11.87, 17.22, 22.81, 28.67, 34.78, 41.15, 48.17], "w2024|Natalia Kaczmarek": [6.64, 12.09, 17.5, 23.22, 29.32, 35.66, 42.06, 48.98], "w2024|Rhasidat Adeleke": [6.58, 12.01, 17.54, 23.29, 29.23, 35.51, 42.02, 49.28], "w2024|Amber Anning": [6.55, 11.95, 17.57, 23.39, 29.56, 35.97, 42.5, 49.29]}};
  const meta = id => RACES.find(r => r.id === id);
  const addSemi = (id, v, src, partial) => {
    const f = meta(id);
    for (const [h, list] of Object.entries(v.heats)) {
      const heat = Array.isArray(v.heats) ? +h + 1 : +h;
      RACES.push({ round: 'Semi-final ' + heat, id: id + 'sf' + heat, sex: f.sex, champ: f.champ, city: f.city, year: f.year, alt: v.alt, temp: v.temp, hum: v.hum, src,
        note: partial ? 'Only the athletes listed in the split compilation for this heat.' : undefined,
        athletes: list.map(a => R(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7])) });
    }
  };
  for (const [id, v] of Object.entries(SEMI.S)) addSemi(id, v, 'seiko', false);
  for (const [id, v] of Object.entries(SEMI.P)) addSemi(id, v, 'af', true);
  // 50 m points for finals, where published
  for (const [key, pts] of Object.entries(SEMI.P50)) {
    const [id, name] = key.split('|'); const r = meta(id); if (!r) continue;
    const a = r.athletes.find(x => x.name === name); if (a && Math.abs(pts[7] - a.splits[3]) < 0.015) a.s50 = pts;
  }
  root.BENCH = { RACES, SRC };
  if (typeof module !== 'undefined') module.exports = root.BENCH;
})(this);
