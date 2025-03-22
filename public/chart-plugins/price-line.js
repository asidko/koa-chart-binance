/**
 * Price Line Plugin
 * Displays a horizontal price line with customizable styles and optional labels.
 * The price line can be static or draggable by setting the movable option.
 */

class PriceLinePlugin extends ChartPlugin {
  /**
   * Create a new price line plugin
   * @param {Object} options - Plugin options
   */
  constructor(options = {}) {
    super({
      price: null,               // Price level to draw line at (required)
      style: 'solid',            // Line style: 'solid' or 'dashed'
      color: '#3498db',          // Line color (CSS color string)
      lineWidth: 1,              // Width of the price line
      label: null,               // Label text (if null, will use price value)
      icon: null,                // Optional Font Awesome icon name (without 'fa-' prefix)
      labelBgColor: null,        // Background color of label (defaults to line color)
      labelTextColor: 'white',   // Text color for the price label
      showBullet: false,         // Whether to show a bullet point at the end of the line
      bulletRadius: 4,           // Radius of the bullet point if shown
      position: 'right',         // Label position: 'left', 'right'
      tooltip: null,             // Optional tooltip text for hover (if null, uses label)
      movable: false,            // Whether the line can be dragged up/down by its label
      ...options
    });
    
    // Validate required option
    if (this.options.price === null) {
      console.error('PriceLinePlugin: price option is required');
    }
    
    // Set label background color to match line color if not specified
    if (this.options.labelBgColor === null) {
      this.options.labelBgColor = this.options.color;
    }
    
    // Generate a random color if 'random' is specified
    if (this.options.color === 'random') {
      this.options.color = this._getRandomColor();
      // Also update label background color if it was not explicitly set
      if (this.options.labelBgColor === null) {
        this.options.labelBgColor = this.options.color;
      }
    }
    
    // References to D3 elements
    this.line = null;
    this.bullet = null;
    this.labelElement = null;
    
    // Drag state for movable price lines
    this.dragState = {
      isDragging: false,
      startY: 0,
      offsetY: 0
    };
  }
  
  /**
   * Create a basic price line with default styling
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   * @param {number} price - Price level to draw line at
   * @param {Object} [options={}] - Optional extra configuration
   * @returns {PriceLinePlugin} New price line instance
   * @static
   */
  static createBasicPriceLine(chart, container, price, options = {}) {
    const priceLine = new PriceLinePlugin({
      price,
      // Using default style (solid) and color (#3498db)
      ...options
    });
    
    priceLine.init(chart, container);
    priceLine.render();
    
    return priceLine;
  }
  
  /**
   * Create a styled price line with an icon
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   * @param {number} price - Price level to draw line at
   * @param {Object} [options={}] - Optional configuration to override defaults
   * @returns {PriceLinePlugin} New price line instance
   * @static
   */
  static createStyledPriceLine(chart, container, price, options = {}) {
    const priceLine = new PriceLinePlugin({
      price,
      style: 'dashed',                    // Dashed line style
      color: '#e74c3c',                   // Red color
      icon: 'flag',                       // Flag icon
      label: `Target: ${price}`,          // Custom label text
      position: 'left',                   // Position label on left side
      ...options
    });
    
    priceLine.init(chart, container);
    priceLine.render();
    
    return priceLine;
  }
  
  /**
   * Generate a random color
   * @returns {string} Random hex color
   * @private
   */
  _getRandomColor() {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Initialize the plugin
   * @param {Object} chart - Chart renderer
   * @param {HTMLElement} container - Container element
   */
  init(chart, container) {
    super.init(chart, container);
    
    // Create line with style based on options
    this.line = this.chart.svg.append('line')
      .attr('class', 'price-line')
      .attr('stroke', this.options.color)
      .attr('stroke-width', this.options.lineWidth);
      
    // Apply dash pattern if style is dashed
    if (this.options.style === 'dashed') {
      this.line.attr('stroke-dasharray', '5,3');
    }
    
    // Create bullet if enabled
    if (this.options.showBullet) {
      this.bullet = this.chart.svg.append('circle')
        .attr('class', 'price-line-bullet')
        .attr('r', this.options.bulletRadius)
        .attr('fill', this.options.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1);
    }
    
    // Create label element
    this.labelElement = document.createElement('div');
    this.labelElement.className = 'price-line-label';
    this.labelElement.style.position = 'absolute';
    this.labelElement.style.backgroundColor = this.options.labelBgColor;
    this.labelElement.style.color = this.options.labelTextColor;
    this.labelElement.style.padding = '3px 8px';
    this.labelElement.style.borderRadius = '3px';
    this.labelElement.style.fontSize = '12px';
    this.labelElement.style.fontWeight = 'bold';
    this.labelElement.style.pointerEvents = 'none'; // Default is none
    this.labelElement.style.zIndex = '5';
    this.labelElement.style.transform = 'translateY(-50%)';
    this.labelElement.style.display = 'flex';
    this.labelElement.style.alignItems = 'center';
    
    // Make the label draggable if movable option is enabled
    if (this.options.movable) {
      // Enable pointer events and set cursor for draggable behavior
      this.labelElement.style.pointerEvents = 'auto';
      this.labelElement.style.cursor = 'ns-resize';
      this.labelElement.style.userSelect = 'none'; // Prevent text selection during drag
      
      // Pre-bind drag event handlers for mouse interaction
      this._boundHandleLabelMouseDown = this._handleLabelMouseDown.bind(this);
      this._boundHandleDragMouseMove = this._handleDragMouseMove.bind(this);
      this._boundHandleDragMouseUp = this._handleDragMouseUp.bind(this);
      
      // Add mousedown event listener to start dragging
      this.labelElement.addEventListener('mousedown', this._boundHandleLabelMouseDown);
      
      // Add touch support if available
      if (this.hasTouchSupport) {
        this._boundHandleLabelTouchStart = this._handleLabelTouchStart.bind(this);
        this._boundHandleLabelTouchMove = this._handleLabelTouchMove.bind(this);
        this._boundHandleLabelTouchEnd = this._handleLabelTouchEnd.bind(this);
        
        this.labelElement.addEventListener('touchstart', this._boundHandleLabelTouchStart, { passive: false });
      }
      
      // Set a tooltip to indicate the label is draggable
      this.labelElement.title = 'Drag to adjust price level';
    }
    
    // Add icon if specified
    if (this.options.icon) {
      const iconElement = document.createElement('i');
      iconElement.className = `fas fa-${this.options.icon}`;
      iconElement.style.marginRight = '5px';
      this.labelElement.appendChild(iconElement);
    }
    
    // Add label text span
    const textSpan = document.createElement('span');
    this.labelElement.appendChild(textSpan);
    
    // Add label to container
    this.container.appendChild(this.labelElement);
    
    return this;
  }
  
  /**
   * Render the price line elements
   */
  render() {
    if (!this.chart) {
      return;
    }
    
    // Get dimensions
    const { width, height, margin } = this.chart.dimensions;
    
    // Calculate Y position based on price
    const yPos = this.chart.y(this.options.price);
    
    // Update line
    this.line
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yPos)
      .attr('y2', yPos);
    
    // Update bullet if enabled
    if (this.options.showBullet) {
      // Position on right or left based on label position
      const xPos = this.options.position === 'left' ? 0 : width;
      this.bullet
        .attr('cx', xPos)
        .attr('cy', yPos);
    }
    
    // Update label
    let labelText = this.options.label;
    if (labelText === null) {
      // Use formatted price as default label
      labelText = this._formatPrice(this.options.price);
    }
    
    // Set tooltip/title if provided, otherwise use label
    const tooltipText = this.options.tooltip !== null ? this.options.tooltip : labelText;
    this.labelElement.setAttribute('title', tooltipText);
    
    // Get the text span element (second child if icon exists)
    const textSpan = this.labelElement.querySelector('span');
    if (textSpan) {
      textSpan.textContent = labelText;
    }
    
    // Position label consistently relative to chart edges
    const labelOffset = 10; // Consistent spacing from chart edge
    
    if (this.options.position === 'left') {
      // Position left of the chart area with consistent spacing
      this.labelElement.style.left = `${margin.left + labelOffset}px`;
      this.labelElement.style.right = 'auto';
      this.labelElement.style.transform = 'translateX(-100%) translateY(-50%)';
    } else {
      // Position right of the chart area with consistent spacing
      this.labelElement.style.left = 'auto';
      this.labelElement.style.right = `${margin.right + labelOffset}px`;
      this.labelElement.style.transform = 'translateY(-50%)';
    }
    
    this.labelElement.style.top = `${margin.top + yPos}px`;
    this.labelElement.style.display = 'flex';
    
    // Ensure elements are visible and on top
    this.chart.svg.node().appendChild(this.line.node());
    if (this.bullet) {
      this.chart.svg.node().appendChild(this.bullet.node());
    }
  }
  
  /**
   * Update the price for the line
   * @param {number} price - New price to set
   */
  updatePrice(price) {
    this.options.price = price;
    this.render();
  }
  
  /**
   * Clear/hide the price line elements
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

  /**
   * Handle label touch start on label to begin drag
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleLabelTouchStart(event) {
    if (!this.enabled || !this.options.movable || event.touches.length !== 1) return;
    
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
    
    // Add touch event listeners using the pre-bound functions
    this.labelElement.addEventListener('touchmove', this._boundHandleLabelTouchMove, { passive: false });
    this.labelElement.addEventListener('touchend', this._boundHandleLabelTouchEnd);
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
    let newY = touch.clientY - chartRect.top - this.chart.dimensions.margin.top - this.dragState.offsetY;
    
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
  _handleLabelTouchEnd(event) {
    if (!this.dragState.isDragging) return;
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Remove touch event listeners using the pre-bound functions
    this.labelElement.removeEventListener('touchmove', this._boundHandleLabelTouchMove);
    this.labelElement.removeEventListener('touchend', this._boundHandleLabelTouchEnd);
    
    // Trigger onMoved callback if defined
    if (typeof this.options.onMoved === 'function') {
      this.options.onMoved(this.options.price, event);
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
    const labelRect = this.labelElement.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);
    this.dragState.offsetY = event.clientY - labelCenterY;
    
    // Set drag state
    this.dragState.isDragging = true;
    this.dragState.startY = this.chart.y(this.options.price);
    
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
    let newY = event.clientY - chartRect.top - this.chart.dimensions.margin.top - this.dragState.offsetY;
    
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
  _handleDragMouseUp(event) {
    if (!this.dragState.isDragging) return;
    
    // Reset drag state
    this.dragState.isDragging = false;
    
    // Remove drag event listeners
    document.removeEventListener('mousemove', this._boundHandleDragMouseMove);
    document.removeEventListener('mouseup', this._boundHandleDragMouseUp);
    
    // Trigger onMoved callback if defined
    if (typeof this.options.onMoved === 'function') {
      this.options.onMoved(this.options.price, event);
    }
  }
}

// Make available globally
window.PriceLinePlugin = PriceLinePlugin; 