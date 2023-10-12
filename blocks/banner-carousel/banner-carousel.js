import { bindSwipeToElement } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

function nextElement(el, selector) {
  if (selector) {
    const next = el.nextElementSibling;
    if (next && next.matches(selector)) {
      return next;
    }
    return undefined;
  }
  return el.nextElementSibling;
}

function previousElement(el, selector) {
  if (selector) {
    const prev = el.previousElementSibling;
    if (prev && prev.matches(selector)) {
      return prev;
    }
    return undefined;
  }
  return el.previousElementSibling;
}

function slideNext(block, slides, slidesNo, pagination) {
  const width = block.offsetWidth;
  let margin = slides.offsetLeft;
  if (margin <= width * (slidesNo - 1) * -1) {
    margin = 0;
  } else {
    margin -= width;
  }
  slides.style.marginLeft = `${margin}px`;

  // change active indicator
  const activeItem = pagination.querySelector('.active');
  activeItem.classList.remove('active');
  const nextItem = nextElement(activeItem, '.indicator');
  if (nextItem) {
    nextItem.classList.add('active');
  } else {
    pagination.firstElementChild.classList.add('active');
  }
  activeItem.getAttribute('data-slide');
}

function marginRecalc(block, slides, pagination) {
  const activeItem = pagination.querySelector('.active');
  const activeSlideNo = activeItem.getAttribute('data-slide');
  const width = block.offsetWidth;
  const margin = width * (activeSlideNo - 1) * -1;
  slides.style.marginLeft = `${margin}px`;
}

function slidePrev(block, slides, slidesNo, pagination) {
  const width = block.offsetWidth;
  let margin = slides.offsetLeft;
  if (margin === 0) {
    margin = width * (slidesNo - 1) * -1;
  } else {
    margin += width;
  }
  slides.style.marginLeft = `${margin}px`;

  // change active indicator
  const activeItem = pagination.querySelector('.active');
  activeItem.classList.remove('active');
  const prevItem = previousElement(activeItem, '.indicator');
  if (prevItem) {
    prevItem.classList.add('active');
  } else {
    pagination.lastElementChild.classList.add('active');
  }
  activeItem.getAttribute('data-slide');
}

function SliderTimer(fn, t) {
  let timerObj = setInterval(fn, t);

  this.stop = () => {
    if (timerObj) {
      clearInterval(timerObj);
      timerObj = null;
    }
    return this;
  };

  // start timer using current settings (if it's not already running)
  this.start = () => {
    if (!timerObj) {
      this.stop();
      timerObj = setInterval(fn, t);
    }
    return this;
  };

  // start with new or original interval, stop current interval
  this.reset = (newT = t) => {
    this.t = newT;
    return this.stop()
      .start();
  };
}

function initializeScroll(block, slidesNo) {
  const prevBTN = block.querySelector('.control-container .prev');
  const slides = block.querySelector(':scope > div:first-child');
  const nextBTN = block.querySelector('.control-container .next');
  const pagination = block.querySelector('.control-container .image-pagination');
  if (slidesNo > 1) {
    // automatic slide every 5secs
    const timer = new SliderTimer(() => {
      slideNext(block, slides, slidesNo, pagination);
    }, 5000);
    nextBTN.classList.remove('hide');
    prevBTN.classList.remove('hide');
    // next/prev buttons initialization
    nextBTN.addEventListener('click', () => {
      slideNext(block, slides, slidesNo, pagination);
      timer.reset(5000);
    });

    prevBTN.addEventListener('click', () => {
      slidePrev(block, slides, slidesNo, pagination);
      timer.reset();
    });

    // swipe events initialization
    bindSwipeToElement(block);
    block.addEventListener('swipe-RTL', () => {
      slideNext(block, slides, slidesNo, pagination);
      timer.reset();
    });
    block.addEventListener('swipe-LTR', () => {
      slidePrev(block, slides, slidesNo, pagination);
      timer.reset();
    });
  }
  // window resize
  window.addEventListener('resize', () => {
    marginRecalc(block, slides, pagination);
  });
}

export default function decorate(block) {
  const cols = [...block.children];
  let entries = '';
  // create carousel section
  const carousel = document.createElement('div');
  cols.forEach((slide, index) => {
    const bannerPic = slide.querySelector('picture');
    const bannerImg = bannerPic.querySelector('img');
    const optimizedPic = createOptimizedPicture(bannerImg.src, bannerImg.alt, false, [{ media: '(min-width: 600px)', width: '2000' }, { width: '1200' }]);
    slide.prepend(optimizedPic);
    bannerPic.remove();
    slide.classList.add('carousel-slide');
    slide.lastElementChild.classList.add('text-container');
    carousel.append(slide);
    entries += `<div data-slide="${index + 1}" class="indicator ${index === 0 ? 'active' : ''}"></div>`;
  });
  // create indicators section
  const indicatorsHTML = `
<div class="control-container">
    <div class="prev hide">&#10094</div>
    <div class="image-pagination">
      ${entries}
    </div>
    <div class="next hide">&#10095</div>
  </div>`;
  block.innerHTML = carousel.outerHTML + indicatorsHTML;
  initializeScroll(block, cols.length);
}

function buildBannerWithHeadingAndText(main){
    const h2 = main.querySelector('h2');
    const p = main.querySelector('p');

}