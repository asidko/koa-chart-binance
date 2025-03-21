/**
 * Chart Plugin Manager
 * Manages plugins for the chart application
 */

class ChartPluginManager {
  /**
   * Create a new plugin manager
   * @param {Object} chartRenderer - Chart renderer instance
   * @param {HTMLElement} container - Chart container element
   */
  constructor(chartRenderer, container) {
    this.chartRenderer = chartRenderer;
    this.container = container;
    this.plugins = new Map();
  }
  
  /**
   * Add a plugin to the chart
   * @param {ChartPlugin} plugin - Plugin instance
   * @returns {ChartPluginManager} This manager instance
   */
  add(plugin) {
    // Initialize the plugin
    plugin.init(this.chartRenderer, this.container);
    
    // Store by name
    this.plugins.set(plugin.name, plugin);
    
    // Render immediately
    plugin.render();
    
    return this;
  }
  
  /**
   * Get a plugin by name
   * @param {string} name - Plugin name
   * @returns {ChartPlugin|undefined} The plugin if found
   */
  get(name) {
    return this.plugins.get(name);
  }
  
  /**
   * Handle chart resize
   */
  onResize() {
    for (const plugin of this.plugins.values()) {
      plugin.onResize();
    }
  }
  
  /**
   * Handle chart update
   */
  onUpdate() {
    for (const plugin of this.plugins.values()) {
      plugin.onUpdate();
    }
  }
  
  /**
   * Remove all plugins
   */
  clear() {
    for (const plugin of this.plugins.values()) {
      plugin.clear();
    }
  }
}

// Make available globally
window.ChartPluginManager = ChartPluginManager;