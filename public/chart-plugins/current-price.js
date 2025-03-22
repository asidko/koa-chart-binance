/**
 * Current Price Plugin
 * Displays a horizontal line at the current price with a bullet point and label.
 */

class CurrentPricePlugin extends ChartPlugin {
  /**
   * Create a new current price plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      lineColor: '#3498db',      // Color of the price line
      lineStyle: 'dashed',       // Style of the price line: 'solid' or 'dashed'
      showBullet: true,          // Whether to show bullet point
      icon: null,                // Optional icon to show in label
      showPercentage: true,      // Whether to show percentage change
      percentFormat: '+0.00%',   // Format for percentage display
      ...options
    });
    
    // Internal state
    this.currentPrice = null;
    this.previousPrice = null;
    this.percentChange = null;
    
    // The price line plugin instance
    this.priceLine = null;
    
    // DOM elements
    this.percentElement = null;
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    super.init(chart, container);
    
    // Create price line plugin with initial options
    this.priceLine = new PriceLinePlugin({
      price: 0,
      style: this.options.lineStyle,
      color: this.options.lineColor,
      showBullet: this.options.showBullet,
      icon: this.options.icon,
      position: 'right',
      movable: false  // Disable movable functionality
    });
    
    // Initialize the price line plugin
    this.priceLine.init(chart, container);
    
    // Create percentage display element if enabled
    if (this.options.showPercentage) {
      this._createPercentElement();
    }
    
    return this;
  }
  
  /**
   * Create percentage display element
   * @private
   */
  _createPercentElement() {
    // Create the percentage element
    this.percentElement = document.createElement('div');
    this.percentElement.className = 'price-percent-label';
    this.percentElement.style.position = 'absolute';
    this.percentElement.style.right = '10px';
    this.percentElement.style.transform = 'translateY(-50%)';
    this.percentElement.style.backgroundColor = '#555';
    this.percentElement.style.color = 'white';
    this.percentElement.style.padding = '2px 6px';
    this.percentElement.style.borderRadius = '3px';
    this.percentElement.style.fontSize = '11px';
    this.percentElement.style.fontWeight = 'bold';
    this.percentElement.style.opacity = '0.9';
    this.percentElement.style.zIndex = '6'; // Higher z-index to ensure visibility
    this.percentElement.style.display = 'none'; // Initially hidden
    this.percentElement.style.pointerEvents = 'none'; // Allow interactions with elements beneath
    
    // Add to container
    this.container.appendChild(this.percentElement);
  }
  
  /**
   * Update percentage information
   * @param {number} currentPrice - Current price
   * @private
   */
  _updatePercentInfo(currentPrice) {
    if (!this.options.showPercentage || !this.percentElement) return;
    
    // Store previous price if this is first update
    if (this.previousPrice === null && this.currentPrice !== null) {
      this.previousPrice = this.currentPrice;
    }
    
    // Update percentage change if we have previous price
    if (this.previousPrice !== null && this.previousPrice > 0) {
      this.percentChange = ((currentPrice - this.previousPrice) / this.previousPrice) * 100;
      
      // Format and display percentage
      const formattedPercent = ChartUtils.formatPercent(this.percentChange);
      this.percentElement.textContent = formattedPercent;
      
      // Set color based on change direction
      const changeColor = this.percentChange >= 0 ? '#4caf50' : '#ff5252';
      this.percentElement.style.backgroundColor = changeColor;
      
      // Position the percentage element directly above the price line label
      const yPos = this.chart.y(currentPrice);
      
      // Use the right margin from the chart dimensions for consistent positioning
      const rightOffset = this.chart.dimensions.margin.right + 10; // 10px padding
      
      // Calculate vertical position with responsive offset based on chart height
      const isSmallScreen = this.container.clientWidth < 600;
      const verticalOffset = isSmallScreen ? 20 : 25;
      
      this.percentElement.style.top = `${this.chart.dimensions.margin.top + yPos - verticalOffset}px`;
      this.percentElement.style.right = `${rightOffset}px`;
      this.percentElement.style.zIndex = '6'; // Ensure it's above other elements
      
      // Show the percentage element
      this.percentElement.style.display = 'block';
    }
  }
  
  /**
   * Render the current price elements
   */
  render() {
    if (!this.chart || !this.chart.lastData || this.chart.lastData.length === 0) {
      this.clear();
      return;
    }
    
    // Get the last data point
    const lastPoint = this.chart.lastData[this.chart.lastData.length - 1];
    const newPrice = lastPoint.price;
    
    // Store previous price for next percentage calculation if it's our first render
    if (this.currentPrice === null) {
      this.previousPrice = newPrice;
      this.currentPrice = newPrice;
    } 
    // Update percentage only if price actually changed
    else if (newPrice !== this.currentPrice) {
      this.previousPrice = this.currentPrice;
      this._updatePercentInfo(newPrice);
      this.currentPrice = newPrice;
    }
    
    // Update the price line plugin with the current price
    this.priceLine.updatePrice(this.currentPrice);
  }
  
  /**
   * Handle chart resize
   */
  onResize() {
    super.onResize();
    
    // Update percentage element position if it exists
    if (this.percentElement && this.currentPrice !== null) {
      const yPos = this.chart.y(this.currentPrice);
      this.percentElement.style.top = `${this.chart.dimensions.margin.top + yPos - 30}px`;
    }
  }
  
  /**
   * Clear/hide the current price elements
   */
  clear() {
    if (this.priceLine) {
      this.priceLine.clear();
    }
    
    if (this.percentElement) {
      this.percentElement.style.display = 'none';
    }
  }
}

// Make available globally
window.CurrentPricePlugin = CurrentPricePlugin;