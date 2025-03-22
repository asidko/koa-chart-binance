/**
 * Movable Line Plugin
 * Extends the PriceLinePlugin with drag functionality to allow adjusting price level.
 */

class MovableLinePlugin extends PriceLinePlugin {
  /**
   * Create a new movable price line plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      // Enforce movable option to true
      movable: true,
      // Add callback option for when line is moved
      onMoved: null,  // function(price, event) callback when line is moved
      // Include all other options
      ...options
    });
    
    // Pre-bind drag event handlers
    this._boundHandleLabelMouseDown = this._handleLabelMouseDown.bind(this);
    this._boundHandleDragMouseMove = this._handleDragMouseMove.bind(this);
    this._boundHandleDragMouseUp = this._handleDragMouseUp.bind(this);
    
    if (this.hasTouchSupport) {
      this._boundHandleLabelTouchStart = this._handleLabelTouchStart.bind(this);
      this._boundHandleLabelTouchMove = this._handleLabelTouchMove.bind(this);
      this._boundHandleLabelTouchEnd = this._handleLabelTouchEnd.bind(this);
    }
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    // Call parent's init method
    super.init(chart, container);
    
    // Add visual indicators specific to movable lines
    if (this.labelElement) {
      this.labelElement.style.border = '1px dashed white';
      this.labelElement.title = 'Drag to adjust price level';
    }
    
    return this;
  }
  
  /**
   * Factory method to create a movable price target
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   * @param {number} price - Initial price level
   * @param {Object} [options={}] - Optional configuration
   * @returns {MovableLinePlugin} New movable line instance
   * @static
   */
  static createPriceTarget(chart, container, price, options = {}) {
    const movableLine = new MovableLinePlugin({
      price,
      style: 'dashed',
      color: '#f39c12', // Orange
      icon: 'crosshairs',
      label: `Target: ${price}`,
      showBullet: true,
      onMoved: options.onMoved || null,
      ...options
    });
    
    movableLine.init(chart, container);
    movableLine.render();
    
    return movableLine;
  }
}

// Make available globally
window.MovableLinePlugin = MovableLinePlugin;
