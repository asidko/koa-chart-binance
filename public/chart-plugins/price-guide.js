/**
 * Price Guide Plugin
 * Shows a horizontal line at cursor position with price label
 */

class PriceGuidePlugin extends ChartPlugin {
  /**
   * Create a price guide plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      lineColor: '#555',         // Color of guide line  
      lineDash: [1, 1],          // Line dash pattern
      labelBgColor: '#555',      // Label background color
      labelTextColor: 'white',   // Label text color
      showPercent: true,         // Whether to show % difference from current price
      percentUpColor: '#4caf50', // Color for positive % change
      percentDownColor: '#ff5252', // Color for negative % change
      ...options
    });
    
    // DOM Elements
    this.guideContainer = null;
    this.guideLine = null;
    this.guideLabel = null;
    this.percentLabel = null;
    
    // Current state
    this.visible = false;
    this.position = { x: 0, y: 0 };
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element  
   */
  init(chart, container) {
    super.init(chart, container);
    
    // Create DOM elements
    this._createElements();
    
    // Set up event listeners
    this._setupEventListeners();
    
    return this;
  }
  
  /**
   * Create DOM elements for the price guide
   * @private
   */
  _createElements() {
    // Create container
    this.guideContainer = document.createElement('div');
    this.guideContainer.className = 'price-guide';
    this.guideContainer.style.position = 'absolute';
    this.guideContainer.style.left = `${this.chart.dimensions.margin.left}px`;
    this.guideContainer.style.right = `${this.chart.dimensions.margin.right}px`;
    this.guideContainer.style.opacity = '0';
    this.guideContainer.style.transition = 'opacity 0.1s';
    this.guideContainer.style.pointerEvents = 'none';
    this.guideContainer.style.zIndex = '10';
    this.container.appendChild(this.guideContainer);
    
    // Create guide line
    this.guideLine = document.createElement('div');
    this.guideLine.className = 'price-guide-line';
    this.guideLine.style.position = 'absolute';
    this.guideLine.style.height = '0';
    this.guideLine.style.width = '100%';
    this.guideLine.style.borderTop = `1px dashed ${this.options.lineColor}`;
    this.guideContainer.appendChild(this.guideLine);
    
    // Create price label
    this.guideLabel = document.createElement('div');
    this.guideLabel.className = 'price-guide-label';
    this.guideLabel.style.position = 'absolute';
    this.guideLabel.style.left = '10px';
    this.guideLabel.style.transform = 'translateY(-50%)';
    this.guideLabel.style.backgroundColor = this.options.labelBgColor;
    this.guideLabel.style.color = this.options.labelTextColor;
    this.guideLabel.style.fontSize = '12px';
    this.guideLabel.style.padding = '3px 8px';
    this.guideLabel.style.borderRadius = '3px';
    this.guideContainer.appendChild(this.guideLabel);
    
    // Create percent label
    if (this.options.showPercent) {
      this.percentLabel = document.createElement('div');
      this.percentLabel.className = 'price-guide-percent';
      this.percentLabel.style.position = 'absolute';
      this.percentLabel.style.left = '10px';
      this.percentLabel.style.transform = 'translateY(-50%)';
      this.percentLabel.style.backgroundColor = this.options.labelBgColor;
      this.percentLabel.style.color = this.options.labelTextColor;
      this.percentLabel.style.fontSize = '11px';
      this.percentLabel.style.padding = '2px 6px';
      this.percentLabel.style.borderRadius = '3px';
      this.percentLabel.style.top = '20px';
      this.guideContainer.appendChild(this.percentLabel);
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    this.container.addEventListener('mousemove', this._handleMouseMove.bind(this));
    this.container.addEventListener('mouseleave', this._handleMouseLeave.bind(this));
  }
  
  /**
   * Handle mouse movement
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseMove(event) {
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = event.clientY - chartRect.top;
    
    if (this._isInChartArea(relativeY)) {
      this.position.y = relativeY;
      this._updateGuide();
      this._show();
    } else {
      this._hide();
    }
  }
  
  /**
   * Handle mouse leave
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseLeave() {
    this._hide();
  }
  
  /**
   * Show the price guide
   * @private
   */
  _show() {
    if (!this.visible) {
      this.guideContainer.style.opacity = '1';
      this.visible = true;
    }
  }
  
  /**
   * Hide the price guide
   * @private
   */
  _hide() {
    if (this.visible) {
      this.guideContainer.style.opacity = '0';
      this.visible = false;
    }
  }
  
  /**
   * Update the guide position and content
   * @private
   */
  _updateGuide() {
    const price = this._calculatePriceAtPosition(this.position.y);
    
    // Update container position
    this.guideContainer.style.top = `${this.position.y}px`;
    
    // Update label content
    this.guideLabel.textContent = this._formatPrice(price);
    
    // Update percent difference if enabled
    if (this.options.showPercent && this.chart.lastData && this.chart.lastData.length > 0) {
      const lastPoint = this.chart.lastData[this.chart.lastData.length - 1];
      const lastPrice = lastPoint.price;
      
      if (lastPrice !== null) {
        const percentDiff = this._calculatePercentDifference(price, lastPrice);
        const formattedPercent = this._formatPercent(percentDiff);
        
        // Set content and color
        this.percentLabel.textContent = formattedPercent;
        this.percentLabel.style.backgroundColor = percentDiff >= 0 
          ? this.options.percentUpColor 
          : this.options.percentDownColor;
      }
    }
  }
  
  /**
   * Check if position is in chart area
   * @param {number} y - Y coordinate
   * @returns {boolean} True if in chart area
   * @private
   */
  _isInChartArea(y) {
    const { margin } = this.chart.dimensions;
    const chartRect = this.container.getBoundingClientRect();
    return y >= margin.top && y <= (chartRect.height - margin.bottom);
  }
  
  /**
   * Calculate price at position
   * @param {number} y - Y position in pixels
   * @returns {number} Price at position
   * @private
   */
  _calculatePriceAtPosition(y) {
    const mouseYInScaleSpace = y - this.chart.dimensions.margin.top;
    return this.chart.y.invert(mouseYInScaleSpace);
  }
  
  /**
   * Calculate percentage difference between two prices
   * @param {number} price1 - First price
   * @param {number} price2 - Second price
   * @returns {number} Percentage difference
   * @private
   */
  _calculatePercentDifference(price1, price2) {
    if (price2 === 0) return 0;
    return ((price1 - price2) / price2) * 100;
  }
  
  /**
   * Format percentage with +/- sign
   * @param {number} percent - Percentage value
   * @param {number} [decimals=2] - Number of decimal places
   * @returns {string} Formatted percentage
   * @private
   */
  _formatPercent(percent, decimals = 2) {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(decimals)}%`;
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
   * Render the plugin
   * This plugin renders based on mouse events
   */
  render() {
    // This plugin renders in response to mouse events
  }
  
  /**
   * Clear/hide the price guide
   */
  clear() {
    this._hide();
  }
}

// Make available globally
window.PriceGuidePlugin = PriceGuidePlugin;