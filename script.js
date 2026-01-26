const chatInput = document.querySelector('#chat-input');
const sendBtn = document.querySelector('#send-btn');
const messagesContainer = document.querySelector('#messages-container');
const emptyState = document.querySelector('.empty-state');

// Conversation ID Management
let currentConversationId = null;
const CONVERSATION_ID_KEY = 'kpmg_current_conversation_id';

// Initialize or load conversation ID
function initializeConversationId() {
    // Always generate a new conversation ID on page load
    // This ensures each session starts fresh unless explicitly loading a conversation from history
    // The old ID in localStorage is only used if we're explicitly resuming a conversation
    generateNewConversationId();
    console.log('Nouvelle conversation démarrée avec ID:', currentConversationId);
}

// Function to load a specific conversation ID (used when clicking on history)
function loadConversationId(conversationId) {
    currentConversationId = conversationId;
    localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
    updateConversationIdDisplay();
    console.log('Conversation chargée avec ID:', conversationId);
}

function generateNewConversationId() {
    currentConversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(CONVERSATION_ID_KEY, currentConversationId);
    updateConversationIdDisplay();
    return currentConversationId;
}

function updateConversationIdDisplay() {
    // Optionally display conversation ID in console for debugging
    if (currentConversationId) {
        console.log('🆔 Conversation ID actuel:', currentConversationId);
    }
}

// Initialize on page load (after DOM is ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConversationId);
} else {
    // DOM already loaded
    initializeConversationId();
}

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
    }, 200);
    
    // Also try again after a longer delay in case charts weren't ready
    setTimeout(() => {
        renderChartsInMessage(contentDiv);
    }, 500);
    
    scrollToBottom();
    return messageDiv;
}

// Version de addMessage avec ID pour la navigation du sommaire
function addMessageWithId(text, sender, htmlId) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    if (htmlId) {
        messageDiv.id = htmlId;
    }

    const innerDiv = document.createElement('div');
    innerDiv.classList.add('message-inner');

    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('message-avatar');

    if (sender === 'user') {
        avatarDiv.textContent = 'BC';
    } else {
        avatarDiv.innerHTML = '<i class="ph ph-lightning"></i>';
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    const formattedHtml = formatText(text);
    contentDiv.innerHTML = formattedHtml;

    innerDiv.appendChild(avatarDiv);
    innerDiv.appendChild(contentDiv);
    messageDiv.appendChild(innerDiv);

    messagesContainer.appendChild(messageDiv);
    
    // Render charts after DOM insertion
    setTimeout(() => {
        renderChartsInMessage(contentDiv);
    }, 200);
    
    setTimeout(() => {
        renderChartsInMessage(contentDiv);
    }, 500);
    
    // Ne pas scroll automatiquement pour les messages avec ID (rapport)
    return messageDiv;
}

// Helper pour obtenir le nom de la partie selon son numéro
function getPartieName(partieNum) {
    const parties = {
        '1': 'Le Marché',
        '2': 'Paysage Concurrentiel',
        '3': 'Conclusion & Recommandations',
        '4': 'Analyse Client'
    };
    return parties[partieNum] || `Partie ${partieNum}`;
}

function renderChartsInMessage(container) {
    const chartContainers = container.querySelectorAll('.chart-container');
    chartContainers.forEach(chartContainer => {
        const canvas = chartContainer.querySelector('canvas');
        if (canvas) {
            // Check if chart already exists
            if (canvas.chart) {
                return; // Already rendered
            }
            
            const chartId = canvas.id;
            const graphDataAttr = chartContainer.getAttribute('data-graph');
            if (graphDataAttr) {
                try {
                    const graphData = JSON.parse(graphDataAttr);
                    renderChart(chartId, graphData);
                    canvas.chart = true; // Mark as rendered
                } catch (e) {
                    console.warn('Failed to parse graph data:', e, graphDataAttr);
                    // Show error in container
                    chartContainer.innerHTML = `
                        <div style="padding: 2rem; text-align: center; color: #b4b4b4;">
                            <p>Erreur lors du rendu du graphique</p>
                            <p style="font-size: 0.85rem; margin-top: 0.5rem;">${e.message}</p>
                        </div>
                    `;
                }
            } else {
                console.warn('No graph data found for chart container', chartContainer);
            }
        } else {
            console.warn('No canvas found in chart container', chartContainer);
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
    
    let processedText = text;
    
    // Step 1: Find JSON in code blocks (```json ... ```)
    // This must be done BEFORE markdown parsing to avoid issues
    const codeBlockPattern = /```json\s*([\s\S]*?)\s*```/g;
    let codeBlockMatch;
    const codeBlockMatches = [];
    
    // Collect all matches first (to avoid index issues when replacing)
    while ((codeBlockMatch = codeBlockPattern.exec(text)) !== null) {
        codeBlockMatches.push({
            fullMatch: codeBlockMatch[0],
            jsonContent: codeBlockMatch[1].trim(),
            index: codeBlockMatch.index
        });
    }
    
    // Process matches in reverse order to maintain indices
    for (let i = codeBlockMatches.length - 1; i >= 0; i--) {
        const match = codeBlockMatches[i];
        try {
            const jsonObj = JSON.parse(match.jsonContent);
            
            if (jsonObj.type === 'table') {
                const placeholder = `__TABLE_PLACEHOLDER_${tablePlaceholders.length}__`;
                const placeholderHtml = `<div data-placeholder="${placeholder}"></div>`;
                tablePlaceholders.push({ placeholder, placeholderHtml, data: jsonObj, original: match.fullMatch });
                processedText = processedText.substring(0, match.index) + 
                               placeholderHtml + 
                               processedText.substring(match.index + match.fullMatch.length);
            } else if (['bar', 'pie', 'line', 'scatter'].includes(jsonObj.type)) {
                const placeholder = `__GRAPH_PLACEHOLDER_${graphPlaceholders.length}__`;
                const placeholderHtml = `<div data-placeholder="${placeholder}"></div>`;
                graphPlaceholders.push({ placeholder, placeholderHtml, data: jsonObj, original: match.fullMatch });
                processedText = processedText.substring(0, match.index) + 
                               placeholderHtml + 
                               processedText.substring(match.index + match.fullMatch.length);
            }
        } catch (e) {
            console.warn('Failed to parse JSON in code block:', e, match.jsonContent);
        }
    }
    
    // Step 2: Find standalone JSON objects (not in code blocks)
    const standaloneJsonPattern = /\{[\s\S]*?"type"\s*:\s*"(bar|pie|line|scatter|table)"[\s\S]*?\}/g;
    let standaloneMatch;
    const standaloneMatches = [];
    
    while ((standaloneMatch = standaloneJsonPattern.exec(processedText)) !== null) {
        // Skip if this is already a placeholder
        if (standaloneMatch[0].includes('PLACEHOLDER')) continue;
        
        standaloneMatches.push({
            fullMatch: standaloneMatch[0],
            index: standaloneMatch.index
        });
    }
    
    // Process standalone matches in reverse order
    for (let i = standaloneMatches.length - 1; i >= 0; i--) {
        const match = standaloneMatches[i];
        try {
            const jsonObj = JSON.parse(match.fullMatch);
            
            if (jsonObj.type === 'table') {
                const placeholder = `__TABLE_PLACEHOLDER_${tablePlaceholders.length}__`;
                const placeholderHtml = `<div data-placeholder="${placeholder}"></div>`;
                tablePlaceholders.push({ placeholder, placeholderHtml, data: jsonObj, original: match.fullMatch });
                processedText = processedText.substring(0, match.index) + 
                               placeholderHtml + 
                               processedText.substring(match.index + match.fullMatch.length);
            } else if (['bar', 'pie', 'line', 'scatter'].includes(jsonObj.type)) {
                const placeholder = `__GRAPH_PLACEHOLDER_${graphPlaceholders.length}__`;
                const placeholderHtml = `<div data-placeholder="${placeholder}"></div>`;
                graphPlaceholders.push({ placeholder, placeholderHtml, data: jsonObj, original: match.fullMatch });
                processedText = processedText.substring(0, match.index) + 
                               placeholderHtml + 
                               processedText.substring(match.index + match.fullMatch.length);
            }
        } catch (e) {
            console.warn('Failed to parse standalone JSON:', e);
        }
    }
    
    // Step 3: Parse markdown (this will convert markdown tables to HTML)
    let html = '';
    if (typeof marked !== 'undefined') {
        // Configure marked to handle tables properly
        marked.setOptions({
            breaks: true,
            gfm: true
        });
        html = marked.parse(processedText);
    } else {
        html = processedText.replace(/\n/g, '<br>');
    }
    
    // Step 4: Style markdown tables
    html = styleMarkdownTables(html);
    
    // Step 5: Replace placeholders with actual graph/table components
    // Use DOM manipulation to find and replace placeholder divs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    graphPlaceholders.forEach(({ placeholder, data }, index) => {
        const placeholderDiv = tempDiv.querySelector(`div[data-placeholder="${placeholder}"]`);
        if (placeholderDiv) {
            const graphId = `chart-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            const graphHtml = createGraphElement(graphId, data);
            placeholderDiv.outerHTML = graphHtml;
        } else {
            console.warn('Graph placeholder div not found:', placeholder);
        }
    });
    
    tablePlaceholders.forEach(({ placeholder, data }) => {
        const placeholderDiv = tempDiv.querySelector(`div[data-placeholder="${placeholder}"]`);
        if (placeholderDiv) {
            const tableHtml = createTableElement(data);
            placeholderDiv.outerHTML = tableHtml;
        } else {
            console.warn('Table placeholder div not found:', placeholder);
        }
    });
    
    html = tempDiv.innerHTML;
    
    // Step 6: Detect and format key metrics (chiffres clés)
    html = detectAndFormatKeyMetrics(html);
    
    // Step 7: Format source badges
    html = formatSourceBadges(html);
    
    // Step 8: Clean up any remaining JSON that might be displayed as text
    html = cleanUpRawJSON(html);
    
    return html;
}

function styleMarkdownTables(html) {
    // Create a temporary container to work with DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all tables (marked should have converted them to <table>)
    const tables = tempDiv.querySelectorAll('table');
    
    tables.forEach(table => {
        // Skip if already wrapped in a container
        if (table.closest('.table-container')) {
            return;
        }
        
        // Wrap table in our styled container
        const container = document.createElement('div');
        container.className = 'table-container';
        
        // Check if there's a title/caption before the table
        const prevSibling = table.previousElementSibling;
        let title = null;
        if (prevSibling && prevSibling.tagName === 'P') {
            const text = prevSibling.textContent.trim();
            // Check if it looks like a table title (contains keywords or is short)
            if (text.length < 150 && (
                text.includes('Tableau') || 
                text.includes('tableau') || 
                text.includes('récapitulatif') ||
                text.includes('comparatif') ||
                text.includes('synthèse') ||
                (text.length < 80 && !text.includes('.'))
            )) {
                title = text;
                prevSibling.remove();
            }
        }
        
        // Also check for strong/bold text right before table
        if (!title && prevSibling) {
            const strongElements = prevSibling.querySelectorAll('strong, b');
            if (strongElements.length > 0) {
                const strongText = Array.from(strongElements).map(el => el.textContent).join(' ');
                if (strongText.length < 100) {
                    title = strongText;
                    prevSibling.remove();
                }
            }
        }
        
        // Clone and wrap the table
        const tableClone = table.cloneNode(true);
        tableClone.className = 'data-table';
        
        // Ensure all cells have proper styling
        const allCells = tableClone.querySelectorAll('th, td');
        allCells.forEach(cell => {
            // Ensure no inline styles override our CSS
            cell.removeAttribute('style');
        });
        
        if (title) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'table-title';
            titleDiv.textContent = title;
            container.appendChild(titleDiv);
        }
        
        container.appendChild(tableClone);
        
        // Replace original table with container
        table.parentNode.replaceChild(container, table);
    });
    
    return tempDiv.innerHTML;
}

function cleanUpRawJSON(html) {
    // Remove JSON code blocks that weren't parsed (likely invalid JSON)
    // But keep valid code blocks that aren't JSON
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find code blocks
    const codeBlocks = tempDiv.querySelectorAll('pre code, code');
    codeBlocks.forEach(code => {
        const text = code.textContent.trim();
        // If it looks like a JSON graph/table definition but wasn't parsed, remove it
        if (text.includes('"type"') && (text.includes('"bar"') || text.includes('"pie"') || text.includes('"line"') || text.includes('"scatter"') || text.includes('"table"'))) {
            // Try to parse it
            try {
                const parsed = JSON.parse(text);
                // If it parses and has a graph/table type, it should have been converted
                // Remove the code block to avoid showing raw JSON
                const pre = code.closest('pre');
                if (pre) {
                    pre.remove();
                } else {
                    code.remove();
                }
            } catch (e) {
                // Invalid JSON, might be intentional code, keep it
            }
        }
    });
    
    // Also remove any remaining placeholder text that wasn't replaced
    const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.includes('GRAPH_PLACEHOLDER') || node.textContent.includes('TABLE_PLACEHOLDER')) {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        // Remove the placeholder text
        const parent = textNode.parentNode;
        if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE') {
            textNode.textContent = textNode.textContent
                .replace(/GRAPH_PLACEHOLDER_\d+/g, '')
                .replace(/TABLE_PLACEHOLDER_\d+/g, '')
                .replace(/__GRAPH_PLACEHOLDER_\d+__/g, '')
                .replace(/__TABLE_PLACEHOLDER_\d+__/g, '');
            
            // If the parent is now empty, remove it
            if (parent.textContent.trim() === '' && parent.children.length === 0) {
                parent.remove();
            }
        }
    });
    
    return tempDiv.innerHTML;
}

function detectAndFormatKeyMetrics(html) {
    // Create a temporary container to work with DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // First, look for explicit key metrics patterns in markdown lists or paragraphs
    // Pattern: "- **Valeur**: Description" or "**Valeur**: Description"
    const listItems = tempDiv.querySelectorAll('li, p');
    const keyMetrics = [];
    
    listItems.forEach(item => {
        const text = item.textContent.trim();
        const htmlContent = item.innerHTML;
        
        // Pattern 1: "**81 000** entreprises" or "**7,0 - 7,5 milliards €**"
        const boldPattern = /\*\*([^\*]+)\*\*/g;
        const boldMatches = [...htmlContent.matchAll(boldPattern)];
        
        if (boldMatches.length > 0) {
            boldMatches.forEach(match => {
                const boldText = match[1];
                // Check if it's a number/metric
                if (/[\d,.\s%-]+/.test(boldText) && boldText.length < 50) {
                    const description = text.replace(match[0], '').trim()
                        .replace(/^[-•]\s*/, '')
                        .replace(/^[:\-]\s*/, '')
                        .trim();
                    
                    if (description.length > 0 && description.length < 150) {
                        keyMetrics.push({
                            value: boldText,
                            description: description,
                            element: item
                        });
                    }
                }
            });
        }
        
        // Pattern 2: Direct number patterns in short paragraphs
        if (text.length < 200 && text.length > 20) {
            const numberPatterns = [
                /(\d+[\s,.-]?\d*[\s,.-]?\d*)\s*(milliards?|millions?)\s*(d'?euros?|€|de\s+\w+)/gi,
                /(\d+[\s,.-]?\d*[\s,.-]?\d*)\s*%\s*(des|de|du|de la|du marché|des\s+\w+)/gi,
                /(\d+[\s,.-]?\d*[\s,.-]?\d*)\s*(entreprises?|sociétés?|acteurs?|ménages?|propriétaires?)/gi,
                /(TAM|SAM|SOM)\s*[:\-]?\s*(\d+[\s,.-]?\d*[\s,.-]?\d*)\s*(milliards?|millions?)?/gi
            ];
            
            for (const pattern of numberPatterns) {
                const match = text.match(pattern);
                if (match && match.length > 0) {
                    const keyWords = ['est', 'représente', 'chiffre', 'nombre', 'taux', 'part', 'marché', 'secteur'];
                    const hasKeyWord = keyWords.some(kw => text.toLowerCase().includes(kw));
                    
                    if (hasKeyWord && !keyMetrics.find(km => km.element === item)) {
                        const fullMatch = match[0];
                        const value = fullMatch.replace(/\s*(des|de|du|de la|du marché|entreprises|sociétés|acteurs|ménages|propriétaires)/gi, '').trim();
                        const description = text.replace(fullMatch, '').trim()
                            .replace(/^[-•]\s*/, '')
                            .replace(/^[:\-]\s*/, '')
                            .trim();
                        
                        if (value && description.length > 5) {
                            keyMetrics.push({
                                value: value,
                                description: description,
                                element: item
                            });
                        }
                    }
                }
            }
        }
    });
    
    // Group consecutive key metrics to create a grid
    const metricGroups = [];
    let currentGroup = [];
    
    keyMetrics.forEach((metric, index) => {
        if (currentGroup.length === 0) {
            currentGroup.push(metric);
        } else {
            const prevElement = currentGroup[currentGroup.length - 1].element;
            const currentElement = metric.element;
            
            // Check if elements are siblings or close
            const areSiblings = prevElement.parentNode === currentElement.parentNode;
            const prevIndex = Array.from(prevElement.parentNode.children).indexOf(prevElement);
            const currentIndex = Array.from(currentElement.parentNode.children).indexOf(currentElement);
            const areClose = Math.abs(currentIndex - prevIndex) <= 2;
            
            if (areSiblings && areClose && currentGroup.length < 6) {
                currentGroup.push(metric);
            } else {
                if (currentGroup.length > 0) {
                    metricGroups.push([...currentGroup]);
                }
                currentGroup = [metric];
            }
        }
    });
    
    if (currentGroup.length > 0) {
        metricGroups.push(currentGroup);
    }
    
    // Replace grouped metrics with grid layout
    metricGroups.forEach(group => {
        if (group.length >= 2) {
            // Create grid container
            const gridContainer = document.createElement('div');
            gridContainer.className = 'key-metrics-container';
            
            group.forEach(metric => {
                const card = document.createElement('div');
                card.className = 'key-metric-card';
                card.innerHTML = `
                    <div class="key-metric-content">
                        <div class="key-metric-value">${metric.value}</div>
                        <div class="key-metric-description">${metric.description}</div>
                    </div>
                `;
                gridContainer.appendChild(card);
                
                // Remove original element
                metric.element.remove();
            });
            
            // Insert grid before the first element's parent or after the last element's parent
            const firstParent = group[0].element.parentNode;
            if (firstParent) {
                firstParent.insertBefore(gridContainer, group[0].element.nextSibling || null);
            }
        } else if (group.length === 1) {
            // Single metric - use vertical bar style
            const metric = group[0];
            const keyMetricHtml = createKeyMetricCard(metric.value, metric.description);
            const newElement = document.createElement('div');
            newElement.innerHTML = keyMetricHtml;
            metric.element.parentNode.replaceChild(newElement.firstChild, metric.element);
        }
    });
    
    return tempDiv.innerHTML;
}

function createKeyMetricCard(value, description) {
    // Clean up the value and description
    const cleanValue = value.replace(/[^\d,.\s%-]/g, '').trim();
    const cleanDescription = description
        .replace(/^(C'est|C’est|Il s'agit|Il s’agit|Le|La|Les)\s+/i, '')
        .replace(/^[^\w]*/, '')
        .trim();
    
    return `
        <div class="key-metric-vertical">
            <div class="key-metric-bar"></div>
            <div class="key-metric-content">
                <div class="key-metric-value">${cleanValue}</div>
                <div class="key-metric-description">${cleanDescription}</div>
            </div>
        </div>
    `;
}

function formatSourceBadges(html) {
    // Format source indicators [🟢 INTERNE], [🔵 WEB], etc.
    html = html.replace(/\[🟢\s*INTERNE\]/gi, '<span class="source-badge internal">🟢 Source Interne</span>');
    html = html.replace(/\[🔵\s*WEB\]/gi, '<span class="source-badge web">🔵 Source Web</span>');
    html = html.replace(/\[🟡\s*ESTIMATION\]/gi, '<span class="source-badge estimation">🟡 Estimation</span>');
    html = html.replace(/\[🟢\s*INTERNE_KPMG\]/gi, '<span class="source-badge internal">🟢 Source Interne KPMG</span>');
    
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
    if (!canvas) {
        console.warn(`Canvas ${canvasId} not found`);
        return;
    }
    
    console.log('📊 Rendering chart:', canvasId, graphData);
    
    const ctx = canvas.getContext('2d');
    const { type, title, data, labels, datasets } = graphData;
    
    // Determine chart type
    let chartType = 'bar';
    if (type === 'pie') chartType = 'pie';
    else if (type === 'scatter') chartType = 'scatter';
    else if (type === 'line') chartType = 'line';
    else if (type === 'doughnut') chartType = 'doughnut';
    
    // Extract labels - essayer plusieurs formats
    let chartLabels = labels;
    if (!chartLabels && data && data.labels) chartLabels = data.labels;
    if (!chartLabels && graphData.labels) chartLabels = graphData.labels;
    if (!chartLabels && Array.isArray(data) && data.length > 0) {
        // Si data est un array d'objets avec name/label
        if (typeof data[0] === 'object' && (data[0].name || data[0].label)) {
            chartLabels = data.map(d => d.name || d.label || 'Item');
        } else {
            chartLabels = data.map((_, i) => `Item ${i + 1}`);
        }
    }
    if (!chartLabels) chartLabels = [];
    
    // Extract datasets - essayer plusieurs formats
    let chartDatasets = datasets;
    if (!chartDatasets) {
        let chartData = [];
        
        // Format: { data: { values: [...] } }
        if (data && data.values && Array.isArray(data.values)) {
            chartData = data.values;
        } 
        // Format: { data: [...] }
        else if (data && Array.isArray(data)) {
            // Si c'est un array d'objets avec value
            if (data.length > 0 && typeof data[0] === 'object' && data[0].value !== undefined) {
                chartData = data.map(d => d.value);
            } else {
                chartData = data;
            }
        } 
        // Format: { data: { data: [...] } }
        else if (data && data.data && Array.isArray(data.data)) {
            chartData = data.data;
        }
        // Format: valeurs directes dans graphData.values
        else if (graphData.values && Array.isArray(graphData.values)) {
            chartData = graphData.values;
        }
        
        // Générer assez de couleurs pour tous les éléments (surtout pour pie)
        const numColors = Math.max(chartData.length, chartLabels.length, 10);
        const bgColors = generateColors(numColors, type);
        const borderColors = generateBorderColors(numColors, type);
        
        chartDatasets = [{
            label: title || 'Données',
            data: chartData,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: type === 'pie' ? 1 : 2
        }];
    }
    
    console.log('📊 Chart config:', { chartType, chartLabels, chartDatasets });
    
    // Handle scatter plot
    if (type === 'scatter' && data && data.points) {
        chartDatasets = [{
            label: title || 'Données',
            data: data.points,
            backgroundColor: 'rgba(0, 51, 141, 0.6)',
            borderColor: 'rgba(0, 51, 141, 1)',
            pointRadius: 5
        }];
    } else if (type === 'scatter' && data && Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0].x !== undefined) {
        // Handle scatter with {x, y} format
        chartDatasets = [{
            label: title || 'Données',
            data: data,
            backgroundColor: 'rgba(0, 51, 141, 0.6)',
            borderColor: 'rgba(0, 51, 141, 1)',
            pointRadius: 5
        }];
    }
    
    let chartConfig = {
        type: chartType,
        data: {
            labels: chartLabels,
            datasets: chartDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: !!title,
                    text: title || '',
                    color: '#ececec',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                legend: {
                    display: type === 'pie' || (chartDatasets && chartDatasets.length > 1),
                    labels: {
                        color: '#ececec',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    },
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ececec',
                    bodyColor: '#ececec',
                    borderColor: 'rgba(0, 51, 141, 0.5)',
                    borderWidth: 1
                }
            },
            scales: type !== 'pie' && type !== 'scatter' ? {
                x: {
                    ticks: {
                        color: '#b4b4b4'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b4b4b4'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            } : {}
        }
    };
    
    try {
        new Chart(ctx, chartConfig);
    } catch (error) {
        console.error('Error rendering chart:', error, graphData);
        // Show error message in the chart container
        const container = canvas.closest('.chart-container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #b4b4b4;">
                    <p>Erreur lors du rendu du graphique</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Type: ${type || 'inconnu'}</p>
                </div>
            `;
        }
    }
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
    
    // Ensure we have valid data
    if (tableHeaders.length === 0 && tableRows.length === 0) {
        return '<div class="table-container"><p style="color: #b4b4b4; padding: 1rem;">Tableau sans données</p></div>';
    }
    
    let tableHtml = '<div class="table-container">';
    if (title) {
        tableHtml += `<div class="table-title">${title}</div>`;
    }
    tableHtml += '<table class="data-table">';
    
    if (tableHeaders.length > 0) {
        tableHtml += '<thead><tr>';
        tableHeaders.forEach(header => {
            const headerText = String(header || '').trim();
            tableHtml += `<th>${headerText || 'Colonne'}</th>`;
        });
        tableHtml += '</tr></thead>';
    }
    
    tableHtml += '<tbody>';
    if (tableRows.length > 0) {
        tableRows.forEach((row, rowIndex) => {
            tableHtml += '<tr>';
            const rowData = Array.isArray(row) ? row : Object.values(row || {});
            
            // Ensure we have enough cells for all headers
            const cells = rowData.length > 0 ? rowData : new Array(tableHeaders.length).fill('');
            
            cells.forEach((cell, cellIndex) => {
                const cellText = String(cell || '').trim();
                tableHtml += `<td>${cellText || '-'}</td>`;
            });
            
            // Fill missing cells if row is shorter than headers
            if (cells.length < tableHeaders.length) {
                for (let i = cells.length; i < tableHeaders.length; i++) {
                    tableHtml += '<td>-</td>';
                }
            }
            
            tableHtml += '</tr>';
        });
    } else {
        // Empty table
        tableHtml += '<tr><td colspan="' + tableHeaders.length + '" style="text-align: center; color: #666; padding: 2rem;">Aucune donnée</td></tr>';
    }
    tableHtml += '</tbody></table></div>';
    
    return tableHtml;
}

// Génère un nombre arbitraire de couleurs pour les graphiques
function generateColors(count, type) {
    // Palette KPMG + couleurs complémentaires
    const baseColors = [
        'rgba(0, 51, 141, 0.8)',    // KPMG Blue
        'rgba(0, 145, 218, 0.8)',   // KPMG Light Blue
        'rgba(16, 163, 127, 0.8)',  // Green
        'rgba(255, 152, 0, 0.8)',   // Orange
        'rgba(156, 39, 176, 0.8)',  // Purple
        'rgba(233, 30, 99, 0.8)',   // Pink
        'rgba(0, 150, 136, 0.8)',   // Teal
        'rgba(255, 87, 34, 0.8)',   // Deep Orange
        'rgba(63, 81, 181, 0.8)',   // Indigo
        'rgba(139, 195, 74, 0.8)',  // Light Green
        'rgba(255, 193, 7, 0.8)',   // Amber
        'rgba(96, 125, 139, 0.8)'   // Blue Grey
    ];
    
    if (type === 'line' || type === 'scatter') {
        return baseColors[0];
    }
    
    // Étendre la palette si besoin
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

function generateBorderColors(count, type) {
    const baseBorderColors = [
        'rgba(0, 51, 141, 1)',
        'rgba(0, 145, 218, 1)',
        'rgba(16, 163, 127, 1)',
        'rgba(255, 152, 0, 1)',
        'rgba(156, 39, 176, 1)',
        'rgba(233, 30, 99, 1)',
        'rgba(0, 150, 136, 1)',
        'rgba(255, 87, 34, 1)',
        'rgba(63, 81, 181, 1)',
        'rgba(139, 195, 74, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(96, 125, 139, 1)'
    ];
    
    if (type === 'line' || type === 'scatter') {
        return baseBorderColors[0];
    }
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseBorderColors[i % baseBorderColors.length]);
    }
    return colors;
}

function getDefaultColors(type) {
    return generateColors(10, type);
}

function getDefaultBorderColors(type) {
    return generateBorderColors(10, type);
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
        const system = document.getElementById('mf-system').value; // n8n ou langchain

        // 2. Hide Form & Show Loading State
        marketFormContainer.classList.add('hidden');

        // Show user message summary
        const summaryText = `**Nouvelle Analyse lancée**<br>Client: ${website}<br>Marché: ${market}<br>Zone: ${geo}<br>Mission: ${mission}<br>Système: ${system === 'n8n' ? 'n8n' : 'LangChain'}`;
        addMessage(summaryText, 'user');

        // Ensure we have a conversation ID
        if (!currentConversationId) {
            generateNewConversationId();
        }

        // 3. Route to appropriate system
        if (system === 'langchain') {
            // Use LangChain with streaming
            await generateReportWithLangChain(website, market, geo, mission);
        } else {
            // Use n8n (existing)
            await generateReportWithN8n(website, market, geo, mission);
        }

        // Re-enable input for follow-up questions
        chatInput.removeAttribute('disabled');
        chatInput.placeholder = "Posez des questions sur l'analyse...";
        chatInput.focus();
    });
}

// LangChain API URL (adjust if needed)
const LANGCHAIN_API_URL = 'http://localhost:8000';

async function generateReportWithN8n(website, market, geo, mission) {
    showTypingIndicator();

    const webhookUrl = 'https://n8n.srv849307.hstgr.cloud/webhook/e3160991-67f7-4a16-a1e3-da8d8c84537f';

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
            }),
            timeout: 300000 // 5 minutes timeout
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
            const errorText = await response.text();
            addMessage(`Erreur lors de la communication avec le serveur d'analyse (${response.status}): ${errorText}`, 'bot');
        }

    } catch (error) {
        console.error('n8n error:', error);
        removeTypingIndicator();
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            addMessage("Erreur de connexion : Impossible de joindre le serveur n8n. Vérifiez votre connexion internet.", 'bot');
        } else {
            addMessage(`Une erreur est survenue lors de l'envoi des données: ${error.message}`, 'bot');
        }
    }
}

// ===== LangChain SSE Functions =====

let progressIndicatorElement = null;
let currentReportSections = [];

function showProgressIndicator() {
    // Remove existing progress indicator if any
    if (progressIndicatorElement) {
        progressIndicatorElement.remove();
    }
    
    // Create progress indicator HTML
    progressIndicatorElement = document.createElement('div');
    progressIndicatorElement.className = 'progress-container';
    progressIndicatorElement.innerHTML = `
        <div class="progress-header">
            <div class="progress-step">
                <span class="progress-label">En cours...</span>
                <span class="progress-percentage">0%</span>
            </div>
        </div>
        <div class="progress-bar-wrapper">
            <div class="progress-bar" style="width: 0%"></div>
        </div>
        <div class="progress-details">
            <div class="progress-time">Temps estimé: calcul en cours...</div>
        </div>
        <div class="progress-sections">
            <div class="sections-list"></div>
        </div>
    `;
    
    // Insert before messages container or at the end
    const messagesContainer = document.querySelector('#messages-container');
    if (messagesContainer) {
        messagesContainer.appendChild(progressIndicatorElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function updateProgress(percentage, step, details) {
    if (!progressIndicatorElement) return;
    
    const percentageEl = progressIndicatorElement.querySelector('.progress-percentage');
    const barEl = progressIndicatorElement.querySelector('.progress-bar');
    const labelEl = progressIndicatorElement.querySelector('.progress-label');
    
    if (percentageEl) percentageEl.textContent = `${Math.round(percentage)}%`;
    if (barEl) barEl.style.width = `${percentage}%`;
    if (labelEl && step) labelEl.textContent = step;
    
    // Update details if provided
    if (details && Object.keys(details).length > 0) {
        showStepDetails(details);
    }
}

function showStepDetails(details) {
    if (!progressIndicatorElement) return;
    
    const detailsEl = progressIndicatorElement.querySelector('.progress-details');
    if (!detailsEl) return;
    
    // Add step details below time estimate
    let detailsHTML = detailsEl.querySelector('.progress-time').outerHTML;
    
    if (details.message) {
        detailsHTML += `<div class="step-detail">${details.message}</div>`;
    }
    if (details.node) {
        detailsHTML += `<div class="step-detail"><small>Nœud: ${details.node}</small></div>`;
    }
    
    detailsEl.innerHTML = detailsHTML;
}

function updateProgressSections(completedSections, totalSections) {
    if (!progressIndicatorElement) return;
    
    const sectionsList = progressIndicatorElement.querySelector('.sections-list');
    if (!sectionsList) return;
    
    // Create section checkmarks
    const sectionNames = [
        '1. Définition & périmètre',
        '2. Sizing (TAM/SAM/SOM)',
        '3. Segmentation',
        '4. Tendances & drivers',
        '5. Chaîne de valeur',
        '6. Analyse concurrentielle',
        '7. Analyse client',
        '8. Benchmark',
        '9. Recommandations'
    ];
    
    sectionsList.innerHTML = '';
    for (let i = 0; i < Math.min(completedSections, sectionNames.length); i++) {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'progress-section';
        sectionItem.innerHTML = `
            <span class="section-check">✓</span>
            <span>${sectionNames[i]}</span>
        `;
        sectionsList.appendChild(sectionItem);
    }
}

function updateTimeEstimate(seconds) {
    if (!progressIndicatorElement) return;
    
    const timeEl = progressIndicatorElement.querySelector('.progress-time');
    if (!timeEl) return;
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
        timeEl.textContent = `Temps estimé restant: ${minutes}min ${secs}s`;
    } else {
        timeEl.textContent = `Temps estimé restant: ${secs}s`;
    }
}

function removeProgressIndicator() {
    if (progressIndicatorElement) {
        progressIndicatorElement.remove();
        progressIndicatorElement = null;
    }
}

async function connectToSSE(website, market, geo, mission) {
    showProgressIndicator();
    currentReportSections = [];
    
    const url = `${LANGCHAIN_API_URL}/api/generate-report-stream`;
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                market_name: market,
                geography: geo,
                mission_type: mission,
                client_website: website,
                conversation_id: currentConversationId,
                action: 'generate_full_report'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let timeoutId = setTimeout(() => {
            reader.cancel();
            throw new Error('Timeout: Le serveur a pris trop de temps à répondre');
        }, timeout);
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    clearTimeout(timeoutId);
                    break;
                }
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            await handleSSEEvent(data);
                        } catch (e) {
                            console.error('Error parsing SSE event:', e, line);
                        }
                    }
                }
            }
        } finally {
            clearTimeout(timeoutId);
            reader.releaseLock();
        }
        
    } catch (error) {
        console.error('SSE connection error:', error);
        removeProgressIndicator();
        
        if (error.message.includes('Timeout')) {
            addMessage('⏱️ Le traitement a pris trop de temps. Veuillez réessayer ou utiliser le système n8n.', 'bot');
        } else if (error.message.includes('fetch')) {
            addMessage('❌ Erreur de connexion : Impossible de joindre le serveur LangChain. Vérifiez que le serveur est démarré sur http://localhost:8000', 'bot');
        } else {
            addMessage(`❌ Erreur lors de la génération du rapport: ${error.message}`, 'bot');
        }
    }
}

async function handleSSEEvent(event) {
    switch (event.type) {
        case 'start':
            console.log('🚀 Démarrage de l\'analyse LangChain');
            updateProgress(0, 'Initialisation...', {});
            break;
            
        case 'progress':
            const percentage = (event.percentage || 0) * 100;
            updateProgress(percentage, event.step || 'En cours...', event.details || {});
            if (event.estimated_time_remaining !== undefined) {
                updateTimeEstimate(event.estimated_time_remaining);
            }
            if (event.section_index !== undefined && event.total_sections !== undefined) {
                updateProgressSections(event.section_index, event.total_sections);
            }
            break;
            
        case 'section_complete':
            if (event.section) {
                currentReportSections.push(event.section);
                // Log for progression tracking only
                console.log('Section complétée:', event.section);
            }
            break;
            
        case 'complete':
            removeProgressIndicator();
            console.log('✅ Analyse terminée');
            
            // Créer le sommaire et afficher les sections
            if (event.sections && event.sections.length > 0) {
                // Grouper les sections par partie principale (1.x, 2.x, 3.x)
                const partiesMap = new Map();
                event.sections.forEach((section, index) => {
                    const sectionId = section.id || section.title || `section-${index}`;
                    const partieNum = sectionId.charAt(0);
                    
                    if (!partiesMap.has(partieNum)) {
                        partiesMap.set(partieNum, {
                            num: partieNum,
                            title: getPartieName(partieNum),
                            sections: []
                        });
                    }
                    partiesMap.get(partieNum).sections.push({
                        ...section,
                        htmlId: `section-${sectionId.replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`
                    });
                });
                
                // Créer le sommaire cliquable
                let sommaire = `# 📋 Rapport d'Étude de Marché\n\n## Sommaire\n\n`;
                partiesMap.forEach((partie, num) => {
                    sommaire += `- [**Partie ${num}** - ${partie.title}](#partie-${num})\n`;
                });
                sommaire += `\n---\n`;
                
                // Ajouter le sommaire comme premier message
                const sommaireMessage = addMessageWithId(sommaire, 'bot', 'report-sommaire');
                
                // Marquer le premier message du rapport pour le scroll
                let firstReportMessage = sommaireMessage;
                
                // Afficher chaque partie avec un header
                partiesMap.forEach((partie, num) => {
                    // Header de la partie
                    const partieHeader = `<div id="partie-${num}" class="partie-header">\n\n## Partie ${num} — ${partie.title}\n\n</div>`;
                    addMessage(partieHeader, 'bot');
                    
                    // Afficher les sections de cette partie
                    partie.sections.forEach(section => {
                        let sectionContent = '';
                        if (typeof section === 'string') {
                            sectionContent = section;
                        } else if (section.content) {
                            sectionContent = section.content;
                        } else {
                            sectionContent = `## ${section.title || section.id || 'Section'}\n\n${JSON.stringify(section, null, 2)}`;
                        }
                        // Ajouter l'ID HTML pour la navigation
                        addMessageWithId(sectionContent, 'bot', section.htmlId);
                    });
                });
                
                // Scroll vers le DÉBUT du rapport (sommaire)
                if (firstReportMessage) {
                    setTimeout(() => {
                        firstReportMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
            
            // Add expert recommendations if any
            if (event.expert_recommendations && event.expert_recommendations.length > 0) {
                let recommendationsText = '## 💡 Recommandations Expert\n\n';
                event.expert_recommendations.forEach((rec, idx) => {
                    if (typeof rec === 'object') {
                        recommendationsText += `### ${rec.section_title || `Recommandation ${idx + 1}`}\n\n${rec.recommendation || JSON.stringify(rec)}\n\n`;
                    } else {
                        recommendationsText += `${idx + 1}. ${rec}\n\n`;
                    }
                });
                addMessage(recommendationsText, 'bot');
            }
            
            // Update conversation ID if provided
            if (event.conversation_id) {
                currentConversationId = event.conversation_id;
                localStorage.setItem(CONVERSATION_ID_KEY, currentConversationId);
            }
            break;
            
        case 'error':
            removeProgressIndicator();
            console.error('❌ Erreur SSE:', event.message);
            addMessage(`❌ Erreur lors de la génération: ${event.message}`, 'bot');
            break;
            
        default:
            console.log('Event non géré:', event);
    }
}

async function generateReportWithLangChain(website, market, geo, mission) {
    try {
        await connectToSSE(website, market, geo, mission);
    } catch (error) {
        console.error('Error in generateReportWithLangChain:', error);
        removeProgressIndicator();
        addMessage('❌ Une erreur est survenue. Vous pouvez essayer avec le système n8n.', 'bot');
    }
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
