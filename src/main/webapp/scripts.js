function navigate(endpoint) {
    const content = document.getElementById("content");
    content.innerHTML = `
        <h2>${endpoint.replace('-', ' ').toUpperCase()}</h2>
        <p>Buscando dados do endpoint: /Lojas/${endpoint}</p>
        <div>
            <input id="inputId" type="text" placeholder="Digite o ID (opcional)">
            <button onclick="fetchData('${endpoint}')">Buscar</button>
        </div>
        <div id="results"></div>
    `;
}

async function fetchData(endpoint) {
    const id = document.getElementById("inputId").value.trim();
    const url = id ? `http://localhost:8383/Lojas/${endpoint}/${id}` : `http://localhost:8383/Lojas/${endpoint}`;
    const results = document.getElementById("results");

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
            results.innerHTML = generateTable(data);
        } else {
            results.innerHTML = generateTable([data]);
        }
    } catch (error) {
        results.innerHTML = `<p style="color:red;">Erro ao buscar dados: ${error.message}</p>`;
    }
}

function generateTable(data) {
    if (data.length === 0) {
        return '<p>Nenhum dado encontrado.</p>';
    }

    let table = '<table><thead><tr>';
    Object.keys(data[0]).forEach(key => {
        table += `<th>${key}</th>`;
    });
    table += '</tr></thead><tbody>';

    data.forEach(item => {
        table += '<tr>';
        Object.values(item).forEach(value => {
            table += `<td>${value !== null ? value : ''}</td>`;
        });
        table += '</tr>';
    });

    table += '</tbody></table>';
    return table;
}
