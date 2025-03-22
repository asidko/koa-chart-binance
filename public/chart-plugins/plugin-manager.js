/**
 * Chart Plugin Manager
 * Manages multiple plugins for a chart
 */

class ChartPluginManager {
  /**
   * Create a plugin manager
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Chart container
   */
  constructor(chart, container) {
    this.chart = chart;
    this.container = container;
    this.plugins = [];
  }
  
  /**
   * Add a plugin
   * @param {ChartPlugin} plugin - Plugin to add
   * @returns {ChartPlugin} The added plugin
   */
  add(plugin) {
    plugin.init(this.chart, this.container);
    this.plugins.push(plugin);
    return plugin;
  }
  
  /**
   * Notify plugins of data update
   */
  onUpdate() {
    for (const plugin of this.plugins) {
      if (plugin.enabled) {
        plugin.render();
      }
    }
  }
  
  /**
   * Notify plugins of chart resize
   */
  onResize() {
    console.log(`Notifying ${this.plugins.length} plugins of resize`);
    for (const plugin of this.plugins) {
      // Always call onResize regardless of enabled state
      // This ensures plugins can update internal state even if disabled
      plugin.onResize();
    }
  }
  
  /**
   * Get a plugin by its index
   * @param {number} index - Plugin index
   * @returns {ChartPlugin|null} Plugin or null if not found
   */
  getByIndex(index) {
    return this.plugins[index] || null;
  }
  
  /**
   * Find a plugin by type
   * @param {Function} pluginType - Plugin class/constructor
   * @returns {ChartPlugin|null} First matching plugin or null
   */
  getByType(pluginType) {
    return this.plugins.find(plugin => plugin instanceof pluginType) || null;
  }
  
  /**
   * Enable all plugins
   */
  enableAll() {
    for (const plugin of this.plugins) {
      plugin.setEnabled(true);
    }
  }
  
  /**
   * Disable all plugins
   */
  disableAll() {
    for (const plugin of this.plugins) {
      plugin.setEnabled(false);
    }
  }
}

// Make available globally
window.ChartPluginManager = ChartPluginManager;