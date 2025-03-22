/**
 * Current Price Plugin
 * Displays a horizontal line at the current price with a bullet point and label
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
      ...options
    });
    
    // Internal state
    this.currentPrice = null;
    
    // The price line plugin instance
    this.priceLine = null;
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
      position: 'right'
    });
    
    // Initialize the price line plugin
    this.priceLine.init(chart, container);
    
    return this;
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
    this.currentPrice = lastPoint.price;
    
    // Update the price line plugin with the current price
    this.priceLine.updatePrice(this.currentPrice);
  }
  
  /**
   * Clear/hide the current price elements
   */
  clear() {
    if (this.priceLine) {
      this.priceLine.clear();
    }
  }
}

// Make available globally
window.CurrentPricePlugin = CurrentPricePlugin;