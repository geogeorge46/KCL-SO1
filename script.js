const API = "https://script.google.com/macros/s/AKfycbyvTZbI2GmxD822B2CguGRwnTdoXJ5coDuj8cRqN38DUbEoRzPfNt52QV6AZQCNCOio/exec";

document.getElementById('year').textContent = new Date().getFullYear();

function showLoader(targetId){
  const loader = document.querySelector(`.loader[data-target="${targetId}"]`);
  if(!loader) return;
  loader.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.style.maxWidth = '420px';
  wrap.className = 'skeleton';
  loader.appendChild(wrap);
}

function hideLoader(targetId){
  const loader = document.querySelector(`.loader[data-target="${targetId}"]`);
  if(!loader) return;
  loader.innerHTML = '';
}

function renderTableFromData(tableId, data){
  const table = document.getElementById(tableId);
  table.innerHTML = '';
  if(!data || data.length === 0){
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5; td.textContent = 'No data available'; td.style.color = '#9aa4b2';
    tr.appendChild(td); table.appendChild(tr); return;
  }

  // If data is array of objects, use keys as headers
  if(Array.isArray(data) && typeof data[0] === 'object' && !Array.isArray(data[0])){
    const keys = Object.keys(data[0]);
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    keys.forEach(k => { const th = document.createElement('th'); th.textContent = k; headRow.appendChild(th); });
    thead.appendChild(headRow); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    data.forEach(row => {
      const tr = document.createElement('tr');
      keys.forEach((k, idx) => { 
        const td = document.createElement('td'); 
        td.textContent = row[k]; 
        // highlight club name if property looks like a club or team
        if(idx === 0 || /club|team|clubname|teamname|club_name/i.test(k)) td.classList.add('club-name');
        tr.appendChild(td); 
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  } else {
    // array of arrays: render simply
    const tbody = document.createElement('tbody');
    data.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach((cell, i) => { const td = document.createElement('td'); td.textContent = cell; if(i===0) td.classList.add('club-name'); tr.appendChild(td); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }
  table.classList.add('fade-in');

  // if this is points table, try to pick the winner (highest numeric value in row)
  if(tableId === 'pointsTable'){
    try{
      // Ensure only the top (first) row is marked as winner.
      // This assumes the points table is sorted with the leader first.
      // Remove any existing winner markers and top-club cells first.
      table.querySelectorAll('tr.winner').forEach(r => r.classList.remove('winner'));
      table.querySelectorAll('td.top-club').forEach(td => td.classList.remove('top-club'));
      const firstRow = table.querySelector('tbody tr:first-child');
      if(firstRow){
        firstRow.classList.add('winner');
        // Prefer a cell already marked as club-name; otherwise find the first non-numeric cell.
        let clubCell = firstRow.querySelector('td.club-name');
        if(!clubCell){
          const cells = Array.from(firstRow.querySelectorAll('td'));
          clubCell = cells.find(c => {
            const text = (c.textContent||'').trim();
            const num = parseFloat(text.replace(/[^0-9.\-]/g,''));
            return text !== '' && Number.isNaN(num);
          }) || cells[0];
        }
        if(clubCell) clubCell.classList.add('top-club');
      }
    }catch(e){ /* ignore */ }
  }
}

function fetchAndRender(action, tableId){
  showLoader(tableId);
  fetch(`${API}?action=${action}`)
    .then(res => res.json())
    .then(data => {
      renderTableFromData(tableId, data);
      hideLoader(tableId);
    })
    .catch(err => {
      hideLoader(tableId);
      const table = document.getElementById(tableId);
      table.innerHTML = '<tr><td style="color:#ffb4b4">Failed to load data</td></tr>';
      console.error('Fetch error', err);
    });
}

// Kickoff
fetchAndRender('players', 'playersTable');
fetchAndRender('table', 'pointsTable');

// Simple client-side search
function wireSearch(inputId, tableId){
  const input = document.getElementById(inputId);
  if(!input) return;
  input.addEventListener('input', ()=>{
    const q = input.value.toLowerCase().trim();
    const rows = Array.from(document.querySelectorAll(`#${tableId} tbody tr`));
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

wireSearch('playersSearch','playersTable');
wireSearch('pointsSearch','pointsTable');

function fetchWinner(){
  fetch(`${API}?action=winner`)
    .then(res => res.json())
    .then(data => {
      if(data.status === "COMPLETED"){
        document.getElementById('winnerName').textContent = data.winner;
        document.getElementById('winnerCard').style.display = 'block';
      }
    })
    .catch(err => console.error("Winner API error", err));
}

fetchWinner();

