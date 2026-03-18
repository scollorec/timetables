// TFL Network Status App - Modern Single Page Application
// Apple-grade design with favorite lines functionality

class TFLApp {
    constructor() {
        this.lines = [];
        this.favorites = this.getFavoriteLines();
        this.activeFilter = 'all';
        this.init();
    }

    async init() {
        this.initDarkMode();
        await this.loadLines();
        this.renderFilterBar();
        this.renderLines();
    }

    // Dark Mode Management
    initDarkMode() {
        const toggle = document.getElementById('dark-mode-toggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark.matches)) {
            document.body.classList.add('dark-mode');
            toggle.textContent = '☀️';
        }
        
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            toggle.textContent = isDark ? '☀️' : '🌙';
        });
    }

    // Load TFL Lines Data
    async loadLines() {
        try {
            const response = await fetch('https://api.tfl.gov.uk/Line/Mode/tube,dlr,elizabeth,overground,tram');
            if (!response.ok) throw new Error('Failed to fetch lines');
            this.lines = await response.json();
            this.updateFavoritesFromData();
        } catch (error) {
            console.error('Error loading lines:', error);
            this.showError();
        }
    }

    // Sync favorites with current line data
    updateFavoritesFromData() {
        const validIds = new Set(this.lines.map(l => l.id));
        this.favorites = this.favorites.filter(id => validIds.has(id));
        this.saveFavorites();
    }

    // Get line status
    getLineStatus(line) {
        if (!line.lineStatuses || line.lineStatuses.length === 0) {
            return { status: 'good', text: 'Good Service' };
        }
        
        const status = line.lineStatuses[0];
        const severity = status.statusSeverity;
        
        if (severity >= 5) {
            return { status: 'error', text: status.description || 'Severe Disruption' };
        } else if (severity >= 3) {
            return { status: 'warning', text: status.description || 'Minor Disruption' };
        }
        
        return { status: 'good', text: 'Good Service' };
    }

    // Get line color
    getLineColor(line) {
        const colors = {
            'bakerloo': '#894E35',
            'central': '#DC241F',
            'circle': '#FFD300',
            'district': '#00782A',
            'dlr': '#00AFAD',
            'elizabeth': '#6F1F89',
            'hammersmith-city': '#F3498D',
            'jubilee': '#6A6976',
            'metropolitan': '#9B0058',
            'northern': '#000000',
            'overground': '#EE7C0E',
            'piccadilly': '#003688',
            'victoria': '#0098D4',
            'waterloo-city': '#6EC5DD',
            'tram': '#8AB84E'
        };
        return colors[line.id.toLowerCase()] || '#007AFF';
    }

    // Favorites Management
    getFavoriteLines() {
        const stored = localStorage.getItem('favorite-lines');
        return stored ? JSON.parse(stored) : [];
    }

    saveFavorites() {
        localStorage.setItem('favorite-lines', JSON.stringify(this.favorites));
    }

    toggleFavorite(lineId) {
        const index = this.favorites.indexOf(lineId);
        if (index === -1) {
            this.favorites.push(lineId);
        } else {
            this.favorites.splice(index, 1);
        }
        this.saveFavorites();
        this.renderLines();
    }

    isFavorite(lineId) {
        return this.favorites.includes(lineId);
    }

    // Render Filter Bar
    renderFilterBar() {
        const filterBar = document.getElementById('filter-bar');
        const filters = [
            { id: 'all', label: 'All Lines', icon: 'fa-layer-group' },
            { id: 'tube', label: 'Tube', icon: 'fa-circle' },
            { id: 'overground', label: 'Overground', icon: 'fa-train-tram' },
            { id: 'dlr', label: 'DLR', icon: 'fa-train' },
            { id: 'elizabeth', label: 'Elizabeth', icon: 'fa-subway' },
            { id: 'tram', label: 'Tram', icon: 'fa-train-subway' }
        ];

        filterBar.innerHTML = filters.map(filter => `
            <button class="filter-chip ${this.activeFilter === filter.id ? 'active' : ''}" 
                    data-filter="${filter.id}">
                <i class="fas ${filter.icon}" style="margin-right: 6px;"></i>
                ${filter.label}
            </button>
        `).join('');

        filterBar.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.activeFilter = chip.dataset.filter;
                this.renderFilterBar();
                this.renderLines();
            });
        });
    }

    // Filter lines based on active filter
    filterLines(lines) {
        if (this.activeFilter === 'all') return lines;
        
        return lines.filter(line => {
            const lineId = line.id.toLowerCase();
            switch (this.activeFilter) {
                case 'tube':
                    return ['bakerloo', 'central', 'circle', 'district', 'hammersmith-city', 
                            'jubilee', 'metropolitan', 'northern', 'piccadilly', 'victoria', 
                            'waterloo-city'].includes(lineId);
                case 'overground':
                    return lineId === 'overground';
                case 'dlr':
                    return lineId === 'dlr';
                case 'elizabeth':
                    return lineId === 'elizabeth';
                case 'tram':
                    return lineId === 'tram';
                default:
                    return true;
            }
        });
    }

    // Render Lines Grid
    renderLines() {
        const grid = document.getElementById('lines-grid');
        const favoritesSection = document.getElementById('favorites-section');
        const favoritesGrid = document.getElementById('favorites-grid');
        
        const filteredLines = this.filterLines(this.lines);
        const favoriteLines = filteredLines.filter(line => this.isFavorite(line.id));
        
        // Render favorites section
        if (favoriteLines.length > 0) {
            favoritesSection.style.display = 'block';
            favoritesGrid.innerHTML = favoriteLines.map(line => this.createLineCard(line)).join('');
        } else {
            favoritesSection.style.display = 'none';
        }
        
        // Render all lines
        if (filteredLines.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-search"></i>
                    <p>No lines found</p>
                </div>
            `;
        } else {
            grid.innerHTML = filteredLines.map(line => this.createLineCard(line)).join('');
        }
        
        // Add event listeners
        this.attachLineCardListeners();
    }

    // Create Line Card HTML
    createLineCard(line) {
        const status = this.getLineStatus(line);
        const color = this.getLineColor(line);
        const isFav = this.isFavorite(line.id);
        
        return `
            <div class="line-card" data-line-id="${line.id}" style="--line-color: ${color}">
                <div class="status-dot ${status.status}"></div>
                <div class="line-info">
                    <div class="line-name">${line.name}</div>
                    <div class="line-status">${status.text}</div>
                </div>
                <button class="star-button ${isFav ? 'active' : ''}" 
                        data-line-id="${line.id}"
                        aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        `;
    }

    // Attach Event Listeners to Line Cards
    attachLineCardListeners() {
        // Star button listeners
        document.querySelectorAll('.star-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const lineId = button.dataset.lineId;
                this.toggleFavorite(lineId);
            });
        });
        
        // Card click listeners (for future detail view)
        document.querySelectorAll('.line-card').forEach(card => {
            card.addEventListener('click', () => {
                const lineId = card.dataset.lineId;
                const line = this.lines.find(l => l.id === lineId);
                if (line) {
                    console.log('Selected line:', line.name);
                    // Could navigate to detail view here
                }
            });
        });
    }

    // Show Error State
    showError() {
        const grid = document.getElementById('lines-grid');
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load network status. Please check your connection.</p>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tflApp = new TFLApp();
});
