import { readBlockConfig, loadBlock, decorateIcons } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  // get config entries
  const cfg = readBlockConfig(block);

  const {
    pretitle, title, promo, desktop, navigation, mobile,
  } = cfg;
  const promoTitle = cfg['promo-title'];
  const tourCategory = cfg['tour-category'];
  const tourSubCategory = cfg['tour-sub-category'];

  // create basic dom structure
  const dom = document.createRange().createContextualFragment(`
      <div class='content'>
        <div class='content-wrapper'>
        </div>
      </div>
      <div class='background'>
      </div>
  `);

  // shortcuts
  const content = dom.querySelector('.content');
  const contentWrapper = dom.querySelector('.content-wrapper');
  const background = dom.querySelector('.background');

  // if a pretitle is defined
  if (pretitle) {
    const preTitleElem = document.createElement('p');
    preTitleElem.classList.add('pretitle');
    preTitleElem.textContent = pretitle;
    contentWrapper.append(preTitleElem);
  }

  // if title is defined
  if (title) {
    const titleElem = document.createElement('h1');
    titleElem.textContent = title;
    contentWrapper.append(titleElem);
  }

  // if navigation is defined
  if (navigation) {
    const resp = await fetch(`${navigation}.plain.html`);
    if (resp.ok) {
      // create the nav element
      const divNavContainer = document.createElement('div');
      divNavContainer.classList.add('navcontainer');
      const navElem = document.createElement('nav');
      divNavContainer.append(navElem);
      contentWrapper.append(divNavContainer);

      // get the navigation table from the fragment
      const navEntries = document.createRange().createContextualFragment(await resp.text()).querySelector('.navigation');
      // add entries
      [...navEntries.children].forEach((navEntry) => {
        // link
        const a = navEntry.children[1].children[0];
        const href = a.getAttribute('href');

        // if its the current page
        if (href.endsWith(document.location.pathname)) {
          a.classList.add('selected');
        }
        // if its an external link, append external icon
        if (href.startsWith('http')) {
          const extIcon = document.createElement('span');
          extIcon.classList.add('icon', 'icon-open-link');
          a.append(extIcon);
        }

        // prepend svg icon
        a.prepend(navEntry.children[0].children[0]);
        navElem.append(a);
        decorateIcons(navElem);
      });
    }
  }

  // if promo text and/or promo title is defined
  if (promo || promoTitle) {
    const promoElem = document.createElement('p');
    promoElem.classList.add('promo');
    if (promoTitle) {
      const strong = document.createElement('strong');
      strong.textContent = promoTitle;
      promoElem.append(strong);
    }
    if (promo) {
      promoElem.append(` ${promo}`);
    }
    contentWrapper.append(promoElem);
  }

  // if background is defined
  if (desktop) {
    // get the picture element
    const imageName = desktop.substring(desktop.lastIndexOf('media_'), desktop.indexOf('?'));
    const picture = block.querySelector(`:scope img[src*="${imageName}"`).parentElement;
    picture.classList.add('desktop');
    background.append(picture);
  }

  if (mobile) {
    // get the picture element
    const imageName = mobile.substring(mobile.lastIndexOf('media_'), mobile.indexOf('?'));
    const picture = block.querySelector(`:scope img[src*="${imageName}"`).parentElement;
    picture.classList.add('mobile');
    background.append(picture);
  }

  block.textContent = '';
  block.append(dom);

  // what main tour categories are offered
  if (tourCategory) {
    const ticketCardListBlock = document.createRange().createContextualFragment(`
      <div class='ticket-card-list hero' data-block-name='ticket-card-list' >
        <div>
          <div>${tourCategory}</div>
        </div>
      </div>
    `);

    await loadBlock(ticketCardListBlock.firstElementChild);
    contentWrapper.append(ticketCardListBlock);
  }

  // if sub categories are defined
  if (tourSubCategory) {
    const subCatContainer = document.createRange().createContextualFragment(`
    <div class='sub-wrapper'>
      <h2 class='sub-cat-title'>
        <span class='sub-cat-subtitle'>También podéis elegir</span>
        VISITAS COMBINADAS
      </h2>
      <div class='ticket-card-list hero sub' data-block-name='ticket-card-list' >
        <div>
          <div>${tourSubCategory}</div>
        </div>
      </div>
    </div>
    `);
    content.append(subCatContainer);

    await loadBlock(content.querySelector('.ticket-card-list.hero.sub'));
  }
}
