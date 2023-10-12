import { DOCROOT, LANG_LOCALE, getLocale } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/lib-franklin.js';

const RM_B2C = 'rm-b2c';

export function getEnvironment() {
  if (window.location.hostname === 'localhost') {
    return 'stg'; // todo: 'dev' is it used anywhere?
  }
  return window.location.hostname.includes('--realmadrid--') && window.location.hostname.includes('.hlx.') ? 'stg' : 'prd';
}

export async function fetchAuthConfiguration(env = 'prd') {
  const placeholders = await fetchPlaceholders(DOCROOT);
  return {
    apiBaseUrl: placeholders[`${env}RmApiBaseUrl`],
    signInBaseUrl: placeholders[`${env}RmSignInBaseUrl`],
    apiSubscriptionKey: placeholders[`${env}RmApiSubscriptionKey`],
    socialProviders: {
      google: placeholders.googleClientId,
      apple: placeholders.appleClientId,
      facebook: placeholders.facebookClientId,
      rm: placeholders[`${env}RmClientId`],
    },
  };
}

const ENV = getEnvironment();

function buildRefreshTokenUrl(apiBaseUrl, { socialProvider, sourceType, fanType }) {
  const url = new URL(apiBaseUrl);

  url.pathname = `/rm-auth-server-${ENV}/b2c-signin/oauth2/${socialProvider === 'facebook' ? 'token' : 'refresh'}`;
  Object.entries({
    sourceType,
    socialProvider,
    fanType,
  }).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return url.href;
}

/**
 * Redirects to RM sign in page, using the current url as redirect url, language, and workflow.
 * @param signInBaseUrl the base url of the sign in page
 * @param workflow sign in workflow to use, defaults to 'register-free',
 * other options are: 'register-premium', 'register-junior', 'upgrade'
 * @param clientId client id to use, defaults to the one associated to rm
 */
export function signIn(signInBaseUrl, { workflow = 'register-free', clientId } = {}) {
  const language = getLocale() === LANG_LOCALE.en ? LANG_LOCALE.en : LANG_LOCALE.es;
  const redirectUrl = window.location.origin + window.location.pathname;
  const bypassData = new URLSearchParams(window.location.search).toString();

  const url = `${signInBaseUrl}/#/sign-in/user`;
  const searchParams = new URLSearchParams();
  Object.entries({
    workflow,
    language,
    ...(clientId ? { behalfClientId: clientId } : {}),
    ...(bypassData ? { bypassData } : {}),
    redirectUrl,
  }).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  window.location.href = `${url}?${searchParams.toString()}`;
}

/**
 * Parse URL for parameters returned from RM sign in page.
 * @param url URL to parse
 * @returns {{fanType: string, language: string, socialKey: string, refreshToken: string}}
 */
function parseSignInRedirectResponse(url) {
  const urlParams = new URLSearchParams(url.search);

  return {
    refreshToken: urlParams.get('refreshToken'),
    fanType: urlParams.get('fanType'),
    language: urlParams.get('language'),
    socialKey: urlParams.get('socialKey'),
  };
}

function getStoredUserAuthToken() {
  const rmStorage = localStorage.getItem('RM');
  if (rmStorage) {
    try {
      const rmStorageJson = JSON.parse(rmStorage);
      return rmStorageJson[RM_B2C]?.userAuthToken;
    } catch (error) {
      console.error('Failed to parse RM local storage item into JSON', error);
    }
  }
  return null;
}

function updateAccessTokenInStorage(userAuthToken) {
  try {
    const rmStorage = JSON.parse(localStorage.getItem('RM')) || {};
    const rmB2CStorage = rmStorage[RM_B2C] || {};
    rmB2CStorage.userAuthToken = userAuthToken;

    const updatedRMStorage = {
      ...rmStorage,
      [RM_B2C]: rmB2CStorage,
    };
    localStorage.setItem('RM', JSON.stringify(updatedRMStorage));
    return updatedRMStorage;
  } catch (error) {
    console.error('Failed to parse RM local storage item into JSON and update', error);
    return null;
  }
}

/**
 * Calls POST /rm-auth-server-dev/b2c-signin/oauth2/{refresh|token}
 * ?socialProvider={socialKey}&sourceType={sourceType}
 * with refresh token and client id as form data
 * in order to exchange the refresh token for an access token.
 * @param refreshToken refresh token to exchange
 * @param socialKey social provider in case of social login (google, apple, facebook)
 * @param fanType type of fan (registered, member, paidfan, employee)
 * @param sourceType source device type (web, ios, and)
 * @returns {Promise<any>} rejects, if an error occurred, or on successful response,
 * resolves with an access token: { accessToken, expiresIn, refreshToken, tokenType }
 */
async function exchangeRefreshTokenForAccessToken({
  refreshToken, socialKey, fanType, sourceType,
}) {
  const authConfig = await fetchAuthConfiguration(ENV);
  const socialProvider = socialKey || 'rm';
  const clientId = authConfig?.socialProviders?.[socialProvider];

  const refreshTokenUrl = buildRefreshTokenUrl(authConfig.apiBaseUrl, {
    socialProvider,
    sourceType: sourceType || 'web',
    fanType: fanType || 'registered',
  });

  if (!refreshToken) {
    return Promise.reject(new Error('Failed to exchange refresh token for access token: missing refreshToken'));
  }
  if (!clientId) {
    return Promise.reject(new Error(`Failed to exchange refresh token for access token: missing clientId for socialProvider: ${socialProvider}`));
  }

  const response = await fetch(refreshTokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({
      clientId,
      refreshToken,
    }),
  });

  if (response.status === 401) {
    const userAuthToken = getStoredUserAuthToken();
    if (userAuthToken) {
      userAuthToken.refreshToken = null;
      updateAccessTokenInStorage(userAuthToken);
    }
  }

  if (response.status >= 400) {
    const responseText = await response.text();
    return Promise.reject(new Error(`Failed to exchange refresh token for socialKey: 
      ${socialKey}, ${response.status}: ${responseText}`));
  }

  return response.json();
}

/**
 * Calls /rm-ms-account-prd/api/v1/accounts/me to retrieve the user account details.
 * @param accessToken access token to be used as authorization for the API call
 * @returns {Promise<any>} rejects, if an error occurred, or on successful response,
 * resolves with the user account details: { data: [{ name, ...} ] }
 */
async function getAccountMe(accessToken) {
  const authConfig = await fetchAuthConfiguration(ENV);
  const accountMeUrl = `${authConfig.apiBaseUrl}/rm-ms-account-${ENV}/api/v1/accounts/me`;

  if (!authConfig.apiSubscriptionKey) {
    return Promise.reject(new Error('Failed to get the user account: missing apiSubscriptionKey in config'));
  }

  const response = await fetch(accountMeUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Ocp-Apim-Subscription-Key': authConfig.apiSubscriptionKey,
    },
  });

  if (response.status === 401) {
    const userAuthToken = getStoredUserAuthToken();
    if (userAuthToken) {
      userAuthToken.accessToken = null;
      updateAccessTokenInStorage(userAuthToken);
    }
  }

  if (response.status >= 400) {
    const responseText = await response.text();
    return Promise.reject(new Error(`Failed to get the user account ${response.status}: ${responseText}`));
  }

  return response.json();
}

function refreshTokenPeriodically(seconds) {
  window.setInterval(async () => {
    try {
      let userAuthToken = getStoredUserAuthToken();
      let signInResponse = null;
      if (!userAuthToken || !userAuthToken.refreshToken) {
        console.warn('No refresh token found in local storage');
        signInResponse = parseSignInRedirectResponse(new URL(window.location.href));
        if (!signInResponse || !signInResponse.refreshToken) {
          console.warn('No refresh token found in the URL');
          return;
        }
      }

      userAuthToken = await exchangeRefreshTokenForAccessToken({
        refreshToken: userAuthToken.refreshToken || signInResponse?.refreshToken,
      });
      updateAccessTokenInStorage(userAuthToken);
    } catch (e) {
      console.error('Failed to refresh token', e);
    }
  }, seconds * 1000);
}

export async function getUserSession() {
  let userAuthToken = getStoredUserAuthToken();

  let signInResponse = {};
  if (!userAuthToken || !userAuthToken.accessToken) {
    signInResponse = parseSignInRedirectResponse(new URL(window.location.href));
    if (!signInResponse.refreshToken) {
      console.warn('No refresh token found in the URL');
      return null;
    }

    userAuthToken = await exchangeRefreshTokenForAccessToken(signInResponse);

    updateAccessTokenInStorage(userAuthToken);
  }

  if (!userAuthToken || !userAuthToken.accessToken) {
    return null;
  }

  refreshTokenPeriodically(userAuthToken.expiresIn);

  const accountMeResponse = await getAccountMe(userAuthToken.accessToken);
  const user = accountMeResponse?.data?.[0];

  return {
    signInResponse,
    userAuthToken,
    user,
  };
}

export function getInitials(str) {
  if (!str) {
    return '';
  }
  return str.split(' ').map((word) => word[0].toUpperCase()).join('');
}
