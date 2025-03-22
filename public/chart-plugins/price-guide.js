/**
 * Price Guide Plugin
 * Shows a horizontal line at cursor position with price label
 */

class PriceGuidePlugin extends ChartPlugin {
  /**
   * Create a price guide plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      lineColor: '#555',         // Color of guide line  
      lineDash: [1, 1],          // Line dash pattern
      labelBgColor: '#555',      // Label background color
      labelTextColor: 'white',   // Label text color
      showPercent: true,         // Whether to show % difference from current price
      percentUpColor: '#4caf50', // Color for positive % change
      percentDownColor: '#ff5252', // Color for negative % change
      movable: false,            // Whether the guide line can be dragged by the label
      onMoved: null,             // Callback when the line is moved (function(price, event) {})
      ...options
    });
    
    // DOM Elements
    this.guideContainer = null;
    this.guideLine = null;
    this.guideLabel = null;
    this.percentLabel = null;
    
    // Current state
    this.visible = false;
    this.position = { x: 0, y: 0 };
    this.isDisabled = false; // Disabled when price range is active
    
    // Drag state
    this.dragState = {
      isDragging: false,
      startY: 0,
      offsetY: 0
    };
    
    // Pre-bind methods to preserve 'this' context in event handlers
    this._boundHandleMouseMove = this._handleMouseMove.bind(this);
    this._boundHandleMouseLeave = this._handleMouseLeave.bind(this);
    this._boundHandleLabelMouseDown = this._handleLabelMouseDown.bind(this);
    this._boundHandleDragMouseMove = this._handleDragMouseMove.bind(this);
    this._boundHandleDragMouseUp = this._handleDragMouseUp.bind(this);
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element  
   */
  init(chart, container) {
    super.init(chart, container);
    
    // Create DOM elements
    this._createElements();
    
    // Set up event listeners
    this._setupEventListeners();
    
    return this;
  }
  
  /**
   * Create DOM elements for the price guide
   * @private
   */
  _createElements() {
    // Consistent label offset for all labels
    const labelOffset = 10; // Consistent spacing from chart edge
    
    // Create container for the line only
    this.guideContainer = document.createElement('div');
    this.guideContainer.className = 'price-guide';
    this.guideContainer.style.position = 'absolute';
    this.guideContainer.style.left = `${this.chart.dimensions.margin.left}px`;
    this.guideContainer.style.right = `${this.chart.dimensions.margin.right}px`;
    this.guideContainer.style.opacity = '0';
    this.guideContainer.style.transition = 'opacity 0.1s';
    this.guideContainer.style.pointerEvents = 'none';
    this.guideContainer.style.zIndex = '10';
    this.container.appendChild(this.guideContainer);
    
    // Create guide line
    this.guideLine = document.createElement('div');
    this.guideLine.className = 'price-guide-line';
    this.guideLine.style.position = 'absolute';
    this.guideLine.style.height = '0';
    this.guideLine.style.width = '100%';
    this.guideLine.style.borderTop = `1px dashed ${this.options.lineColor}`;
    this.guideContainer.appendChild(this.guideLine);
    
    // Create price label - add directly to main container
    this.guideLabel = document.createElement('div');
    this.guideLabel.className = 'price-guide-label';
    this.guideLabel.style.position = 'absolute';
    this.guideLabel.style.left = 'auto';
    this.guideLabel.style.right = `${labelOffset}px`;
    this.guideLabel.style.transform = 'translateY(-50%)';
    this.guideLabel.style.backgroundColor = this.options.labelBgColor;
    this.guideLabel.style.color = this.options.labelTextColor;
    this.guideLabel.style.fontSize = '12px';
    this.guideLabel.style.padding = '3px 8px';
    this.guideLabel.style.borderRadius = '3px';
    this.guideLabel.style.display = 'none'; // Initially hidden
    this.guideLabel.style.zIndex = '11';
    
    // Make the label draggable if the movable option is enabled
    if (this.options.movable) {
      this.guideLabel.style.pointerEvents = 'auto';
      this.guideLabel.style.cursor = 'ns-resize';
      this.guideLabel.style.userSelect = 'none'; // Prevent text selection during drag
    }
    
    this.container.appendChild(this.guideLabel); // Add to main container
    
    // Create percent label - add directly to main container
    if (this.options.showPercent) {
      this.percentLabel = document.createElement('div');
      this.percentLabel.className = 'price-guide-percent';
      this.percentLabel.style.position = 'absolute';
      this.percentLabel.style.left = 'auto';
      this.percentLabel.style.right = `${labelOffset}px`;
      this.percentLabel.style.transform = 'translateY(-50%)';
      this.percentLabel.style.backgroundColor = this.options.labelBgColor;
      this.percentLabel.style.color = this.options.labelTextColor;
      this.percentLabel.style.fontSize = '11px';
      this.percentLabel.style.padding = '2px 6px';
      this.percentLabel.style.borderRadius = '3px';
      this.percentLabel.style.display = 'none'; // Initially hidden
      this.percentLabel.style.zIndex = '11';
      this.container.appendChild(this.percentLabel); // Add to main container
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Mouse events
    this.container.addEventListener('mousemove', this._boundHandleMouseMove);
    this.container.addEventListener('mouseleave', this._boundHandleMouseLeave);
    
    // Touch events
    if (this.hasTouchSupport) {
      this.container.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: true });
      this.container.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
      this.container.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: true });
    }
    
    // Listen for price range events
    this.container.addEventListener('priceRangeStart', this._handleRangeStart.bind(this));
    this.container.addEventListener('priceRangeEnd', this._handleRangeEnd.bind(this));
    
    // Add drag event listeners if the guide is movable
    if (this.options.movable) {
      this.guideLabel.addEventListener('mousedown', this._boundHandleLabelMouseDown);
      
      // For touch devices, add touch-specific drag handlers
      if (this.hasTouchSupport) {
        this.guideLabel.addEventListener('touchstart', this._handleLabelTouchStart.bind(this), { passive: false });
      }
    }
  }
  
  /**
   * Handle price range start event
   * @private
   */
  _handleRangeStart() {
    this.isDisabled = true;
    this._hide();
  }
  
  /**
   * Handle price range end event
   * @private
   */
  _handleRangeEnd() {
    this.isDisabled = false;
  }
  
  /**
   * Handle touch start
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchStart(event) {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    if (event.touches.length === 1) {
      this._processTouchPosition(event.touches[0]);
    }
  }
  
  /**
   * Handle touch move
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleTouchMove(event) {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    if (event.touches.length === 1) {
      this._processTouchPosition(event.touches[0]);
      event.preventDefault();
    }
  }
  
  /**
   * Handle touch end
   * @private
   */
  _handleTouchEnd() {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    this._hide();
  }
  
  /**
   * Process touch position
   * @param {Touch} touch - Touch point
   * @private
   */
  _processTouchPosition(touch) {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = touch.clientY - chartRect.top;
    
    if (this._isInChartArea(relativeY)) {
      this.position.y = relativeY;
      this._updateGuide();
      this._show();
    }
  }
  
  /**
   * Handle mouse movement
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseMove(event) {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    // Don't update position if we're currently dragging the guide
    if (this.dragState.isDragging) return;
    
    const chartRect = this.container.getBoundingClientRect();
    const relativeY = event.clientY - chartRect.top;
    
    if (this._isInChartArea(relativeY)) {
      this.position.y = relativeY;
      this._updateGuide();
      this._show();
    } else {
      this._hide();
    }
  }
  
  /**
   * Handle mouse leave
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleMouseLeave() {
    // Skip if plugin is disabled
    if (!this.enabled) return;
    
    this._hide();
  }
  
  /**
   * Show the price guide
   * @private
   */
  _show() {
    if (!this.visible) {
      this.guideContainer.style.opacity = '1';
      this.visible = true;
    }
  }
  
  /**
   * Hide the price guide
   * @private
   */
  _hide() {
    if (this.visible) {
      this.guideContainer.style.opacity = '0';
      this.guideLabel.style.display = 'none';
      if (this.percentLabel) {
        this.percentLabel.style.display = 'none';
      }
      this.visible = false;
    }
  }
  
  /**
   * Update the guide position and content
   * @private
   */
  _updateGuide() {
    const price = this._calculatePriceAtPosition(this.position.y);
    
    // Update container position
    this.guideContainer.style.top = `${this.position.y}px`;
    
    // Update price label
    this.guideLabel.textContent = this._formatPrice(price);
    this.guideLabel.style.top = `${this.position.y}px`;
    this.guideLabel.style.display = 'block';
    
    // Update percent difference if enabled
    if (this.options.showPercent && this.chart.lastData && this.chart.lastData.length > 0) {
      const lastPoint = this.chart.lastData[this.chart.lastData.length - 1];
      const lastPrice = lastPoint.price;
      
      if (lastPrice !== null) {
        const percentDiff = this._calculatePercentDifference(price, lastPrice);
        const formattedPercent = this._formatPercent(percentDiff);
        
        // Set content and color
        this.percentLabel.textContent = formattedPercent;
        this.percentLabel.style.backgroundColor = percentDiff >= 0 
          ? this.options.percentUpColor 
          : this.options.percentDownColor;
        
        // Position the percent label 20px below the price label
        this.percentLabel.style.top = `${this.position.y + 20}px`;
        this.percentLabel.style.display = 'block';
      }
    }
  }
  
  /**
   * Check if position is in chart area
   * @param {number} y - Y coordinate
   * @returns {boolean} True if in chart area
   * @private
   */
  _isInChartArea(y) {
    const { margin } = this.chart.dimensions;
    const chartRect = this.container.getBoundingClientRect();
    return y >= margin.top && y <= (chartRect.height - margin.bottom);
  }
  
  /**
   * Calculate price at position
   * @param {number} y - Y position in pixels
   * @returns {number} Price at position
   * @private
   */
  _calculatePriceAtPosition(y) {
    const mouseYInScaleSpace = y - this.chart.dimensions.margin.top;
    return this.chart.y.invert(mouseYInScaleSpace);
  }
  
  /**
   * Calculate percentage difference between two prices
   * @param {number} price1 - First price
   * @param {number} price2 - Second price
   * @returns {number} Percentage difference
   * @private
   */
  _calculatePercentDifference(price1, price2) {
    if (price2 === 0) return 0;
    return ((price1 - price2) / price2) * 100;
  }
  
  /**
   * Format percentage with +/- sign
   * @param {number} percent - Percentage value
   * @param {number} [decimals=2] - Number of decimal places
   * @returns {string} Formatted percentage
   * @private
   */
  _formatPercent(percent, decimals = 2) {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(decimals)}%`;
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
  
  /**
   * Render the plugin
   * This plugin renders based on mouse events
   */
  render() {
    // This plugin renders in response to mouse events
  }
  
  /**
   * Clear/hide the price guide
   */
  clear() {
    this._hide();
    
    // Ensure all elements are hidden
    this.guideContainer.style.opacity = '0';
    this.guideLabel.style.display = 'none';
    if (this.percentLabel) {
      this.percentLabel.style.display = 'none';
    }
  }
  
  /**
   * Handle label mouse down event to start dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleLabelMouseDown(event) {
    if (!this.enabled || !this.options.movable) return;
    
    // Prevent text selection and default browser behavior
    event.preventDefault();
    
    // Calculate offset from the center of the label to the mouse
    const labelRect = this.guideLabel.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);
    this.dragState.offsetY = event.clientY - labelCenterY;
    
    // Set drag state
    this.dragState.isDragging = true;
    this.dragState.startY = this.position.y;
    
    // Add drag event listeners
    document.addEventListener('mousemove', this._boundHandleDragMouseMove);
    document.addEventListener('mouseup', this._boundHandleDragMouseUp);
  }
  
  /**
   * Handle mouse move during drag
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleDragMouseMove(event) {
    if (!this.dragState.isDragging) return;
    
    // Prevent text selection
    event.preventDefault();
    
    const chartRect = this.container.getBoundingClientRect();
    
    // Calculate new Y position with offset adjustment
    let newY = event.clientY - chartRect.top - this.dragState.offsetY;
    
    // Constrain to chart area
    newY = Math.max(
      this.chart.dimensions.margin.top,
      Math.min(
        newY,
        chartRect.height - this.chart.dimensions.margin.bottom
      )
    );
    
    // Update position
    this.position.y = newY;
    
    // Update guide display
    this._updateGuide();
  }
  
  /**
   * Handle mouse up to end dragging
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleDragMouseUp(event) {
    if (!this.dragState.isDragging) return;
    
    // Calculate price at the final position
    const price = this._calculatePriceAtPosition(this.position.y);
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Remove drag event listeners
    document.removeEventListener('mousemove', this._boundHandleDragMouseMove);
    document.removeEventListener('mouseup', this._boundHandleDragMouseUp);
    
    // Trigger onMoved callback if defined
    if (typeof this.options.onMoved === 'function') {
      this.options.onMoved(price, event);
    }
  }
  
  /**
   * Handle touch start on label to begin drag
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleLabelTouchStart(event) {
    if (!this.enabled || !this.options.movable || event.touches.length !== 1) return;
    
    // Prevent scroll
    event.preventDefault();
    
    const touch = event.touches[0];
    
    // Calculate offset from the center of the label to the touch
    const labelRect = this.guideLabel.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);
    this.dragState.offsetY = touch.clientY - labelCenterY;
    
    // Set drag state
    this.dragState.isDragging = true;
    this.dragState.startY = this.position.y;
    
    // Set up touch move and end listeners
    this.guideLabel.addEventListener('touchmove', this._handleLabelTouchMove.bind(this), { passive: false });
    this.guideLabel.addEventListener('touchend', this._handleLabelTouchEnd.bind(this));
  }
  
  /**
   * Handle touch move during drag
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleLabelTouchMove(event) {
    if (!this.dragState.isDragging || event.touches.length !== 1) return;
    
    // Prevent scroll
    event.preventDefault();
    
    const touch = event.touches[0];
    const chartRect = this.container.getBoundingClientRect();
    
    // Calculate new Y position with offset adjustment
    let newY = touch.clientY - chartRect.top - this.dragState.offsetY;
    
    // Constrain to chart area
    newY = Math.max(
      this.chart.dimensions.margin.top,
      Math.min(
        newY,
        chartRect.height - this.chart.dimensions.margin.bottom
      )
    );
    
    // Update position
    this.position.y = newY;
    
    // Update guide display
    this._updateGuide();
  }
  
  /**
   * Handle touch end to finish drag
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleLabelTouchEnd(event) {
    if (!this.dragState.isDragging) return;
    
    // Calculate price at the final position
    const price = this._calculatePriceAtPosition(this.position.y);
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Remove touch event listeners
    this.guideLabel.removeEventListener('touchmove', this._handleLabelTouchMove);
    this.guideLabel.removeEventListener('touchend', this._handleLabelTouchEnd);
    
    // Trigger onMoved callback if defined
    if (typeof this.options.onMoved === 'function') {
      this.options.onMoved(price, event);
    }
  }
  
  /**
   * Set the guide to a specific price
   * @param {number} price - The price to set
   * @returns {PriceGuidePlugin} - The plugin instance for chaining
   * @public
   */
  setPrice(price) {
    if (!this.chart || !this.enabled) return this;
    
    // Calculate Y position for the price
    const priceY = this.chart.y(price);
    const absoluteY = priceY + this.chart.dimensions.margin.top;
    
    // Update position
    this.position.y = absoluteY;
    
    // Update the guide and show it
    this._updateGuide();
    this._show();
    
    return this;
  }
  
  /**
   * Get the current price of the guide
   * @returns {number|null} - The current price or null if not available
   * @public
   */
  getPrice() {
    if (!this.chart || !this.visible) return null;
    
    return this._calculatePriceAtPosition(this.position.y);
  }
}

// Make available globally
window.PriceGuidePlugin = PriceGuidePlugin;