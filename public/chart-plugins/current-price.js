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
      lineWidth: 1,              // Width of the price line
      lineDash: [5, 3],          // Dash pattern for the line
      bulletRadius: 6,           // Radius of the bullet point
      bulletStrokeWidth: 1,      // Stroke width of the bullet
      labelBgColor: '#3498db',   // Background color of the price label
      labelTextColor: 'white',   // Text color for the price label
      ...options
    });
    
    // References to D3 elements
    this.line = null;
    this.bullet = null;
    this.label = null;
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    super.init(chart, container);
    
    // Create D3 elements
    this.line = this.chart.svg.append('line')
      .attr('class', 'current-price-line')
      .attr('stroke', this.options.lineColor)
      .attr('stroke-width', this.options.lineWidth)
      .attr('stroke-dasharray', this.options.lineDash.join(','));
    
    this.bullet = this.chart.svg.append('circle')
      .attr('class', 'current-price-bullet')
      .attr('r', this.options.bulletRadius)
      .attr('fill', this.options.lineColor)
      .attr('stroke', 'white')
      .attr('stroke-width', this.options.bulletStrokeWidth);
    
    // Create label as a DOM element for better control
    this.labelElement = document.createElement('div');
    this.labelElement.className = 'current-price-label';
    this.labelElement.style.position = 'absolute';
    this.labelElement.style.backgroundColor = this.options.labelBgColor;
    this.labelElement.style.color = this.options.labelTextColor;
    this.labelElement.style.padding = '3px 8px';
    this.labelElement.style.borderRadius = '3px';
    this.labelElement.style.fontSize = '12px';
    this.labelElement.style.fontWeight = 'bold';
    this.labelElement.style.pointerEvents = 'none';
    this.labelElement.style.zIndex = '5';
    this.labelElement.style.transform = 'translateY(-50%)';
    
    // Add label to container
    this.container.appendChild(this.labelElement);
    
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
    
    // Get dimensions and the last data point
    const { width, height, margin } = this.chart.dimensions;
    const lastPoint = this.chart.lastData[this.chart.lastData.length - 1];
    
    // Calculate positions
    const lastX = this.chart.x(new Date(lastPoint.timestamp));
    const lastY = this.chart.y(lastPoint.price);
    
    // Update line
    this.line
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', lastY)
      .attr('y2', lastY);
    
    // Update bullet
    this.bullet
      .attr('cx', lastX)
      .attr('cy', lastY);
    
    // Update label
    const formattedPrice = this._formatPrice(lastPoint.price);
    this.labelElement.textContent = formattedPrice;
    this.labelElement.style.left = `${margin.left + 10}px`;
    this.labelElement.style.top = `${margin.top + lastY}px`;
    this.labelElement.style.display = 'block';
    
    // Ensure elements are on top
    this.chart.svg.node().appendChild(this.line.node());
    this.chart.svg.node().appendChild(this.bullet.node());
  }
  
  /**
   * Clear/hide the current price elements
   */
  clear() {
    if (this.line) {
      this.line.attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 0);
    }
    
    if (this.bullet) {
      this.bullet.attr('cx', 0).attr('cy', 0);
    }
    
    if (this.labelElement) {
      this.labelElement.style.display = 'none';
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
window.CurrentPricePlugin = CurrentPricePlugin;