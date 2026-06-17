// Application State
let releaseNotes = [];
let filteredNotes = [];
let selectedUpdate = null; // Stores { date, link, update }

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('retry-btn');
const searchInput = document.getElementById('search-input');
const typeFilters = document.getElementById('type-filters');
const contentArea = document.getElementById('content-area');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const syncIcon = document.querySelector('.icon-sync');

// Tweet Composer Elements
const tweetDock = document.getElementById('tweet-dock');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const sendTweetBtn = document.getElementById('send-tweet-btn');
const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
const closeDockBtn = document.getElementById('close-dock-btn');

// Fetch Feed on Load
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Events
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search Filter
    searchInput.addEventListener('input', applyFilters);
    
    // Category Tabs Filter
    typeFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tab')) {
            // Remove active from all
            document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
            // Add active to current
            e.target.classList.add('active');
            applyFilters();
        }
    });

    // Close Dock
    closeDockBtn.addEventListener('click', deselectUpdate);
    cancelSelectionBtn.addEventListener('click', deselectUpdate);

    // Character Counter
    tweetTextarea.addEventListener('input', updateCharCount);

    // Send Tweet
    sendTweetBtn.addEventListener('click', postTweet);
}

// Fetch Notes from API
async function fetchReleaseNotes() {
    // Show Loading
    showState('loading');
    syncIcon.classList.add('spinning');
    deselectUpdate();

    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();

        if (data.success) {
            releaseNotes = data.entries;
            applyFilters();
            showState('content');
        } else {
            throw new Error(data.error || 'Failed to fetch release notes from API');
        }
    } catch (err) {
        console.error(err);
        errorMessage.textContent = err.message;
        showState('error');
    } finally {
        syncIcon.classList.remove('spinning');
    }
}

// UI State Management
function showState(state) {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    contentArea.classList.add('hidden');

    if (state === 'loading') {
        loadingState.classList.remove('hidden');
    } else if (state === 'error') {
        errorState.classList.remove('hidden');
    } else if (state === 'content') {
        contentArea.classList.remove('hidden');
    }
}

// Apply Search & Category Filters
function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const activeTab = document.querySelector('.filter-tab.active');
    const selectedType = activeTab ? activeTab.getAttribute('data-type') : 'all';

    // Filter each date's updates
    filteredNotes = releaseNotes.map(entry => {
        const matchingUpdates = entry.updates.filter(update => {
            // Check Type filter
            const matchesType = (selectedType === 'all') || (update.type.toLowerCase() === selectedType.toLowerCase());
            
            // Check text search filter
            const matchesText = !query || 
                update.type.toLowerCase().includes(query) || 
                update.content_text.toLowerCase().includes(query) ||
                entry.date.toLowerCase().includes(query);
                
            return matchesType && matchesText;
        });

        return {
            ...entry,
            updates: matchingUpdates
        };
    }).filter(entry => entry.updates.length > 0); // Keep only entries that have updates matching filter

    renderFeed();
}

// Render Release Notes Grid
function renderFeed() {
    contentArea.innerHTML = '';

    if (filteredNotes.length === 0) {
        contentArea.innerHTML = `
            <div class="empty-state">
                <svg class="icon" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-muted);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3>No updates found</h3>
                <p>Try refining your search terms or choosing a different filter category.</p>
            </div>
        `;
        return;
    }

    filteredNotes.forEach(entry => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';

        // Header for Date Grouping
        const header = document.createElement('div');
        header.className = 'date-header';
        header.innerHTML = `
            <span class="date-title">${entry.date}</span>
            <div class="date-line"></div>
        `;
        dateGroup.appendChild(header);

        // Entries list
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'date-entries';

        entry.updates.forEach(update => {
            const card = document.createElement('div');
            card.className = `entry-card ${selectedUpdate && selectedUpdate.update.id === update.id ? 'selected' : ''}`;
            card.dataset.updateId = update.id;
            
            // Generate content
            const badgeClass = getBadgeClass(update.type);
            
            card.innerHTML = `
                <div>
                    <div class="entry-card-header">
                        <span class="badge ${badgeClass}">${update.type}</span>
                        <div class="card-select-indicator"></div>
                    </div>
                    <div class="entry-card-body">
                        ${update.content_html}
                    </div>
                </div>
                <div class="entry-card-footer">
                    <a class="ref-link" href="${entry.link}" target="_blank">
                        <span>Original Feed Link</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                    <span>ID: ${update.id}</span>
                </div>
            `;

            // Click action to select
            card.addEventListener('click', (e) => {
                // Ignore if clicked on links
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                selectUpdate(entry, update);
            });

            entriesContainer.appendChild(card);
        });

        dateGroup.appendChild(entriesContainer);
        contentArea.appendChild(dateGroup);
    });
}

// Map tag categories to UI badges
function getBadgeClass(type) {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('feature')) return 'badge-feature';
    if (typeLower.includes('issue')) return 'badge-issue';
    if (typeLower.includes('change')) return 'badge-change';
    if (typeLower.includes('announcement')) return 'badge-announcement';
    if (typeLower.includes('deprecation')) return 'badge-deprecation';
    return 'badge-general';
}

// Select an update to compose tweet
function selectUpdate(entry, update) {
    // If clicking already selected, deselect
    if (selectedUpdate && selectedUpdate.update.id === update.id) {
        deselectUpdate();
        return;
    }

    selectedUpdate = { entry, update };

    // Highlight selected card visually
    document.querySelectorAll('.entry-card').forEach(c => {
        c.classList.remove('selected');
        if (c.dataset.updateId === update.id) {
            c.classList.add('selected');
        }
    });

    // Format draft tweet text
    const textDraft = compileTweetDraft(entry, update);
    tweetTextarea.value = textDraft;
    
    // Update Character Counter
    updateCharCount();

    // Slide up composer
    tweetDock.classList.add('active');
}

// Clear active selection
function deselectUpdate() {
    selectedUpdate = null;
    document.querySelectorAll('.entry-card').forEach(c => c.classList.remove('selected'));
    tweetDock.classList.remove('active');
}

// Create a prefilled tweet matching X constraints (280 characters)
function compileTweetDraft(entry, update) {
    const date = entry.date;
    const type = update.type.toUpperCase();
    const link = entry.link;
    const desc = update.content_text;

    // Structure template
    // 📢 BigQuery Update (Date)
    // [TYPE] Description...
    //
    // Details: link
    const titleLine = `📢 BigQuery Update (${date})\n`;
    const tag = `[${type}] `;
    const linkSection = `\n\nDetails: ${link}`;

    // Available space for the description
    const reservedLength = titleLine.length + tag.length + linkSection.length;
    const maxDescLength = 280 - reservedLength;

    let finalDesc = desc;
    if (desc.length > maxDescLength) {
        finalDesc = desc.substring(0, maxDescLength - 3) + '...';
    }

    return `${titleLine}${tag}${finalDesc}${linkSection}`;
}

// Update remaining character count visual styling
function updateCharCount() {
    const len = tweetTextarea.value.length;
    charCount.textContent = len;

    // Visual indicators
    charCount.className = '';
    if (len > 280) {
        charCount.classList.add('error');
    } else if (len > 250) {
        charCount.classList.add('warning');
    }
}

// Open X share intent
function postTweet() {
    const tweetText = tweetTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank');
}
