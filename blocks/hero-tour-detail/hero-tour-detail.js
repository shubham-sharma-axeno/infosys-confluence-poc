/* eslint-disable no-unused-expressions */
import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import {
  getLanguage, bindSwipeToElement, fetchLanguagePlaceholders, TOUR_LANGUAGE_HOME_PATH, fetchTours,
} from '../../scripts/scripts.js';

// translate to the next/previous slide
function slideLeftOrRight(direction, slidesContainer, previous, next) {
  // get currently active slide
  const activeSlide = slidesContainer.querySelector('[aria-selected="true"]');
  // check if there is a previous or next slide
  const nextSlide = direction === 'left' ? activeSlide.previousElementSibling : activeSlide.nextElementSibling;
  if (nextSlide) {
    // get 0 index based slide number
    const slideNum = parseInt(nextSlide.dataset.slide, 10);
    // update aria labels
    activeSlide.setAttribute('aria-selected', 'false');
    nextSlide.setAttribute('aria-selected', 'true');
    // do the transform
    const transform = `transform: translate3d(${slideNum * (document.body.dir === 'rtl' ? 100 : -100)}%, 0px, 0px); transition-duration: 300ms;`;
    slidesContainer.style.cssText = transform;
    // update the button stati
    slideNum === 0 ? previous.classList.add('disabled') : previous.classList.remove('disabled');
    slideNum === slidesContainer.querySelectorAll('.slide').length - 1 ? next.classList.add('disabled') : next.classList.remove('disabled');
  }
}

// add carousel buttons and events
function initCarousel(block) {
  // we find first the main element in order to support heros embedded as fragments.
  const carousel = block.closest('main').querySelector('.section.hero-tour-detail-container .carousel');
  const slidesContainer = carousel.querySelector('.slides');

  // create previous and next buttons
  const previous = document.createElement('div');
  previous.classList.add('arrow', 'previous', 'disabled');
  previous.setAttribute('tabindex', '0');
  previous.setAttribute('role', 'button');
  previous.setAttribute('aria-label', 'Previous Slide');
  previous.setAttribute('aria-disabled', 'true');
  const iconPrev = document.createElement('span');
  iconPrev.classList.add('icon', 'icon-arrow-right');
  previous.append(iconPrev);

  const next = document.createElement('div');
  next.classList.add('arrow', 'next');
  next.setAttribute('tabindex', '0');
  next.setAttribute('role', 'button');
  next.setAttribute('aria-label', 'Next Slide');
  next.setAttribute('aria-disabled', 'false');
  const iconNext = document.createElement('span');
  iconNext.classList.add('icon', 'icon-arrow-right');
  next.append(iconNext);

  carousel.append(previous);
  carousel.append(next);
  decorateIcons(carousel);

  // left and right swipe events
  bindSwipeToElement(block);
  block.addEventListener('swipe-RTL', () => {
    slideLeftOrRight('right', slidesContainer, previous, next);
  });

  block.addEventListener('swipe-LTR', () => {
    slideLeftOrRight('left', slidesContainer, previous, next);
  });

  // button click events
  carousel.querySelector('.arrow.previous').addEventListener('click', () => {
    slideLeftOrRight('left', slidesContainer, previous, next);
  });

  carousel.querySelector('.arrow.next').addEventListener('click', () => {
    slideLeftOrRight('right', slidesContainer, previous, next);
  });
}

// initialize the carousel main structure
function buildCarousel(cfg) {
  // set up carousel structure
  const carousel = document.createRange().createContextualFragment(`
  <div class='carousel'>
    <div class='slides'>
    </div>
  </div>
  `);

  // add the carousel entries
  const slidesContainer = carousel.querySelector('.carousel .slides');
  cfg.desktop.forEach((entry, i) => {
    const eager = i === 0;
    const slide = document.createElement('div');
    slide.classList.add('slide');
    slide.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    slide.dataset.slide = i;

    // add video or image
    if (entry[1] === 'video') {
      const video = document.createElement('video');
      video.muted = true;
      video.toggleAttribute('autoplay', true);
      video.toggleAttribute('loop', true);
      video.toggleAttribute('playsinline', true);
      const source = document.createElement('source');
      source.setAttribute('src', entry[2]);
      source.setAttribute('type', 'video/mp4');
      video.append(source);
      slide.append(video);
    } else {
      const image = createOptimizedPicture(entry[2], entry[0], eager, [{ width: '2000' }]);
      slide.append(image);
    }

    // add the title
    const title = document.createElement('h2');
    title.classList.add('title');

    title.append(entry[0]);
    slide.append(title);

    slidesContainer.append(slide);
  });

  return carousel;
}

// reads block config grouped by sections
function readBlockConfigBySections(block) {
  const cfg = {};

  let sectionFlag = null;

  [...block.children].forEach((row) => {
    const section = row.firstElementChild.innerText;
    // if we reached mobile section header
    if (section === 'Mobile Background') {
      sectionFlag = 'mobile';
      cfg.mobile = {};
      return;
    }

    // if we reached desktop section header
    if (section === 'Desktop Carousel') {
      sectionFlag = 'desktop';
      cfg.desktop = [];
      return;
    }
    // if its an entry in mobile section
    if (sectionFlag === 'mobile') {
      // title
      cfg.mobile.title = row.children[0].innerText.trim();
      // image
      cfg.mobile.image = row.children[1].querySelector(':scope img').getAttribute('src');
      return;
    }
    // if its an entry in desktop section
    if (sectionFlag === 'desktop') {
      const slide = [];
      // title of the slide
      slide[0] = row.children[0].innerText.trim();
      // url for image or video
      const a = row.children[1].querySelector(':scope a');
      if (a) {
        slide[1] = 'video';
        slide[2] = a.getAttribute('href');
      } else {
        slide[1] = 'image';
        slide[2] = row.children[1].querySelector(':scope img').getAttribute('src');
      }
      cfg.desktop.push(slide);
    }
  });
  return cfg;
}

export default async function decorate(block) {
  // find the tour info for this page
  const tourInfo = (await fetchTours()).filter((tour) => tour['Detail Page'] === document.location.pathname);

  // if no tours are found start empty
  if (tourInfo.length === 0) tourInfo[0] = {};

  // extract tour info (non existing values are '', except when no tour was found => undefined)
  const {
    Description = 'Tour Description',
    Price = '0.00',
    Subtitle = 'Tour Subtitle',
  } = tourInfo[0];
  const oldPrice = tourInfo[0]['Old Price'];
  const descriptionTitle = tourInfo[0]['Description Title'] ?? 'Description Title';
  const tourName = tourInfo[0]['Tour Name'] ?? 'Tour Title';
  const priceSubtitle = tourInfo[0]['Price Subtitle'];
  const buyLink = tourInfo[0]['Buy Link'];
  const ticketLabel = tourInfo[0]['Ticket Label'];
  const buttonText = tourInfo[0]['Button Text'] ?? 'Button Text';
  const comboImage = tourInfo[0]['Combo Image'] ?? '';
  const comboName = tourInfo[0]['Combo Name'] ?? '';

  // read config from block
  const cfg = readBlockConfigBySections(block);

  // breadcrumb title must be extracted from parent tour page navigation
  // as it differs from title set on the parent page itself
  const resp = await fetch(`${TOUR_LANGUAGE_HOME_PATH[getLanguage()]}/fragments/tour-navigation.plain.html`);
  let groupName = 'Tour Group';
  let parentURL = '/';
  if (resp.ok) {
    parentURL = document.location.pathname;
    parentURL = parentURL.substring(0, parentURL.lastIndexOf('/'));
    groupName = new DOMParser().parseFromString(await resp.text(), 'text/html')
      .querySelector(`.navigation a[href='${parentURL}']`)?.innerText;
  }

  // get placeholders (non-existing values are undefined)
  const placeholders = await fetchLanguagePlaceholders();
  const {
    from = 'desde',
  } = placeholders;

  // dom structure
  const dom = document.createRange().createContextualFragment(`
    <div class='content'>
      <a href='${parentURL}'class='breadcrumb'><span class='icon icon-arrow-right'></span>${groupName}</a>
      <div class='product'>
        ${ticketLabel ? `<span class='label'><b>${ticketLabel}</b></span>` : ''}
        <div class='product-name'>
        </div>
        <div class='buy-info'>
          <div class='price'>
            <p>
              ${from}${oldPrice ? `&nbsp<del>${oldPrice}€</del>` : ''}
              <span class='amount'>${Price}</span>
              <span class='currency'>€</span>
              ${priceSubtitle ? `<span class='subtitle'>${priceSubtitle}</span>` : ''}
            </p>
          </div>
          <div class='button-buy'>
            <a href='${buyLink}' target='_blank' rel='noreferrer' >${buttonText}</a>
          </div>
        </div>
      </div>
      <div class='product-info'>
        <div class='description-container'>
          <p class='description-title'>${descriptionTitle}</p>
          <p class='description'>${Description}</p>
        </div>
      </div>
    </div>
    <div class='background'>
    </div>
  `);

  // add the optimized background image
  const backgroundImage = createOptimizedPicture(cfg.mobile.image, cfg.mobile.title, true, [{ width: '960' }]);
  dom.querySelector('.background').append(backgroundImage);

  // build carousel dom
  const carousel = buildCarousel(cfg);

  // the carousel container has to be placed directly below the section div
  block.closest('.section.hero-tour-detail-container').prepend(carousel);

  // if there is more then one slide, add buttons and scroll events
  if (cfg.desktop.length > 1) {
    initCarousel(block);
  }

  // if there is no combo image
  if (comboImage === '') {
    const title = document.createRange().createContextualFragment(`
      <h1 class='title'>${tourName.split('\n').map((line) => `${line.trim()}<br>`).join('')}
        <span class='subtitle'>${Subtitle}</span>
      </h1>
    `);
    dom.querySelector('.product-name').append(title);
  } else {
    // with combo image
    const title = document.createRange().createContextualFragment(`
      <h1 class='combo-container'>
        <div class='combo-image-container'>
        </div>
        <p class='plus'>+</p>
        <div class='combo-title-container'>
          <p class='title'>
            ${tourName.split('\n').map((line) => `${line.trim()}<br>`).join('')}
            <span class='subtitle'>${Subtitle}</span>
          </p>
        </div>
      </h1>
    `);

    const picture = createOptimizedPicture(comboImage, comboName, true);
    title.querySelector('.combo-image-container').append(picture);

    dom.querySelector('.product-name').append(title);
  }

  block.textContent = '';
  decorateIcons(dom);
  block.append(dom);
}
