import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, fetchTours } from '../../scripts/scripts.js';

export default async function decorate(block) {
  // get tour category
  const tourCategory = block.children[0].children[0].textContent.trim().toLowerCase();

  // get the tours for the selected category
  const selectedTours = (await fetchTours()).filter((tour) => {
    // get list of assigned categories for a tour
    const categories = tour.Categories.split(',').map((categoryEntry) => categoryEntry.trim());
    // check if category matches and we are not on tour page itself
    return categories.includes(tourCategory) && tour['Detail Page'] !== document.location.pathname;
  });

  // if no tours are found
  if (selectedTours.length === 0) return;

  // get placeholders (non-existing values are undefined)
  const placeholders = await fetchLanguagePlaceholders();
  const {
    itIncludes = 'Incluye',
    moreInformation = 'Más información',
    from = 'desde',
  } = placeholders;

  // start ul list
  const ul = document.createElement('ul');

  // go through list of tours (non-existing values are always '')
  selectedTours.forEach((tour) => {
    // extract tour info
    const {
      Description,
      Price,
      Subtitle,
    } = tour;
    const oldPrice = tour['Old Price'];
    const descriptionTitle = tour['Description Title'];
    const tourName = tour['Tour Name'];
    const priceSubtitle = tour['Price Subtitle'];
    const buyLink = tour['Buy Link'];
    const detailPage = tour['Detail Page'];
    const ticketLabel = tour['Ticket Label'];
    const buttonText = tour['Button Text'];
    const comboImage = tour['Combo Image'];
    const comboName = tour['Combo Name'];

    // recover the bullet list
    const ticketText = tour['Ticket Text'].split('\n').map((liContent) => `<li>${liContent.trim()}</li>`);

    const classes = block.classList;

    // if any ticket card is rendered inside hero
    if (classes.contains('hero')) {
      // all tickets in hero have a schema beforehand
      const ticketSchema = document.createRange().createContextualFragment(`
        <script type='application/ld+json'>
          {
            "@context":"https://www.schema.org",
            "category":"tickets",
            "description":"${descriptionTitle}\\n${Description}",
            "@type":"Product",
            "offers":{
              "price":"${Price}",
              "@type":"Offer",
              "priceCurrency":"EURO",
              "seller":{
                "@type":"Organization",
                "name":"Real Madrid C.F."
              }
            },
            "name":"${tourName} ${Subtitle}",
            "brand":"${Subtitle}",
            "url":"https://www.realmadrid.com${detailPage}"
          }
        </script>
      `);

      ul.append(ticketSchema);
    }

    // if its rendered as a sub category (combo) in the tour hero block
    if (classes.contains('hero') && classes.contains('sub')) {
      // the ticket card DOM for sub categories
      const ticketCard = document.createRange().createContextualFragment(`
      <li>
        <div class='ticket-type'>
          ${ticketLabel ? `<span class='label'>${ticketLabel}</span>` : ''}
          <div class='title'>${tourName.split('\n').map((line) => `${line.trim()}<br>`).join('')}</div>
          <div class='subtitle'>${Subtitle}</div>
        </div>
        <div class='info-buy'>
          <a href='${buyLink}' target='_blank' >${buttonText}</a>
          <p class='price'>
            ${from}${oldPrice ? `&nbsp<del>${oldPrice}€</del>` : ''}
            <span class='amount'>${Price}</span>
            <span class='currency'>€</span>
            ${priceSubtitle ? `<span class='subtitle'>${priceSubtitle}</span>` : ''}
          </p>
        </div>
        <a href='${detailPage}' class='info-link'>${moreInformation}</a>
      </li>
      `);

      // add optimized version for combo image
      if (comboImage) {
        // the + character
        const plus = document.createElement('p');
        plus.classList.add('plus');
        plus.innerText = '+';
        ticketCard.firstElementChild.prepend(plus);
        // the optimized combo image
        const picture = createOptimizedPicture(comboImage, comboName, false, [{ width: '300' }]);
        ticketCard.firstElementChild.prepend(picture);
        picture.querySelector('img').classList.add('sub-cat-image');
      }

      ul.append(ticketCard);
    }

    // if its rendered as a sub category (combo) in the related block
    if (classes.contains('related') && classes.contains('sub')) {
      // the ticket card DOM for sub categories
      const ticketCard = document.createRange().createContextualFragment(`
      <li>
        <a href='${buyLink}' class='buy-button' target='_blank' >${buttonText}</a>
        <a href='${detailPage}' class='info-link'>${moreInformation}</a>
      </li>
      `);

      // add optimized version for combo image
      if (comboImage) {
        const picture = createOptimizedPicture(comboImage, comboName, false, [{ width: '300' }]);
        ticketCard.firstElementChild.prepend(picture);
        picture.querySelector('img').classList.add('sub-cat-image');
      }
      ul.append(ticketCard);
    }

    // the default ticket card DOM for main category tickets);
    if ((classes.contains('related') || classes.contains('hero')) && !classes.contains('sub')) {
      const ticketCard = document.createRange().createContextualFragment(`
      <li>
        <div class='ticket-type'>
          ${ticketLabel ? `<span class='label'>${ticketLabel}</span>` : ''}
          <div class='title'>${tourName.split('\n').map((line) => `${line.trim()}<br>`).join('')}</div>
          <div class='subtitle'>${Subtitle}</div>
        </div>
        <div class='info-buy'>
          <div class='price'>
            <p>
            ${from}${oldPrice ? `&nbsp<del>${oldPrice}€</del>` : ''}
            <span class='amount'>${Price}</span>
            <span class='currency'>€</span>
            ${priceSubtitle ? `<span class='subtitle'>${priceSubtitle}</span>` : ''}
            </p>
          </div>
          <div class='buy-button'>
            <a href='${buyLink}' target='_blank' rel='noreferrer'>${buttonText}</a>
          </div>
        </div>
        <div class='ticket-detail'>
          <div class='content'>
            <p>${itIncludes}:</p>
            ${ticketText ? `<ul>${ticketText.join('')}</ul>` : ''}
          </div>
        </div>
        <a href='${detailPage}' class='info-link'>${moreInformation}</a>
      </li>
      `);

      ul.append(ticketCard);
    }

    block.textContent = '';
    block.append(ul);
  });
}
