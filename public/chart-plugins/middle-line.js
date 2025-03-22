/**
 * Middle Line Plugin
 * Analyzes chart data to find the middle point between highs and lows
 * and draws a horizontal line at that price level using PriceLinePlugin
 */

class MiddleLinePlugin extends ChartPlugin {
  /**
   * Create a new middle line plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      lineColor: '#9b59b6',      // Purple color by default
      lineStyle: 'dashed',       // Style of the price line: 'solid' or 'dashed'
      showBullet: false,         // Whether to show bullet point
      icon: 'arrows-up-down',    // Icon for the label
      labelText: null,           // Custom label text (if null, will show price only)
      position: 'right',         // Label position: 'left', 'right'
      showFullInfo: false,       // Whether to show full info in label or as tooltip
      ...options
    });
    
    // Internal state
    this.middlePrice = null;
    this.highPrice = null;
    this.lowPrice = null;
    
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
    
    // Create price line plugin with initial options, but don't render yet
    // since we don't have a price calculated
    this.priceLine = new PriceLinePlugin({
      price: 0, // Will be updated in render()
      style: this.options.lineStyle,
      color: this.options.lineColor,
      showBullet: this.options.showBullet,
      icon: this.options.icon,
      position: this.options.position
    });
    
    // Initialize the price line plugin
    this.priceLine.init(chart, container);
    
    return this;
  }
  
  /**
   * Calculate the middle price from chart data
   * @private
   * @returns {Object} Price analysis result
   */
  _analyzeChartData() {
    if (!this.chart?.lastData || this.chart.lastData.length === 0) {
      return { middle: null, high: null, low: null };
    }
    
    // Find highest and lowest prices in the data
    const prices = this.chart.lastData.map(point => point.price);
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    
    // Calculate middle price
    const middlePrice = (highPrice + lowPrice) / 2;
    
    return {
      middle: middlePrice,
      high: highPrice,
      low: lowPrice
    };
  }
  
  /**
   * Render the middle line
   */
  render() {
    if (!this.chart || !this.chart.lastData || this.chart.lastData.length === 0) {
      this.clear();
      return;
    }
    
    // Analyze the chart data
    const { middle, high, low } = this._analyzeChartData();
    
    if (middle === null) {
      this.clear();
      return;
    }
    
    // Store calculated values
    this.middlePrice = middle;
    this.highPrice = high;
    this.lowPrice = low;
    
    // Format values for display
    const formattedMiddle = this._formatPrice(middle);
    const formattedRange = this._formatPrice(high - low);
    const percentRange = ((high - low) / middle * 100).toFixed(2);
    
    // Create a simple label with just the price
    const simpleLabel = formattedMiddle;
    
    // Create a detailed tooltip with full information
    const fullInfoText = `Middle: ${formattedMiddle} (Range: ${formattedRange}, ${percentRange}%)`;
    
    // Use provided label text or default
    let labelText = this.options.labelText;
    if (labelText === null) {
      // Default to simple label with just the price
      labelText = simpleLabel;
    }
    
    // Update the price line plugin with the middle price
    this.priceLine.options.price = middle;
    this.priceLine.options.label = labelText;
    this.priceLine.options.tooltip = fullInfoText;
    this.priceLine.render();
  }
  
  /**
   * Clear/hide the middle line
   */
  clear() {
    if (this.priceLine) {
      this.priceLine.clear();
    }
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
}

// Make available globally
window.MiddleLinePlugin = MiddleLinePlugin; 