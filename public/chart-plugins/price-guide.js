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
    this.isDisabled = false; // Disabled when price range is active
    
    // Pre-bind methods to preserve 'this' context in event handlers
    this._boundHandleMouseMove = this._handleMouseMove.bind(this);
    this._boundHandleMouseLeave = this._handleMouseLeave.bind(this);
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
    // Consistent label offset for all labels
    const labelOffset = 10; // Consistent spacing from chart edge
    
    // Create container for the line only
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
    
    // Create price label - add directly to main container
    this.guideLabel = document.createElement('div');
    this.guideLabel.className = 'price-guide-label';
    this.guideLabel.style.position = 'absolute';
    this.guideLabel.style.left = 'auto';
    this.guideLabel.style.right = `${labelOffset}px`;
    this.guideLabel.style.transform = 'translateY(-50%)';
    this.guideLabel.style.backgroundColor = this.options.labelBgColor;
    this.guideLabel.style.opacity = '0.8'; // Semi-transparent
    this.guideLabel.style.color = this.options.labelTextColor;
    this.guideLabel.style.fontSize = '10px';
    this.guideLabel.style.padding = '2px 6px';
    this.guideLabel.style.borderRadius = '3px';
    this.guideLabel.style.display = 'none'; // Initially hidden
    this.guideLabel.style.zIndex = '11';
    this.container.appendChild(this.guideLabel);
    
    // Create percent label - add directly to main container
    if (this.options.showPercent) {
      this.percentLabel = document.createElement('div');
      this.percentLabel.className = 'price-guide-percent';
      this.percentLabel.style.position = 'absolute';
      this.percentLabel.style.left = 'auto';
      this.percentLabel.style.right = `${labelOffset}px`;
      this.percentLabel.style.transform = 'translateY(-50%)';
      this.percentLabel.style.backgroundColor = this.options.labelBgColor;
      this.percentLabel.style.color = this.options.labelTextColor;
      this.percentLabel.style.fontSize = '11px';
      this.percentLabel.style.padding = '2px 6px';
      this.percentLabel.style.borderRadius = '3px';
      this.percentLabel.style.display = 'none'; // Initially hidden
      this.percentLabel.style.zIndex = '11';
      this.container.appendChild(this.percentLabel); // Add to main container
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Mouse events
    this.container.addEventListener('mousemove', this._boundHandleMouseMove);
    this.container.addEventListener('mouseleave', this._boundHandleMouseLeave);
    
    // Touch events
    if (this.hasTouchSupport) {
      this._boundHandleTouchStart = this._handleTouchStart.bind(this);
      this._boundHandleTouchMove = this._handleTouchMove.bind(this);
      this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
      
      this.container.addEventListener('touchstart', this._boundHandleTouchStart, { passive: true });
      this.container.addEventListener('touchmove', this._boundHandleTouchMove, { passive: false });
      this.container.addEventListener('touchend', this._boundHandleTouchEnd, { passive: true });
      
      // Add tap event for better mobile support
      this.container.addEventListener('click', this._handleClick.bind(this));
    }
    
    // Listen for price range events
    this.container.addEventListener('priceRangeStart', this._handleRangeStart.bind(this));
    this.container.addEventListener('priceRangeEnd', this._handleRangeEnd.bind(this));
  }
  
  /**
   * Handle price range start event
   * @private
   */
  _handleRangeStart() {
    this.isDisabled = true;
    this._hide();
  }
  
  /**
   * Handle price range end event
   * @private
   */
  _handleRangeEnd() {
    this.isDisabled = false;
  }
  
  /**
   * Handle touch start
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchStart(event) {
    // Skip if plugin is disabled
    if (!this.enabled || this.isDisabled) return;
    
    if (event.touches.length === 1) {
      this._processTouchPosition(event.touches[0]);
    }
  }
  
  /**
   * Handle touch move
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchMove(event) {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    if (event.touches.length === 1) {
      this._processTouchPosition(event.touches[0]);
      event.preventDefault();
    }
  }
  
  /**
   * Handle touch end
   * @private
   */
  _handleTouchEnd() {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    this._hide();
  }
  
  /**
   * Process touch position
   * @param {Touch} touch - Touch point
   * @private
   */
  _processTouchPosition(touch) {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = touch.clientY - chartRect.top;
    
    if (this._isInChartArea(relativeY)) {
      this.position.y = relativeY;
      this._updateGuide(relativeY);
      this._show();
    }
  }
  
  /**
   * Handle mouse movement
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseMove(event) {
    // Skip if plugin is disabled
    if (!this.enabled || this.isDisabled) return;
    
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = event.clientY - chartRect.top;
    
    if (this._isInChartArea(relativeY)) {
      this.position.y = relativeY;
      this._updateGuide(relativeY);
      this._show();
    }
  }
  
  /**
   * Handle mouse leave
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseLeave() {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
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
      this.guideLabel.style.display = 'none';
      if (this.percentLabel) {
        this.percentLabel.style.display = 'none';
      }
      this.visible = false;
    }
  }
  
  /**
   * Update the guide position and content
   * @private
   */
  _updateGuide(y) {
    if (!this.chart) return;
    
    // Update line position
    this.guideContainer.style.top = `${y}px`;
    
    // Show the guide elements
    this.guideContainer.style.opacity = '1';
    this.guideLabel.style.display = 'block';
    
    // Check if we're on a small screen
    const containerWidth = this.container.clientWidth;
    const isSmallScreen = containerWidth < 600;
    
    // Calculate price at current position
    const price = this._calculatePriceAtPosition(y);
    
    // Format the price based on market price (could be very small for some coins)
    const formattedPrice = ChartUtils.formatPrice(price);
    
    // Update label text
    this.guideLabel.textContent = formattedPrice;
    
    // Adjust label size based on screen size
    if (isSmallScreen) {
      this.guideLabel.style.fontSize = '8px';
      this.guideLabel.style.padding = '2px 5px';
    } else {
      this.guideLabel.style.fontSize = '10px';
      this.guideLabel.style.padding = '2px 6px';
    }
    
    // Position the label at the cursor position
    this.guideLabel.style.top = `${y}px`;
    
    // Calculate percent change if enabled
    if (this.options.showPercent && this.chart.lastData && this.chart.lastData.length > 0) {
      // Get the latest price from chart data
      const latestPrice = this.chart.lastData[this.chart.lastData.length - 1].price;
      
      // Calculate percentage difference from current price to guide price
      const percentDiff = ChartUtils.calculatePercentDifference(price, latestPrice);
      const formattedPercent = ChartUtils.formatPercent(percentDiff);
      
      // Update percent label if configured
      if (this.percentLabel) {
        this.percentLabel.textContent = formattedPercent;
        this.percentLabel.style.display = 'block';
        
        // Position percentage label 8px below the price label (closer to price label)
        this.percentLabel.style.top = `${y + 20}px`;
        
        // Color based on positive/negative change
        const changeColor = percentDiff >= 0 ? this.options.percentUpColor : this.options.percentDownColor;
        this.percentLabel.style.backgroundColor = changeColor;
        
        // Match font size with price label
        this.percentLabel.style.fontSize = isSmallScreen ? '8px' : '10px';
        this.percentLabel.style.padding = isSmallScreen ? '2px 5px' : '2px 6px';
      }
    } else if (this.percentLabel) {
      // Hide percent label if not showing percent change
      this.percentLabel.style.display = 'none';
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
   * Handle click event (for touch devices)
   * @param {MouseEvent} event - Click event
   * @private
   */
  _handleClick(event) {
    // Skip if plugin is disabled
    if (!this.enabled || this.isDisabled) return;
    
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = event.clientY - chartRect.top;
    
    if (this._isInChartArea(relativeY)) {
      this.position.y = relativeY;
      this._updateGuide(relativeY);
      this._show();
      
      // Hide guide after short delay
      setTimeout(() => {
        this._hide();
      }, 3000);
    }
  }
  
  /**
   * Render the plugin
   * This plugin renders based on mouse events
   */
  render() {
    // This plugin renders in response to mouse events
  }
  
  /**
   * Clean up and remove elements
   */
  clear() {
    if (this.guideContainer) {
      this.container.removeChild(this.guideContainer);
      this.guideContainer = null;
    }
    
    if (this.guideLabel) {
      this.container.removeChild(this.guideLabel);
      this.guideLabel = null;
    }
    
    if (this.percentLabel) {
      this.container.removeChild(this.percentLabel);
      this.percentLabel = null;
    }
    
    // Remove event listeners
    this.container.removeEventListener('mousemove', this._boundHandleMouseMove);
    this.container.removeEventListener('mouseleave', this._boundHandleMouseLeave);
    
    if (this.hasTouchSupport) {
      this.container.removeEventListener('touchstart', this._boundHandleTouchStart);
      this.container.removeEventListener('touchmove', this._boundHandleTouchMove);
      this.container.removeEventListener('touchend', this._boundHandleTouchEnd);
      this.container.removeEventListener('click', this._handleClick);
    }
    
    this.container.removeEventListener('priceRangeStart', this._handleRangeStart);
    this.container.removeEventListener('priceRangeEnd', this._handleRangeEnd);
  }
}

// Make available globally
window.PriceGuidePlugin = PriceGuidePlugin;