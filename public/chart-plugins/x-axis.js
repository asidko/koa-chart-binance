/**
 * X Axis Controller
 * Provides adaptive tick count and date formatting for X axis.
 */
(function(global) {
  class XAxisController {
    /**
     * Calculate base tick count based on width.
     * @param {number} width
     * @returns {number} base tick count
     */
    static calculateBaseTicks(width) {
      let baseTicks;
      if (width < 480) {
        baseTicks = Math.max(5, Math.floor(width / 60));
      } else if (width < 768) {
        baseTicks = Math.max(4, Math.floor(width / 90));
      } else {
        baseTicks = Math.max(4, Math.floor(width / 100));
      }
      return baseTicks;
    }

    /**
     * Get format string for dates based on range and width.
     * @param {number} width
     * @param {number} rangeMs - time range in milliseconds
     * @returns {string} D3 time format pattern
     */
    static getFormatString(width, rangeMs) {
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      if (rangeMs > twoDaysMs) {
        return "%b %d";
      }
      const oneHourMs = 60 * 60 * 1000;
      if (rangeMs > oneHourMs) {
        return width < 768 ? "%d %b %H" : "%b %d %H:%M";
      }
      return "%H:%M";
    }

    /**
     * Render the X axis with adaptive ticks and formatting.
     * @param {d3.Selection} axisSelection - D3 axis group selection
     * @param {d3.ScaleTime} scale - D3 time scale
     * @param {Object} dimensions - Chart dimensions { width, height, margin }
     */
    static render(axisSelection, scale, dimensions) {
      const { width } = dimensions;
      const domain = scale.domain();
      const rangeMs = domain[1] - domain[0];
      const factor = width < 480 ? 1.5 : (width < 768 ? 1.2 : 1);
      const tickCount = Math.round(this.calculateBaseTicks(width) * factor);
      const formatString = this.getFormatString(width, rangeMs);
      const formatFn = d3.timeFormat(formatString);

      // Determine appropriate time unit and interval to avoid duplicate labels
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      const oneHourMs = 60 * 60 * 1000;
      let unit, unitMs;
      if (rangeMs > twoDaysMs) {
        unit = d3.timeDay;
        unitMs = 24 * 60 * 60 * 1000;
      } else if (rangeMs > oneHourMs) {
        unit = d3.timeHour;
        unitMs = 60 * 60 * 1000;
      } else {
        unit = d3.timeMinute;
        unitMs = 60 * 1000;
      }
      const numUnits = rangeMs / unitMs;
      const interval = Math.max(1, Math.ceil(numUnits / tickCount));

      axisSelection.call(
        d3.axisBottom(scale)
          .ticks(unit.every(interval))
          .tickFormat(formatFn)
      );
    }
  }

  global.XAxisController = XAxisController;
})(window);
