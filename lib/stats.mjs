/**
 * CheckLogs Statistics API - ES Module version
 * Handles statistics and analytics for logs
 */
export default class CheckLogsStats {
  /**
   * Create a new stats instance
   * @param {CheckLogsClient} client - CheckLogs client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Get comprehensive statistics for the application
   * @returns {Promise<Object>} Statistics data
   */
  async getStats() {
    try {
      const url = `${this.client.baseURL}?stats=1`;
      const response = await this.client.httpClient.get(url);
      
      return response.data;
    } catch (error) {
      this.client._handleError(error);
    }
  }

  /**
   * Get log count by level
   * @returns {Promise<Array>} Array of {level, count} objects
   */
  async getStatsByLevel() {
    const stats = await this.getStats();
    return stats.data.stats_by_level || [];
  }

  /**
   * Get daily statistics for the last 30 days
   * @returns {Promise<Array>} Array of {date, count} objects
   */
  async getDailyStats() {
    const stats = await this.getStats();
    return stats.data.daily_stats || [];
  }

  /**
   * Get total number of logs
   * @returns {Promise<number>} Total log count
   */
  async getTotalLogs() {
    const stats = await this.getStats();
    return stats.data.total_logs || 0;
  }

  /**
   * Get today's log count
   * @returns {Promise<number>} Today's log count
   */
  async getLogsToday() {
    const stats = await this.getStats();
    return stats.data.logs_today || 0;
  }

  /**
   * Get application information
   * @returns {Promise<Object>} Application info {id, name}
   */
  async getApplicationInfo() {
    const stats = await this.getStats();
    return stats.data.application || {};
  }

  /**
   * Get error rate (percentage of error + critical logs)
   * @returns {Promise<number>} Error rate as percentage
   */
  async getErrorRate() {
    const statsByLevel = await this.getStatsByLevel();
    
    let totalLogs = 0;
    let errorLogs = 0;
    
    statsByLevel.forEach(stat => {
      totalLogs += stat.count;
      if (stat.level === 'error' || stat.level === 'critical') {
        errorLogs += stat.count;
      }
    });
    
    return totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
  }

  /**
   * Get most frequent log level
   * @returns {Promise<Object>} {level, count, percentage}
   */
  async getMostFrequentLevel() {
    const statsByLevel = await this.getStatsByLevel();
    
    if (statsByLevel.length === 0) {
      return null;
    }
    
    const mostFrequent = statsByLevel.reduce((max, current) => {
      return current.count > max.count ? current : max;
    });
    
    const totalLogs = statsByLevel.reduce((sum, stat) => sum + stat.count, 0);
    const percentage = totalLogs > 0 ? (mostFrequent.count / totalLogs) * 100 : 0;
    
    return {
      level: mostFrequent.level,
      count: mostFrequent.count,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Get logs per day average
   * @returns {Promise<number>} Average logs per day
   */
  async getAverageLogsPerDay() {
    const dailyStats = await this.getDailyStats();
    
    if (dailyStats.length === 0) {
      return 0;
    }
    
    const totalLogs = dailyStats.reduce((sum, day) => sum + day.count, 0);
    return Math.round((totalLogs / dailyStats.length) * 100) / 100;
  }

  /**
   * Get peak day (day with most logs in the last 30 days)
   * @returns {Promise<Object>} {date, count}
   */
  async getPeakDay() {
    const dailyStats = await this.getDailyStats();
    
    if (dailyStats.length === 0) {
      return null;
    }
    
    return dailyStats.reduce((max, current) => {
      return current.count > max.count ? current : max;
    });
  }

  /**
   * Get trend analysis (comparing last 7 days vs previous 7 days)
   * @returns {Promise<Object>} Trend analysis data
   */
  async getTrend() {
    const dailyStats = await this.getDailyStats();
    
    if (dailyStats.length < 14) {
      return {
        trend: 'insufficient_data',
        change: 0,
        last_week: 0,
        previous_week: 0
      };
    }
    
    // Sort by date (most recent first)
    const sortedStats = dailyStats.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const lastWeekLogs = sortedStats.slice(0, 7).reduce((sum, day) => sum + day.count, 0);
    const previousWeekLogs = sortedStats.slice(7, 14).reduce((sum, day) => sum + day.count, 0);
    
    const change = previousWeekLogs > 0 
      ? ((lastWeekLogs - previousWeekLogs) / previousWeekLogs) * 100 
      : 0;
    
    let trend = 'stable';
    if (Math.abs(change) > 20) {
      trend = change > 0 ? 'increasing' : 'decreasing';
    }
    
    return {
      trend,
      change: Math.round(change * 100) / 100,
      last_week: lastWeekLogs,
      previous_week: previousWeekLogs
    };
  }

  /**
   * Get comprehensive analytics summary
   * @returns {Promise<Object>} Complete analytics summary
   */
  async getSummary() {
    const [
      baseStats,
      errorRate,
      mostFrequent,
      avgPerDay,
      peakDay,
      trend
    ] = await Promise.all([
      this.getStats(),
      this.getErrorRate(),
      this.getMostFrequentLevel(),
      this.getAverageLogsPerDay(),
      this.getPeakDay(),
      this.getTrend()
    ]);
    
    return {
      ...baseStats.data,
      analytics: {
        error_rate: errorRate,
        most_frequent_level: mostFrequent,
        average_logs_per_day: avgPerDay,
        peak_day: peakDay,
        trend: trend
      }
    };
  }
}