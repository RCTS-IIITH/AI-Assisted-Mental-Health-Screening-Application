export const isTokenExpired = () => {
    const expirationTime = localStorage.getItem('token_expiration');
    if (!expirationTime) return true;
    
    return Date.now() > parseInt(expirationTime);
  };
  
  export const getAuthToken = () => {
    if (isTokenExpired()) {
      return null;
    }
    return localStorage.getItem('access_token');
  };