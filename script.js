const chatInput = document.querySelector('#chat-input');
const sendBtn = document.querySelector('#send-btn');
const messagesContainer = document.querySelector('#messages-container');
const emptyState = document.querySelector('.empty-state');

// Auto-resize textarea
chatInput.addEventListener('input', function() {
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

// Handle send
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

    // Simulate Bot Response
    setTimeout(() => {
        showTypingIndicator();
        
        // Mock API delay
        setTimeout(() => {
            removeTypingIndicator();
            const response = generateMockResponse(text);
            addMessage(response, 'bot');
        }, 1500);
    }, 500);
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
    contentDiv.innerHTML = formatText(text);

    innerDiv.appendChild(avatarDiv);
    innerDiv.appendChild(contentDiv);
    messageDiv.appendChild(innerDiv);
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
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
    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    // Basic formatting replacement for newlines
    return text.replace(/\n/g, '<br>');
}
