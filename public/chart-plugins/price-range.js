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
    
    // Custom events for plugin communication
    this.events = {
      rangeStart: new CustomEvent('priceRangeStart'),
      rangeEnd: new CustomEvent('priceRangeEnd')
    };
    
    // Pre-bind methods to preserve 'this' context in event handlers
    this._boundHandleMouseDown = this._handleMouseDown.bind(this);
    this._boundHandleMouseMove = this._handleMouseMove.bind(this);
    this._boundHandleMouseUp = this._handleMouseUp.bind(this);
    this._boundHandleClick = this._handleClick.bind(this);
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
    
    // Consistent label offset for all labels
    const labelOffset = 10; // Consistent spacing from chart edge
    
    // Top label
    this.topLabel = document.createElement('div');
    this.topLabel.className = 'price-range-label';
    this.topLabel.style.position = 'absolute';
    this.topLabel.style.left = 'auto';
    this.topLabel.style.right = `${labelOffset}px`;
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
    this.bottomLabel.style.right = `${labelOffset}px`;
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
    this.percentLabel.style.right = `${labelOffset}px`;
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
    this.container.addEventListener('mousedown', this._boundHandleMouseDown);
    
    // Click to clear if not dragging
    this.container.addEventListener('click', this._boundHandleClick);
  }
  
  /**
   * Handle mouse down event to start dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseDown(event) {
    // Only start drag on left mouse button
    if (event.button !== 0) return;
    
    const relativeY = event.clientY - this.container.getBoundingClientRect().top;
    
    if (this._isInChartArea(relativeY)) {
      this.dragState.isDragging = true;
      this.dragState.startY = relativeY;
      this.dragState.endY = relativeY;
      
      // Disable the PriceGuidePlugin while dragging
      this._disablePriceGuide();
      
      // Add event listeners for dragging
      document.addEventListener('mousemove', this._boundHandleMouseMove);
      document.addEventListener('mouseup', this._boundHandleMouseUp);
      
      // Prevent text selection during drag
      event.preventDefault();
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
    
    // Update end position
    const relativeY = event.clientY - this.container.getBoundingClientRect().top;
    this.dragState.endY = relativeY;
    
    // Check if the range is too small (click vs. drag)
    const rangeHeight = Math.abs(this.dragState.endY - this.dragState.startY);
    if (rangeHeight < 5) {
      // Treat as a click rather than a drag
      this.clear();
      
      // Re-enable PriceGuidePlugin if we're clearing
      this._enablePriceGuide();
    } else {
      this._updateRangeDisplay();
      
      // If we're showing a range, keep PriceGuidePlugin disabled
      // It will be re-enabled when the user clears the range
    }
    
    // End drag state
    this.dragState.isDragging = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', this._boundHandleMouseMove);
    document.removeEventListener('mouseup', this._boundHandleMouseUp);
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
   * Disable the PriceGuidePlugin
   * @private
   */
  _disablePriceGuide() {
    if (this.chart && this.chart.pluginManager) {
      const priceGuidePlugin = this.chart.pluginManager.get('PriceGuidePlugin');
      if (priceGuidePlugin) {
        priceGuidePlugin.setEnabled(false);
      }
    }
  }
  
  /**
   * Enable the PriceGuidePlugin
   * @private
   */
  _enablePriceGuide() {
    if (this.chart && this.chart.pluginManager) {
      const priceGuidePlugin = this.chart.pluginManager.get('PriceGuidePlugin');
      if (priceGuidePlugin) {
        priceGuidePlugin.setEnabled(true);
      }
    }
  }
  
  /**
   * Clear the price range display
   */
  clear() {
    // Hide all elements
    this.rangeZone.style.display = 'none';
    this.topLabel.style.display = 'none';
    this.bottomLabel.style.display = 'none';
    this.percentLabel.style.display = 'none';
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Re-enable the PriceGuidePlugin
    this._enablePriceGuide();
  }
  
  /**
   * Set plugin enabled state
   * @param {boolean} enabled - Whether the plugin should be enabled
   * @returns {PriceRangePlugin} - The plugin instance
   * @override
   */
  setEnabled(enabled) {
    // Call parent method first
    super.setEnabled(enabled);
    
    // If we're disabling this plugin, ensure we clear any active range
    if (!enabled) {
      this.clear();
      // When this plugin is disabled, make sure PriceGuidePlugin is re-enabled
      this._enablePriceGuide();
    }
    
    return this;
  }
}

// Make available globally
window.PriceRangePlugin = PriceRangePlugin;