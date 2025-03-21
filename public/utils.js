// ===================================================
// URL Parameter Handler
// ===================================================
/**
 * Handles URL parameter operations
 */
class URLHandler {
    /**
     * Load parameters from URL
     * @param {ChartParams} defaults - Default parameters to use if not in URL
     * @returns {{params: ChartParams, thresholdRange: Partial<ThresholdRange>}} Parsed parameters and threshold range
     */
    static loadFromUrl(defaults) {
        const urlParams = new URLSearchParams(window.location.search);
        /** @type {ChartParams} */
        const params = { ...defaults };

        // Get parameters with validation
        if (urlParams.has('symbol')) {
            params.symbol = urlParams.get('symbol');
        }

        if (urlParams.has('interval')) {
            params.interval = urlParams.get('interval');
        }

        if (urlParams.has('limit')) {
            const parsedLimit = parseInt(urlParams.get('limit'), 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                params.limit = parsedLimit;
            }
        }

        if (urlParams.has('threshold')) {
            const parsedThreshold = parseFloat(urlParams.get('threshold'));
            if (!isNaN(parsedThreshold) && parsedThreshold >= 0) {
                params.threshold = parsedThreshold;
            }
        }

        // Get threshold slider settings
        /** @type {Partial<ThresholdRange>} */
        const thresholdRange = {};

        if (urlParams.has('thresholdMin')) {
            const min = parseFloat(urlParams.get('thresholdMin'));
            if (!isNaN(min)) {
                thresholdRange.min = min;
            }
        }

        if (urlParams.has('thresholdMax')) {
            const max = parseFloat(urlParams.get('thresholdMax'));
            if (!isNaN(max)) {
                thresholdRange.max = max;
            }
        }

        if (urlParams.has('thresholdStep')) {
            const step = parseFloat(urlParams.get('thresholdStep'));
            if (!isNaN(step)) {
                thresholdRange.step = step;
            }
        }

        return { params, thresholdRange };
    }

    /**
     * Update URL with current parameters without page reload
     * @param {ChartParams} params - Chart parameters to include in URL
     * @param {ThresholdRange} thresholdRange - Threshold range settings
     * @returns {string} New URL
     */
    static updateUrl(params, thresholdRange) {
        const urlParams = new URLSearchParams();

        // Add primary parameters
        urlParams.set('symbol', params.symbol);
        urlParams.set('interval', params.interval);
        urlParams.set('limit', params.limit.toString());
        urlParams.set('threshold', params.threshold.toString());

        // Add threshold slider settings if they differ from defaults
        if (thresholdRange.min !== 0) {
            urlParams.set('thresholdMin', thresholdRange.min.toString());
        }

        if (thresholdRange.max !== 1000) {
            urlParams.set('thresholdMax', thresholdRange.max.toString());
        }

        if (thresholdRange.step !== 1) {
            urlParams.set('thresholdStep', thresholdRange.step.toString());
        }

        // Update URL without reloading page
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        return newUrl;
    }
}

// ===================================================
// SERVICES - API communication
// ===================================================
/**
 * Service for fetching data from API
 */
class ApiService {
    /**
     * Fetch price data from API
     * @param {string} symbol - Trading pair symbol
     * @param {string} interval - Time interval
     * @param {number} limit - Number of data points
     * @returns {Promise<PriceDataPoint[]>} Price data
     * @throws {Error} If API request fails
     */
    static async fetchPriceData(symbol, interval, limit) {
        const apiUrl = `/api/btc-price?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }
}

// Add ChartUtils object to the existing utils.js file
/**
 * Chart-specific utility functions
 */
const ChartUtils = {
    /**
     * Format price for display based on magnitude
     * @param {number} price - The price to format
     * @param {number} [customDecimals] - Optional custom decimal places
     * @returns {string} Formatted price
     */
    formatPrice(price, customDecimals) {
        const magnitude = price > 0 ? Math.pow(10, Math.floor(Math.log10(price))) : 1;

        let decimals = customDecimals;
        if (decimals === undefined) {
            decimals = 2;
            if (magnitude < 1) decimals = 4;
            else if (magnitude < 10) decimals = 3;
            else if (magnitude < 100) decimals = 2;
            else decimals = 0;
        }

        return `${price.toFixed(decimals)}`;
    },

    /**
     * Calculate the ideal threshold slider range based on price
     * @param {number} lastPrice - The latest price value
     * @returns {ThresholdRange} Range settings for threshold slider
     */
    calculateThresholdRange(lastPrice) {
        const magnitude = lastPrice > 0 ? Math.pow(10, Math.ceil(Math.log10(lastPrice))) : 10;
        return {
            min: 0,
            max: magnitude * 0.10,
            step: magnitude * 0.0001
        };
    },

    /**
     * Format date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        return d3.timeFormat("%d %b %H:%M")(date);
    },

    /**
     * Calculate percentage difference between two prices
     * @param {number} price1 - First price
     * @param {number} price2 - Second price
     * @returns {number} Percentage difference
     */
    calculatePercentDifference(price1, price2) {
        if (price2 === 0) return 0;
        return ((price1 - price2) / price2) * 100;
    },

    /**
     * Format percentage with +/- sign
     * @param {number} percent - Percentage value
     * @param {number} [decimals=2] - Number of decimal places
     * @returns {string} Formatted percentage
     */
    formatPercent(percent, decimals = 2) {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(decimals)}%`;
    }
};

// Make available globally
window.ChartUtils = ChartUtils;
