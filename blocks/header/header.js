import createTopMenu from './topMenu.js';
import addPopupMenuButton from './popupMenuButton.js';
import { fetchNavigationConfig, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import {
  fetchAuthConfiguration, getEnvironment,
  getInitials,
  getUserSession,
  signIn,
} from './auth.js';

export default async function decorate(block) {
  const data = await fetchNavigationConfig();
  let lastScroll = 0;
  document.addEventListener('scroll', () => {
    if (lastScroll < window.scrollY) {
      block.classList.add('hidden');
    } else {
      block.classList.remove('hidden');
    }
    lastScroll = window.scrollY;
  });

  await addPopupMenuButton(block, data);

  const sponsorIcons = data.data.header.items[0].sponsors.map((sponsor) => (
    // eslint-disable-next-line no-underscore-dangle
    `<img src='${sponsor.logo._publishUrl}' class="header-sponsor-icon" alt="${sponsor.title}"/>`
  )).join('');
  const { sponsorsLink } = data.data.header.items[0];

  const logo = data.data.header.items[0].additionalLogos[0];
  // eslint-disable-next-line no-underscore-dangle
  const logoImg = logo && logo.image ? `<img src='${logo.image._publishUrl}' style="width: 40px; height: 40px; margin-left: 16px" alt="${logo.title}"/>` : '';
  const { login } = await fetchLanguagePlaceholders();

  let userSession;
  try {
    userSession = await getUserSession();
  } catch (error) {
    console.error(error);
  }

  const loginFragment = userSession && userSession.user
    ? `<button class="profile-button">
      ${getInitials(userSession.user.fullName)}
    </button>`
    : `<button class="login-button">
      <svg focusable="false" width="16" height="16" aria-hidden="true" style="margin-left: 0px; filter: invert(26%) sepia(75%) saturate(7487%) hue-rotate(245deg) brightness(95%) contrast(107%);">
        <use xlink:href="${window.hlx.codeBasePath}/blocks/header/cibeles-sprite.svg#profile"></use>
      </svg>
      ${login}
    </button>`;

  block.appendChild(document.createRange().createContextualFragment(`
    <div style="flex: 1 0 auto; display: flex; flex-direction: row; justify-content: space-between; align-items: center">
    <!-- Logos -->
    <div style="flex: 0 0 auto; display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin: 0 9px 0 10px">
      <svg focusable="false" width="40" height="40">
        <use xlink:href="${window.hlx.codeBasePath}/blocks/header/cibeles-sprite.svg#logo-rm"></use>
      </svg>
      <div style="width: 1px; height: 32px; border-right: 1px solid #e1e5ea; margin-left: 9px"></div>
      ${logoImg}
    </div>
      ${createTopMenu(data)}
      <div class="header-left-section">
        ${sponsorIcons}
        <a class="header-sponsors-link" href="${sponsorsLink?.url}">
          <svg focusable="false" width="24" height="24" style="margin-right: 9px; filter: invert(75%) sepia(18%) saturate(182%) hue-rotate(178deg) brightness(95%) contrast(87%);">
            <use xlink:href="${window.hlx.codeBasePath}/blocks/header/cibeles-sprite.svg#dots-v"></use>
          </svg>
        </a>
        ${loginFragment}
      </div>
    </div>
  `));

  block.querySelector('.login-button')?.addEventListener('click', async () => {
    console.debug('sign in logic');
    // 2-User lands on Franklin page without prev sign-in.
    // In this case you need to integrate 2 features:
    // 2A-Integrate with login => 3.1 -> 3.3 from the guide
    try {
      const authConfig = await fetchAuthConfiguration(getEnvironment());
      signIn(authConfig.signInBaseUrl, { clientId: authConfig?.socialProviders?.rm });
    } catch (error) {
      console.error(error);
    }
  });
}
