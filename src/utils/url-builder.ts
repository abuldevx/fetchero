/**
 * Utility class for URL construction
 */
export class URLBuilder {
  /**
   * Builds URL with segments and query parameters
   */
  static build(
    base: string,
    segments: string[],
    query?: Record<string, any>
  ): string {
    // Validate base URL
    if (!base || typeof base !== 'string') {
      throw new Error('Base URL must be a non-empty string');
    }

    try {
      const url = new URL(segments.join('/'), base);

      if (query && Object.keys(query).length > 0) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      return url.toString();
    } catch (error) {
      throw new Error(
        `Invalid URL construction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
