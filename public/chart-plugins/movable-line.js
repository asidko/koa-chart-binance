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
    // Add onMoved callback to options
    super({
      // Add callback option for when line is moved
      onMoved: null,  // function(price, event) callback when line is moved
      ...options
    });
    
    // Add drag state
    this.dragState = {
      isDragging: false,
      startY: 0,
      offsetY: 0
    };
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    // Call parent's init method
    super.init(chart, container);
    
    // Make the label draggable
    if (this.labelElement) {
      // Update styling to indicate draggable
      this.labelElement.style.border = '1px dashed white';
      this.labelElement.style.pointerEvents = 'auto';
      this.labelElement.style.cursor = 'ns-resize';
      this.labelElement.style.userSelect = 'none';
      this.labelElement.title = 'Drag to adjust price level';
      
      // Bind event handlers
      this._boundHandleMouseDown = this._handleMouseDown.bind(this);
      this._boundHandleMouseMove = this._handleMouseMove.bind(this);
      this._boundHandleMouseUp = this._handleMouseUp.bind(this);
      
      // Add event listener
      this.labelElement.addEventListener('mousedown', this._boundHandleMouseDown);
      
      // Add touch support if available
      if (this.hasTouchSupport) {
        this._boundHandleTouchStart = this._handleTouchStart.bind(this);
        this._boundHandleTouchMove = this._handleTouchMove.bind(this);
        this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
        
        this.labelElement.addEventListener('touchstart', this._boundHandleTouchStart, 
          { passive: false });
      }
    }
    
    return this;
  }
  
  /**
   * Handle mouse down event to start dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseDown(event) {
    if (!this.enabled) return;
    
    // Prevent text selection and default behavior
    event.preventDefault();
    
    // Calculate offset from the center of the label to the mouse
    const labelRect = this.labelElement.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);
    this.dragState.offsetY = event.clientY - labelCenterY;
    
    // Set drag state
    this.dragState.isDragging = true;
    this.dragState.startY = this.chart.y(this.options.price);
    
    // Add document-level event listeners
    document.addEventListener('mousemove', this._boundHandleMouseMove);
    document.addEventListener('mouseup', this._boundHandleMouseUp);
  }
  
  /**
   * Handle mouse move during drag
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseMove(event) {
    if (!this.enabled || !this.dragState.isDragging) return;
    
    // Prevent text selection
    event.preventDefault();
    
    const chartRect = this.container.getBoundingClientRect();
    
    // Calculate new Y position with offset adjustment
    let newY = event.clientY - chartRect.top - this.chart.dimensions.margin.top - 
      this.dragState.offsetY;
    
    // Constrain to chart area
    newY = Math.max(
      0,
      Math.min(
        newY,
        this.chart.dimensions.height
      )
    );
    
    // Convert Y position to price
    const price = this.chart.y.invert(newY);
    
    // Update the price
    this.options.price = price;
    
    // Re-render
    this.render();
  }
  
  /**
   * Handle mouse up to end dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseUp(event) {
    if (!this.enabled || !this.dragState.isDragging) return;
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Remove document-level event listeners
    document.removeEventListener('mousemove', this._boundHandleMouseMove);
    document.removeEventListener('mouseup', this._boundHandleMouseUp);
    
    // Trigger onMoved callback if defined
    if (typeof this.options.onMoved === 'function') {
      this.options.onMoved(this.options.price, event);
    }
  }
  
  /**
   * Handle touch start on label
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchStart(event) {
    if (!this.enabled || event.touches.length !== 1) return;
    
    // Prevent scroll
    event.preventDefault();
    
    const touch = event.touches[0];
    
    // Calculate offset from the center of the label to the touch
    const labelRect = this.labelElement.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);
    this.dragState.offsetY = touch.clientY - labelCenterY;
    
    // Set drag state
    this.dragState.isDragging = true;
    this.dragState.startY = this.chart.y(this.options.price);
    
    // Add touch event listeners
    this.labelElement.addEventListener('touchmove', this._boundHandleTouchMove, 
      { passive: false });
    this.labelElement.addEventListener('touchend', this._boundHandleTouchEnd);
  }
  
  /**
   * Handle touch move during drag
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchMove(event) {
    if (!this.enabled || !this.dragState.isDragging || event.touches.length !== 1) return;
    
    // Prevent scroll
    event.preventDefault();
    
    const touch = event.touches[0];
    const chartRect = this.container.getBoundingClientRect();
    
    // Calculate new Y position with offset adjustment
    let newY = touch.clientY - chartRect.top - this.chart.dimensions.margin.top - 
      this.dragState.offsetY;
    
    // Constrain to chart area
    newY = Math.max(
      0,
      Math.min(
        newY,
        this.chart.dimensions.height
      )
    );
    
    // Convert Y position to price
    const price = this.chart.y.invert(newY);
    
    // Update the price
    this.options.price = price;
    
    // Re-render
    this.render();
  }
  
  /**
   * Handle touch end to finish drag
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchEnd(event) {
    if (!this.enabled || !this.dragState.isDragging) return;
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Remove touch event listeners
    this.labelElement.removeEventListener('touchmove', this._boundHandleTouchMove);
    this.labelElement.removeEventListener('touchend', this._boundHandleTouchEnd);
    
    // Trigger onMoved callback if defined
    if (typeof this.options.onMoved === 'function') {
      this.options.onMoved(this.options.price, event);
    }
  }
  
  /**
   * Override setEnabled to handle drag state
   * @param {boolean} enabled - Whether the plugin should be enabled
   * @returns {MovableLinePlugin} This plugin instance for chaining
   */
  setEnabled(enabled) {
    const wasEnabled = this.enabled;
    
    // Call parent's setEnabled
    super.setEnabled(enabled);
    
    // If disabling, cancel any active drag
    if (wasEnabled && !enabled && this.dragState.isDragging) {
      this.dragState.isDragging = false;
      
      // Clean up any active event listeners
      document.removeEventListener('mousemove', this._boundHandleMouseMove);
      document.removeEventListener('mouseup', this._boundHandleMouseUp);
      
      if (this.labelElement) {
        this.labelElement.removeEventListener('touchmove', this._boundHandleTouchMove);
        this.labelElement.removeEventListener('touchend', this._boundHandleTouchEnd);
      }
    }
    
    // Update cursor style based on enabled state
    if (this.labelElement) {
      this.labelElement.style.cursor = enabled ? 'ns-resize' : 'default';
      this.labelElement.style.pointerEvents = enabled ? 'auto' : 'none';
    }
    
    return this;
  }
  
  /**
   * Clean up event listeners and resources
   */
  clear() {
    // Call parent's clear method
    super.clear();
    
    // Clean up our own event listeners
    if (this.labelElement) {
      this.labelElement.removeEventListener('mousedown', this._boundHandleMouseDown);
      
      if (this.hasTouchSupport) {
        this.labelElement.removeEventListener('touchstart', this._boundHandleTouchStart);
      }
      
      // Ensure any ongoing drag is canceled
      if (this.dragState.isDragging) {
        this.dragState.isDragging = false;
        document.removeEventListener('mousemove', this._boundHandleMouseMove);
        document.removeEventListener('mouseup', this._boundHandleMouseUp);
        this.labelElement.removeEventListener('touchmove', this._boundHandleTouchMove);
        this.labelElement.removeEventListener('touchend', this._boundHandleTouchEnd);
      }
    }
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
