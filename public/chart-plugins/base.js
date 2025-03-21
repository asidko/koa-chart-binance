/**
 * Basic Chart Plugin System
 */

/**
 * Base plugin class for chart features
 */
class ChartPlugin {
  /**
   * Create a plugin
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.name = this.constructor.name;
    this.options = options;
    this.hasTouchSupport = this._detectTouchSupport();
  }
  
  /**
   * Detect if device has touch support
   * @returns {boolean} True if touch is supported
   * @private
   */
  _detectTouchSupport() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
  }
  
  /**
   * Initialize the plugin with chart components
   * @param {Object} chart - Chart renderer with D3 elements
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    this.chart = chart;
    this.container = container;
    
    // Override this method in subclasses to perform initialization
    return this;
  }
  
  /**
   * Render the plugin - override in subclasses
   * Responsible for creating/updating visual elements
   */
  render() {
    // For subclasses to implement
  }
  
  /**
   * Clear plugin elements - override in subclasses
   * Responsible for removing/cleaning up visual elements
   */
  clear() {
    // For subclasses to implement
  }
  
  /**
   * Handle chart resize
   */
  onResize() {
    this.render();
  }
  
  /**
   * Handle chart data update
   */
  onUpdate() {
    this.render();
  }
}

// Make available globally
window.ChartPlugin = ChartPlugin;