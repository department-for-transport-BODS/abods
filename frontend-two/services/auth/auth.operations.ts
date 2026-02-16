export const LOGIN_MUTATION = `mutation login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    success
    expiresAt
    maxAttempts
    unlockAt
    failedAttempts
    locked
  }
}`;

export const LOGOUT_MUTATION = `mutation logout {
  logout
}`;

export const USER_QUERY = `query user {
  user {
    currentUserId
    canViewServiceMonitoring
    canEditAllAlerts
    canViewDistances
    serviceMonitoringEmbedUrl
    flags
  }
}`;

