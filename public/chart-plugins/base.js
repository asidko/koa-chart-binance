/**
 * Basic Chart Plugin System
 */

/**
 * Base Chart Plugin class
 * All chart plugins should extend this class
 */
class ChartPlugin {
  /**
   * Create a new plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    this.options = {...options};
    this.name = this.constructor.name;
    this.enabled = true;
    this.chart = null;
    this.container = null;
  }
  
  /**
   * Initialize the plugin with chart and container references
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    this.chart = chart;
    this.container = container;
    return this;
  }
  
  /**
   * Render the plugin elements
   * Should be implemented by subclasses
   */
  render() {
    // To be implemented by subclasses
    console.log(`${this.name} render() not implemented`);
  }
  
  /**
   * Clear/hide the plugin elements
   */
  clear() {
    // Default implementation does nothing
    // Subclasses should override to clean up DOM elements
  }
  
  /**
   * Enable or disable the plugin
   * @param {boolean} enabled - Whether the plugin should be enabled
   * @returns {ChartPlugin} This plugin instance for chaining
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    return this;
  }
  
  /**
   * Handle chart resize
   * Default implementation re-renders if enabled
   */
  onResize() {
    if (this.enabled && this.chart) {
      console.log(`${this.name} resize triggered`);
      // Re-render when the chart is resized
      this.render();
    }
  }
  
  /**
   * Handle chart data update
   * Default implementation re-renders if enabled
   */
  onUpdate() {
    if (this.enabled) {
      // Re-render when data updates
      this.render();
    }
  }
  
  /**
   * Destroy the plugin
   * Override to perform cleanup
   */
  destroy() {
    this.clear();
    this.chart = null;
    this.container = null;
  }
}

// Make available globally
window.ChartPlugin = ChartPlugin;