/**
 * Price Range Plugin
 * Allows users to measure price ranges by dragging on the chart
 */

class PriceRangePlugin extends ChartPlugin {
  /**
   * Create a new price range plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      zoneColor: 'rgba(13, 110, 253, 0.15)',  // Background color for the range zone
      borderColor: '#0d6efd',                 // Border color for the range
      labelBgColor: '#0d6efd',                // Background color for labels
      labelTextColor: 'white',                // Text color for labels
      percentLabelBgColor: '#0d6efd',         // Background for percent label
      ...options
    });
    
    // Drag state
    this.dragState = {
      isDragging: false,
      startY: 0,
      endY: 0
    };
    
    // DOM Elements
    this.rangeZone = null;
    this.topLabel = null;
    this.bottomLabel = null;
    this.percentLabel = null;
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    super.init(chart, container);
    
    // Create the DOM elements
    this._createElements();
    
    // Set up event listeners
    this._setupEventListeners();
    
    return this;
  }
  
  /**
   * Create DOM elements for the range
   * @private
   */
  _createElements() {
    // Range zone
    this.rangeZone = document.createElement('div');
    this.rangeZone.className = 'price-range-zone';
    this.rangeZone.style.position = 'absolute';
    this.rangeZone.style.backgroundColor = this.options.zoneColor;
    this.rangeZone.style.borderTop = `1px dashed ${this.options.borderColor}`;
    this.rangeZone.style.borderBottom = `1px dashed ${this.options.borderColor}`;
    this.rangeZone.style.pointerEvents = 'none';
    this.rangeZone.style.zIndex = '2';
    this.rangeZone.style.display = 'none';
    this.container.appendChild(this.rangeZone);
    
    // Top label
    this.topLabel = document.createElement('div');
    this.topLabel.className = 'price-range-label';
    this.topLabel.style.position = 'absolute';
    this.topLabel.style.left = 'auto';
    this.topLabel.style.right = '10px';
    this.topLabel.style.transform = 'translateY(-50%)';
    this.topLabel.style.backgroundColor = this.options.labelBgColor;
    this.topLabel.style.color = this.options.labelTextColor;
    this.topLabel.style.fontSize = '12px';
    this.topLabel.style.padding = '3px 8px';
    this.topLabel.style.borderRadius = '3px';
    this.topLabel.style.zIndex = '3';
    this.topLabel.style.display = 'none';
    this.container.appendChild(this.topLabel);
    
    // Bottom label
    this.bottomLabel = document.createElement('div');
    this.bottomLabel.className = 'price-range-label';
    this.bottomLabel.style.position = 'absolute';
    this.bottomLabel.style.left = 'auto';
    this.bottomLabel.style.right = '10px';
    this.bottomLabel.style.transform = 'translateY(-50%)';
    this.bottomLabel.style.backgroundColor = this.options.labelBgColor;
    this.bottomLabel.style.color = this.options.labelTextColor;
    this.bottomLabel.style.fontSize = '12px';
    this.bottomLabel.style.padding = '3px 8px';
    this.bottomLabel.style.borderRadius = '3px';
    this.bottomLabel.style.zIndex = '3';
    this.bottomLabel.style.display = 'none';
    this.container.appendChild(this.bottomLabel);
    
    // Percent label
    this.percentLabel = document.createElement('div');
    this.percentLabel.className = 'price-range-percent';
    this.percentLabel.style.position = 'absolute';
    this.percentLabel.style.left = 'auto';
    this.percentLabel.style.right = '10px';
    this.percentLabel.style.transform = 'translateY(-50%)';
    this.percentLabel.style.backgroundColor = this.options.percentLabelBgColor;
    this.percentLabel.style.color = this.options.labelTextColor;
    this.percentLabel.style.fontSize = '11px';
    this.percentLabel.style.padding = '2px 6px';
    this.percentLabel.style.borderRadius = '3px';
    this.percentLabel.style.zIndex = '3';
    this.percentLabel.style.display = 'none';
    this.container.appendChild(this.percentLabel);
  }
  
  /**
   * Set up event listeners for mouse interaction
   * @private
   */
  _setupEventListeners() {
    // Mouse down to start dragging
    this.container.addEventListener('mousedown', this._handleMouseDown.bind(this));
    
    // Mouse move while dragging
    this.container.addEventListener('mousemove', this._handleMouseMove.bind(this));
    
    // Mouse up to end dragging
    this.container.addEventListener('mouseup', this._handleMouseUp.bind(this));
    
    // Click to clear if not dragging
    this.container.addEventListener('click', this._handleClick.bind(this));
  }
  
  /**
   * Handle mouse down event to start dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseDown(event) {
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = event.clientY - chartRect.top;
    
    // Only start dragging if within chart area
    if (this._isInChartArea(relativeY)) {
      this.dragState = {
        isDragging: true,
        startY: relativeY,
        endY: relativeY
      };
    }
  }
  
  /**
   * Handle mouse move event while dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseMove(event) {
    if (!this.dragState.isDragging) return;
    
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = Math.max(
      this.chart.dimensions.margin.top,
      Math.min(
        event.clientY - chartRect.top,
        chartRect.height - this.chart.dimensions.margin.bottom
      )
    );
    
    this.dragState.endY = relativeY;
    this._updateRangeDisplay();
  }
  
  /**
   * Handle mouse up event to end dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseUp(event) {
    if (!this.dragState.isDragging) return;
    
    const isSignificantDrag = Math.abs(this.dragState.endY - this.dragState.startY) >= 5;
    
    if (!isSignificantDrag) {
      this.clear();
    }
    
    this.dragState.isDragging = false;
  }
  
  /**
   * Handle click event to clear range display
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleClick(event) {
    // Only clear if we're not at the end of a drag operation
    if (!this.dragState.isDragging) {
      this.clear();
    }
  }
  
  /**
   * Update the range display based on current drag state
   * @private
   */
  _updateRangeDisplay() {
    const { startY, endY } = this.dragState;
    
    // Calculate top and bottom Y coordinates
    const topY = Math.min(startY, endY);
    const bottomY = Math.max(startY, endY);
    const height = bottomY - topY;
    
    // Calculate prices from Y coordinates
    const margin = this.chart.dimensions.margin;
    const topYInScale = topY - margin.top;
    const bottomYInScale = bottomY - margin.top;
    const topPrice = this.chart.y.invert(topYInScale);
    const bottomPrice = this.chart.y.invert(bottomYInScale);
    
    // Update zone position
    this.rangeZone.style.display = 'block';
    this.rangeZone.style.top = `${topY}px`;
    this.rangeZone.style.height = `${height}px`;
    this.rangeZone.style.left = `${margin.left}px`;
    this.rangeZone.style.right = `${margin.right}px`;
    
    // Update labels
    this.topLabel.style.display = 'block';
    this.topLabel.style.top = `${topY}px`;
    this.topLabel.textContent = this._formatPrice(topPrice);
    
    this.bottomLabel.style.display = 'block';
    this.bottomLabel.style.top = `${bottomY}px`;
    this.bottomLabel.textContent = this._formatPrice(bottomPrice);
    
    // Calculate percentage difference
    const priceDiff = Math.abs(topPrice - bottomPrice);
    const percentDiff = (priceDiff / bottomPrice) * 100;
    
    // Add percentage info if enough space
    if (height > 30) {
      const middleY = topY + (height / 2);
      this.percentLabel.style.display = 'block';
      this.percentLabel.style.top = `${middleY}px`;
      this.percentLabel.textContent = `${percentDiff.toFixed(2)}%`;
    } else {
      this.percentLabel.style.display = 'none';
    }
  }
  
  /**
   * Check if a Y coordinate is within the chart area
   * @param {number} y - Y coordinate relative to container
   * @returns {boolean} True if in chart area
   * @private
   */
  _isInChartArea(y) {
    const margin = this.chart.dimensions.margin;
    const chartRect = this.container.getBoundingClientRect();
    return y >= margin.top && y <= (chartRect.height - margin.bottom);
  }
  
  /**
   * Format price for display
   * @param {number} price - Price to format
   * @returns {string} Formatted price
   * @private
   */
  _formatPrice(price) {
    // Use the chart's utility if available
    if (window.ChartUtils && typeof window.ChartUtils.formatPrice === 'function') {
      return window.ChartUtils.formatPrice(price);
    }
    
    // Basic formatting fallback
    return price.toFixed(2);
  }
  
  /**
   * Render the price range
   * No-op since this plugin is event-driven
   */
  render() {
    // This plugin renders in response to user events, not data changes
  }
  
  /**
   * Clear the price range display
   */
  clear() {
    this.rangeZone.style.display = 'none';
    this.topLabel.style.display = 'none';
    this.bottomLabel.style.display = 'none';
    this.percentLabel.style.display = 'none';
  }
}

// Make available globally
window.PriceRangePlugin = PriceRangePlugin;