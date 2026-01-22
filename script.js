const chatInput = document.querySelector('#chat-input');
const sendBtn = document.querySelector('#send-btn');
const messagesContainer = document.querySelector('#messages-container');
const emptyState = document.querySelector('.empty-state');

// Conversation ID Management
let currentConversationId = null;
const CONVERSATION_ID_KEY = 'kpmg_current_conversation_id';

// Initialize or load conversation ID
function initializeConversationId() {
    const savedId = localStorage.getItem(CONVERSATION_ID_KEY);
    if (savedId) {
        currentConversationId = savedId;
    } else {
        generateNewConversationId();
    }
}

function generateNewConversationId() {
    currentConversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(CONVERSATION_ID_KEY, currentConversationId);
    return currentConversationId;
}

// Initialize on page load
initializeConversationId();

// --- Auto-resize textarea ---
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';

    // Enable/Disable button
    if (this.value.trim().length > 0) {
        sendBtn.removeAttribute('disabled');
        sendBtn.style.backgroundColor = 'white'; // Active state color
    } else {
        sendBtn.setAttribute('disabled', 'true');
        sendBtn.style.backgroundColor = '#4f4f4f'; // Disabled state
        this.style.height = 'auto'; // Reset if empty
    }
});

// --- Handle send ---
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Ensure we have a conversation ID
    if (!currentConversationId) {
        generateNewConversationId();
    }

    // Remove empty state if it's the first message
    if (emptyState) {
        emptyState.style.display = 'none';
        // Add spacing if needed, or container flex adjustment
        messagesContainer.style.justifyContent = 'flex-start';
    }

    // Add User Message
    addMessage(text, 'user');

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.setAttribute('disabled', 'true');

    // Send to webhook for chat messages
    sendChatMessageToWebhook(text);
}

async function sendChatMessageToWebhook(text) {
    showTypingIndicator();

    const webhookUrl = 'https://n8n.srv849307.hstgr.cloud/webhook/e3160991-67f7-4a16-a1e3-da8d8c84537f';

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                conversation_id: currentConversationId
            })
        });

        removeTypingIndicator();

        if (response.ok) {
            const data = await response.json();
            let botResponse = "Je n'ai pas pu traiter votre demande.";
            if (typeof data === 'string') botResponse = data;
            else if (data.output) botResponse = data.output;
            else if (data.message) botResponse = data.message;
            else if (data.text) botResponse = data.text;
            else botResponse = JSON.stringify(data, null, 2);

            addMessage(botResponse, 'bot');
        } else {
            // Fallback to mock response if webhook fails
            const response = generateMockResponse(text);
            addMessage(response, 'bot');
        }
    } catch (error) {
        console.error(error);
        removeTypingIndicator();
        // Fallback to mock response
        const response = generateMockResponse(text);
        addMessage(response, 'bot');
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const innerDiv = document.createElement('div');
    innerDiv.classList.add('message-inner');

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('message-avatar');

    if (sender === 'user') {
        avatarDiv.textContent = 'BC'; // Initials
    } else {
        avatarDiv.innerHTML = '<i class="ph ph-lightning"></i>'; // Icon for bot
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Format text and handle graphs/tables
    const formattedHtml = formatText(text);
    contentDiv.innerHTML = formattedHtml;

    innerDiv.appendChild(avatarDiv);
    innerDiv.appendChild(contentDiv);
    messageDiv.appendChild(innerDiv);

    messagesContainer.appendChild(messageDiv);
    
    // Render charts after DOM insertion
    setTimeout(() => {
        renderChartsInMessage(contentDiv);
    }, 100);
    
    scrollToBottom();
}

function renderChartsInMessage(container) {
    const chartContainers = container.querySelectorAll('.chart-container');
    chartContainers.forEach(chartContainer => {
        const canvas = chartContainer.querySelector('canvas');
        if (canvas && !canvas.chart) {
            const chartId = canvas.id;
            const graphDataAttr = chartContainer.getAttribute('data-graph');
            if (graphDataAttr) {
                try {
                    const graphData = JSON.parse(graphDataAttr);
                    renderChart(chartId, graphData);
                    canvas.chart = true; // Mark as rendered
                } catch (e) {
                    console.warn('Failed to parse graph data:', e);
                }
            }
        }
    });
}

let typingIndicatorElement = null;

function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot');
    messageDiv.id = 'typing-indicator'; // ID for easy removal

    const innerDiv = document.createElement('div');
    innerDiv.classList.add('message-inner');

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('message-avatar');
    avatarDiv.innerHTML = '<i class="ph ph-lightning"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content', 'typing-indicator');
    contentDiv.innerHTML = '<span></span><span></span><span></span>';

    innerDiv.appendChild(avatarDiv);
    innerDiv.appendChild(contentDiv);
    messageDiv.appendChild(innerDiv);

    messagesContainer.appendChild(messageDiv);
    typingIndicatorElement = messageDiv;
    scrollToBottom();
}

function removeTypingIndicator() {
    if (typingIndicatorElement) {
        typingIndicatorElement.remove();
        typingIndicatorElement = null;
    }
}

function scrollToBottom() {
    const lastMessage = messagesContainer.lastElementChild;
    if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function generateMockResponse(input) {
    // Simple mock logic
    const inputLower = input.toLowerCase();
    if (inputLower.includes('bonjour') || inputLower.includes('salut')) {
        return "Bonjour ! Je suis l'assistant KPMG. Comment puis-je vous aider dans vos missions aujourd'hui ? Je peux vous aider sur l'analyse de données, la rédaction de rapports ou la recherche d'informations sectorielles.";
    }
    if (inputLower.includes('marché') || inputLower.includes('taille')) {
        return "Pour réaliser une étude de taille de marché, j'aurais besoin de quelques précisions : <br><br>1. Quel est le secteur d'activité ?<br>2. Quelle est la zone géographique concernée ?<br>3. Cherchez-vous des données en volume ou en valeur ?<br><br>Je pourrai ensuite interroger nos bases de données internes et externes.";
    }
    return "C'est noté. J'analyse votre demande... <br><br>Pourriez-vous préciser le contexte de cette requête pour que je puisse vous fournir une réponse plus ciblée ? En tant qu'assistant KPMG, je peux accéder à nos bases de connaissances internes si vous me donnez plus de détails.";
}

function formatText(text) {
    // First, extract and replace JSON graphs/tables with placeholders
    const graphPlaceholders = [];
    const tablePlaceholders = [];
    
    // Pattern to find JSON objects in the text (graph or table)
    const jsonPattern = /\{[\s\S]*?"type"\s*:\s*"(bar|pie|line|scatter|table)"[\s\S]*?\}/g;
    let match;
    let processedText = text;
    let offset = 0;
    
    // Find all JSON objects
    const jsonMatches = [];
    while ((match = jsonPattern.exec(text)) !== null) {
        try {
            const jsonObj = JSON.parse(match[0]);
            if (jsonObj.type === 'table') {
                const placeholder = `__TABLE_PLACEHOLDER_${tablePlaceholders.length}__`;
                tablePlaceholders.push({ placeholder, data: jsonObj });
                processedText = processedText.replace(match[0], placeholder);
            } else if (['bar', 'pie', 'line', 'scatter'].includes(jsonObj.type)) {
                const placeholder = `__GRAPH_PLACEHOLDER_${graphPlaceholders.length}__`;
                graphPlaceholders.push({ placeholder, data: jsonObj });
                processedText = processedText.replace(match[0], placeholder);
            }
        } catch (e) {
            // Invalid JSON, skip
            console.warn('Invalid JSON found:', match[0]);
        }
    }
    
    // Parse markdown
    let html = '';
    if (typeof marked !== 'undefined') {
        html = marked.parse(processedText);
    } else {
        html = processedText.replace(/\n/g, '<br>');
    }
    
    // Replace placeholders with actual graph/table components
    graphPlaceholders.forEach(({ placeholder, data }, index) => {
        const graphId = `chart-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        const graphHtml = createGraphElement(graphId, data);
        html = html.replace(placeholder, graphHtml);
    });
    
    tablePlaceholders.forEach(({ placeholder, data }) => {
        const tableHtml = createTableElement(data);
        html = html.replace(placeholder, tableHtml);
    });
    
    return html;
}

function createGraphElement(chartId, graphData) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.setAttribute('data-graph', JSON.stringify(graphData));
    container.innerHTML = `
        <div class="chart-wrapper">
            <canvas id="${chartId}"></canvas>
        </div>
    `;
    
    return container.outerHTML;
}

function renderChart(canvasId, graphData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { type, title, data, labels, datasets } = graphData;
    
    let chartConfig = {
        type: type === 'pie' ? 'pie' : type === 'scatter' ? 'scatter' : type === 'line' ? 'line' : 'bar',
        data: {
            labels: labels || (data && data.labels) || [],
            datasets: datasets || (data && data.datasets) || [{
                label: title || 'Données',
                data: data && data.values ? data.values : (data && Array.isArray(data) ? data : []),
                backgroundColor: getDefaultColors(type),
                borderColor: getDefaultBorderColors(type),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: !!title,
                    text: title || ''
                },
                legend: {
                    display: type === 'pie' || (datasets && datasets.length > 1)
                }
            },
            scales: type !== 'pie' && type !== 'scatter' ? {
                y: {
                    beginAtZero: true
                }
            } : {}
        }
    };
    
    // Handle scatter plot
    if (type === 'scatter' && data && data.points) {
        chartConfig.data.datasets = [{
            label: title || 'Données',
            data: data.points,
            backgroundColor: 'rgba(0, 51, 141, 0.6)',
            borderColor: 'rgba(0, 51, 141, 1)'
        }];
    }
    
    new Chart(ctx, chartConfig);
}

function createTableElement(tableData) {
    const { title, headers, rows, data } = tableData;
    
    let tableHeaders = headers || [];
    let tableRows = rows || [];
    
    // If data is provided in a different format, convert it
    if (data && Array.isArray(data)) {
        if (data.length > 0 && Array.isArray(data[0])) {
            tableHeaders = data[0];
            tableRows = data.slice(1);
        } else if (data.length > 0 && typeof data[0] === 'object') {
            tableHeaders = Object.keys(data[0]);
            tableRows = data.map(row => Object.values(row));
        }
    }
    
    let tableHtml = '<div class="table-container">';
    if (title) {
        tableHtml += `<h4 class="table-title">${title}</h4>`;
    }
    tableHtml += '<table class="data-table">';
    
    if (tableHeaders.length > 0) {
        tableHtml += '<thead><tr>';
        tableHeaders.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';
    }
    
    tableHtml += '<tbody>';
    tableRows.forEach(row => {
        tableHtml += '<tr>';
        (Array.isArray(row) ? row : Object.values(row)).forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    
    return tableHtml;
}

function getDefaultColors(type) {
    const colors = {
        bar: ['rgba(0, 51, 141, 0.8)', 'rgba(0, 145, 218, 0.8)', 'rgba(0, 102, 204, 0.8)'],
        pie: ['rgba(0, 51, 141, 0.8)', 'rgba(0, 145, 218, 0.8)', 'rgba(0, 102, 204, 0.8)', 'rgba(0, 77, 163, 0.8)', 'rgba(0, 128, 191, 0.8)'],
        line: 'rgba(0, 51, 141, 0.8)',
        scatter: 'rgba(0, 51, 141, 0.6)'
    };
    return colors[type] || colors.bar;
}

function getDefaultBorderColors(type) {
    const colors = {
        bar: ['rgba(0, 51, 141, 1)', 'rgba(0, 145, 218, 1)', 'rgba(0, 102, 204, 1)'],
        pie: ['rgba(0, 51, 141, 1)', 'rgba(0, 145, 218, 1)', 'rgba(0, 102, 204, 1)', 'rgba(0, 77, 163, 1)', 'rgba(0, 128, 191, 1)'],
        line: 'rgba(0, 51, 141, 1)',
        scatter: 'rgba(0, 51, 141, 1)'
    };
    return colors[type] || colors.bar;
}

/* --- Model Selection (New Toggle) --- */
/* --- Mode Management --- */
const marketModeToggle = document.getElementById('market-mode-toggle');
const callSummaryToggle = document.getElementById('call-summary-toggle');

const marketFormContainer = document.getElementById('market-form-container');
const dictaphoneContainer = document.getElementById('dictaphone-container');
const emptyStateId = document.getElementById('empty-state');

// Mode Switcher Helper
function setActiveMode(modeName) {
    // 1. Reset UI to Default first (clean slate)
    if (emptyStateId) emptyStateId.style.display = 'flex';
    if (messagesContainer) messagesContainer.innerHTML = '';
    if (messagesContainer) messagesContainer.appendChild(emptyStateId);

    if (marketFormContainer) marketFormContainer.classList.add('hidden');
    if (dictaphoneContainer) dictaphoneContainer.classList.add('hidden');

    if (marketModeToggle) marketModeToggle.classList.remove('active');
    if (callSummaryToggle) callSummaryToggle.classList.remove('active');

    chatInput.removeAttribute('disabled');
    chatInput.placeholder = "Envoyer un message au KPMG Assistant...";

    // 2. Activate Specific Mode
    if (modeName === 'market') {
        if (marketModeToggle) marketModeToggle.classList.add('active');
        if (emptyStateId) emptyStateId.style.display = 'none';
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (marketFormContainer) {
            marketFormContainer.classList.remove('hidden');
            messagesContainer.appendChild(marketFormContainer);
        }
        chatInput.setAttribute('disabled', 'true');
        chatInput.placeholder = "Remplissez le formulaire de cadrage...";
    }
    else if (modeName === 'call-summary') {
        if (callSummaryToggle) callSummaryToggle.classList.add('active');
        if (emptyStateId) emptyStateId.style.display = 'none';
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (dictaphoneContainer) {
            dictaphoneContainer.classList.remove('hidden');
            messagesContainer.appendChild(dictaphoneContainer);
        }
        chatInput.setAttribute('disabled', 'true');
        chatInput.placeholder = "Enregistrement en cours...";
    }
}

// Event Listeners
if (marketModeToggle) {
    marketModeToggle.addEventListener('click', () => {
        const isActive = marketModeToggle.classList.contains('active');
        if (isActive) setActiveMode('default');
        else setActiveMode('market');
    });
}

if (callSummaryToggle) {
    callSummaryToggle.addEventListener('click', () => {
        const isActive = callSummaryToggle.classList.contains('active');
        if (isActive) setActiveMode('default');
        else setActiveMode('call-summary');
    });
}


/* --- Dictaphone Logic --- */
const recordBtn = document.getElementById('record-btn');
const recordingTimer = document.getElementById('recording-timer');
const dictaphoneCard = document.querySelector('.dictaphone-card');
const statusBadge = document.querySelector('.status-badge');

let animationInterval = null;
let startTime = null;
let isRecording = false;

function toggleRecording() {
    isRecording = !isRecording;

    if (isRecording) {
        // Start Recording
        dictaphoneCard.classList.add('recording');
        statusBadge.classList.add('recording');
        statusBadge.textContent = "Enregistrement...";
        startTime = Date.now();

        animationInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const seconds = Math.floor((elapsed / 1000) % 60);
            const minutes = Math.floor((elapsed / 1000 / 60));
            recordingTimer.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 100);

    } else {
        // Stop Recording
        dictaphoneCard.classList.remove('recording');
        statusBadge.classList.remove('recording');
        statusBadge.textContent = "Traitement...";
        clearInterval(animationInterval);

        // Simulate Processing
        setTimeout(() => {
            statusBadge.textContent = "Prêt à enregistrer";
            recordingTimer.textContent = "00:00";

            // Generate summary
            setActiveMode('default');
            addMessage("**Résumé de l'appel** (Généré automatiquement)<br><br>• **Sujet** : Point d'avancement mission Alpha.<br>• **Participants** : Client, Équipe KPMG.<br>• **Décisions** : Validation du livrable 1, lancement de la phase 2.<br>• **Actions** : Envoyer le planning mis à jour avant vendredi.", 'bot');
        }, 1500);
    }
}

if (recordBtn) {
    recordBtn.addEventListener('click', toggleRecording);
}


/* --- Enhanced PPTX Export Logic --- */
const exportPptxBtn = document.querySelector('#export-pptx-btn');

if (exportPptxBtn) {
    exportPptxBtn.addEventListener('click', () => {
        if (typeof PptxGenJS === 'undefined') {
            alert("La librairie PPTX n'est pas chargée.");
            return;
        }

        const pres = new PptxGenJS();

        // 1. Define Slide Master (Layout)
        pres.layout = 'LAYOUT_WIDE';

        pres.defineSlideMaster({
            title: 'KPMG_MASTER',
            background: { color: 'FFFFFF' },
            objects: [
                // Header Bar
                { rect: { x: 0, y: 0, w: '100%', h: 0.6, fill: '00338D' } },
                { text: { text: "KPMG Advisory", options: { x: 0.3, y: 0.1, fontSize: 18, color: 'FFFFFF', bold: true } } },
                // Footer
                { text: { text: "Document confidentiel - Généré par KPMG Assistant", options: { x: 0.5, y: 7.2, w: '90%', fontSize: 10, color: '888888' } } },
                { line: { x: 0.5, y: 7.1, w: '92%', line: '00338D', lineSize: 1 } }
            ]
        });

        // 2. Title Slide
        let slide = pres.addSlide({ masterName: 'KPMG_MASTER' });
        slide.addText("Compte Rendu de Conversation", {
            x: 1, y: 3, w: '80%', fontSize: 36, color: '00338D', bold: true, align: 'center'
        });
        slide.addText(`Date: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`, {
            x: 1, y: 4, w: '80%', fontSize: 16, color: '666666', align: 'center'
        });

        // 3. Content Slides
        const messages = document.querySelectorAll('.message');

        messages.forEach((msg, index) => {
            const isUser = msg.classList.contains('user');
            // Extract text carefully
            let contentText = msg.querySelector('.message-content').innerText;
            // Clean up multiple newlines
            contentText = contentText.replace(/\n\s*\n/g, '\n').trim();

            if (!contentText) return; // Skip empty

            let msgSlide = pres.addSlide({ masterName: 'KPMG_MASTER' });

            // Slide Title (Who is speaking)
            const titleText = isUser ? "Votre Demande" : "Réponse KPMG Assistant";
            const titleColor = isUser ? "000000" : "0091DA";

            msgSlide.addText(titleText, {
                x: 0.5, y: 1.0, fontSize: 20, color: titleColor, bold: true
            });

            // visual box for content
            const boxFill = isUser ? "F5F5F5" : "EBF5FA"; // Grey for user, Light blue for bot

            // Add shape background
            msgSlide.addShape(pres.ShapeType.rect, {
                x: 0.5, y: 1.5, w: 12.3, h: 5.2,
                fill: boxFill, line: 'CCCCCC', lineSize: 0
            });

            // Add text inside
            msgSlide.addText(contentText, {
                x: 0.6, y: 1.6, w: 12.0, h: 5.0,
                fontSize: 14, color: '333333',
                valign: 'top', align: 'left',
                wrap: true /* auto-wrap */
            });
        });

        pres.writeFile({ fileName: `KPMG_Report_${Date.now()}.pptx` });
    });
}


/* --- Webhook Logic --- */
const marketForm = document.getElementById('market-form'); // Ensure marketForm is selected here as well

if (marketForm) {
    marketForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Get Data
        const website = document.getElementById('mf-website').value;
        const market = document.getElementById('mf-market').value;
        const geo = document.getElementById('mf-geo').value;
        const mission = document.getElementById('mf-mission').value;

        // 2. Hide Form & Show Loading State
        marketFormContainer.classList.add('hidden');

        // Show user message summary
        const summaryText = `**Nouvelle Analyse lancée**<br>Client: ${website}<br>Marché: ${market}<br>Zone: ${geo}<br>Mission: ${mission}`;
        addMessage(summaryText, 'user');

        // Show typing indicator
        showTypingIndicator();

        // 3. Send to Webhook
        const webhookUrl = 'https://n8n.srv849307.hstgr.cloud/webhook/e3160991-67f7-4a16-a1e3-da8d8c84537f';

        // Ensure we have a conversation ID
        if (!currentConversationId) {
            generateNewConversationId();
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_website: website,
                    market_name: market,
                    geography: geo,
                    mission_type: mission,
                    conversation_id: currentConversationId
                })
            });

            removeTypingIndicator();

            if (response.ok) {
                const data = await response.json();
                let botResponse = "Analyse terminée.";
                if (typeof data === 'string') botResponse = data;
                else if (data.output) botResponse = data.output;
                else if (data.message) botResponse = data.message;
                else if (data.text) botResponse = data.text;
                else botResponse = JSON.stringify(data, null, 2);

                addMessage(botResponse, 'bot');
            } else {
                addMessage("Erreur lors de la communication avec le serveur d'analyse.", 'bot');
            }

        } catch (error) {
            console.error(error);
            removeTypingIndicator();
            addMessage("Une erreur est survenue lors de l'envoi des données.", 'bot');
        }

        // Re-enable input for follow-up questions
        chatInput.removeAttribute('disabled');
        chatInput.placeholder = "Posez des questions sur l'analyse...";
        chatInput.focus();
    });
}

/* --- Persistent Sidebar Logic --- */

const historyList = document.querySelector('#history-list');
const newFolderBtn = document.querySelector('#new-folder-button');
const newChatBtn = document.querySelector('#new-chat-button');

const STORAGE_KEY = 'kpmg_sidebar_data';

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
});

function loadSidebar() {
    if (!historyList) return;

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        // Seed initial data from DOM if storage is empty
        seedSidebarFromDOM();
        return;
    }

    try {
        const items = JSON.parse(data);
        renderSidebar(items);
    } catch (e) {
        console.error("Failed to load sidebar", e);
        seedSidebarFromDOM(); // Fallback
    }
}

function seedSidebarFromDOM() {
    // Save the initial static state to localStorage properly
    saveSidebar();
}

function saveSidebar() {
    if (!historyList) return;

    const items = [];

    // Helper to get text safely
    const getText = (el, selector) => {
        const sub = selector ? el.querySelector(selector) : el;
        return sub ? sub.textContent.trim() : '';
    };

    Array.from(historyList.children).forEach(child => {
        // Handle standalone items (chats at root)
        if (child.classList.contains('history-item')) {
            items.push({
                type: 'chat',
                id: child.dataset.id || `chat-${Date.now()}-${Math.random()}`,
                title: getText(child, 'span')
            });
        }
        // Handle Folders
        else if (child.classList.contains('folder')) {
            const title = getText(child, '.folder-title span');
            const expanded = child.classList.contains('expanded');
            const subItems = [];
            const folderContent = child.querySelector('.folder-content');

            if (folderContent) {
                Array.from(folderContent.children).forEach(sub => {
                    // Only save actual chats, skip "Vide" placeholder unless we want to track it
                    if (sub.classList.contains('history-item')) {
                        const subTitle = getText(sub, 'span');
                        if (subTitle === '(Vide)') return; // Skip placeholder

                        subItems.push({
                            type: 'chat',
                            id: sub.dataset.id || `sub-${Date.now()}-${Math.random()}`,
                            title: subTitle
                        });
                    }
                });
            }
            items.push({ type: 'folder', title, expanded, items: subItems });
        }
        // Handle Groups (e.g. 'Aujourd'hui') - preserve as a type='group' or just parse children
        else if (child.classList.contains('history-group')) {
            // Flatten groups for now, or create group object?
            // To simplify, let's treat children of group as root items
            // Or better, let's ignore groups logic for the "New Folder" feature requesting User.
            // But if we ignore them, they disappear on render.
            // Let's scrape them as 'chats' for now.
            Array.from(child.children).forEach(grpChild => {
                if (grpChild.classList.contains('history-item')) {
                    items.push({
                        type: 'chat',
                        id: grpChild.dataset.id || `grp-${Date.now()}-${Math.random()}`,
                        title: getText(grpChild, 'span')
                    });
                }
            });
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderSidebar(items) {
    if (!historyList) return;
    historyList.innerHTML = '';

    items.forEach(item => {
        if (item.type === 'folder') {
            const folderDiv = document.createElement('div');
            folderDiv.className = `folder ${item.expanded ? 'expanded' : ''}`;

            let contentHtml = '';
            if (item.items && item.items.length > 0) {
                item.items.forEach(sub => {
                    contentHtml += `
                        <div class="history-item" data-id="${sub.id}">
                            <i class="ph ph-chat-circle"></i>
                            <span>${sub.title}</span>
                        </div>
                    `;
                });
            } else {
                contentHtml = `
                    <div class="history-item" style="opacity: 0.5; cursor: default;">
                        <i class="ph ph-info"></i>
                        <span>(Vide)</span>
                    </div>`;
            }

            folderDiv.innerHTML = `
                <div class="folder-header">
                    <div class="folder-title">
                        <i class="ph ph-folder"></i>
                        <span>${item.title}</span>
                    </div>
                    <div class="folder-actions">
                        <i class="ph ph-plus folder-add-page" title="Ajouter une page"></i>
                        <i class="ph ph-caret-down folder-caret"></i>
                    </div>
                </div>
                <div class="folder-content">
                    ${contentHtml}
                </div>
            `;
            historyList.appendChild(folderDiv);

        } else if (item.type === 'chat') {
            const chatDiv = document.createElement('div');
            chatDiv.className = 'history-item';
            chatDiv.dataset.id = item.id;
            chatDiv.innerHTML = `
                <i class="ph ph-chat-circle"></i>
                <span>${item.title}</span>
            `;
            historyList.appendChild(chatDiv);
        }
    });
}


// Event Delegation
if (historyList) {
    historyList.addEventListener('click', (e) => {
        // 1. Add Page (via + icon)
        const addPageBtn = e.target.closest('.folder-add-page');
        if (addPageBtn) {
            e.stopPropagation();
            const folderHeader = addPageBtn.closest('.folder-header');
            const folder = folderHeader.parentElement;

            const pageName = prompt("Nom de la nouvelle page :", "Nouvelle conversation");
            if (!pageName) return; // Cancelled

            const folderContent = folder.querySelector('.folder-content');

            // Remove 'empty' placeholder
            const emptyItem = folderContent.querySelector('.history-item span');
            if (emptyItem && emptyItem.textContent === '(Vide)') {
                folderContent.innerHTML = '';
            }

            const newItem = document.createElement('div');
            newItem.className = 'history-item active'; // Auto-active
            newItem.dataset.id = Date.now();
            newItem.innerHTML = `
                <i class="ph ph-chat-circle"></i>
                <span>${pageName}</span>
            `;

            folderContent.prepend(newItem);
            folder.classList.add('expanded');

            // Visual Update Active State
            const allItems = document.querySelectorAll('.history-item');
            allItems.forEach(item => item.classList.remove('active'));
            newItem.classList.add('active'); // Re-add just in case

            // Clear view
            loadNewChatContext();

            saveSidebar();
            return;
        }

        // 2. Folder Toggle (via Header)
        const folderHeader = e.target.closest('.folder-header');
        if (folderHeader) {
            const folder = folderHeader.parentElement;
            folder.classList.toggle('expanded');
            saveSidebar();
            return;
        }

        // 3. Select Chat
        const historyItem = e.target.closest('.history-item');
        if (historyItem) {
            if (historyItem.style.cursor === 'default') return; // Ignore placeholder

            document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
            historyItem.classList.add('active');

            const title = historyItem.querySelector('span').textContent;
            console.log(`Switched to chat: ${title}`);

            // Simulate loading chat
            messagesContainer.innerHTML = '';
            addMessage(`**${title}** loaded.`, 'bot');
        }
    });
}

// New Folder Button
if (newFolderBtn) {
    newFolderBtn.addEventListener('click', () => {
        const folderName = prompt("Nom du nouveau dossier :", "Nouveau dossier");
        if (folderName === null) return;
        const validName = folderName.trim() || "Nouveau dossier";

        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder expanded';
        folderDiv.innerHTML = `
            <div class="folder-header">
                <div class="folder-title">
                    <i class="ph ph-folder"></i>
                    <span>${validName}</span>
                </div>
                <div class="folder-actions">
                    <i class="ph ph-plus folder-add-page" title="Ajouter une page"></i>
                    <i class="ph ph-caret-down folder-caret"></i>
                </div>
            </div>
            <div class="folder-content">
                 <div class="history-item" style="opacity: 0.5; cursor: default;">
                    <i class="ph ph-info"></i>
                    <span>(Vide)</span>
                </div>
            </div>
        `;

        // Prepend to top
        historyList.prepend(folderDiv);
        saveSidebar();
    });
}

// New Chat Button
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
        loadNewChatContext();
    });
}

function loadNewChatContext() {
    // Generate new conversation ID for new chat
    generateNewConversationId();
    messagesContainer.innerHTML = '';
    if (emptyState) {
        emptyState.style.display = 'flex';
        messagesContainer.appendChild(emptyState);
    }
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.setAttribute('disabled', 'true');
}
