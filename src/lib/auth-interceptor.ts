/**
 * Setup global fetch interceptor to handle 401 errors
 * Call this once in your root layout or app initialization
 */
export function setupAuthInterceptor(onUnauthorized: () => void) {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // Check if response is 401 Unauthorized
    if (response.status === 401) {
      console.log('Unauthorized request detected, clearing auth...');
      
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Call callback (usually to redirect to login)
      onUnauthorized();
    }
    
    return response;
  };
}
