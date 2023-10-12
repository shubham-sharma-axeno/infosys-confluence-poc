import { readBlockConfig, loadBlock } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  // get config entries
  const cfg = readBlockConfig(block);

  const category = cfg['tour-category'];
  const relatedPreTitle = cfg['related-pre-title'];
  const relatedTitle = cfg['related-title'];
  const subCategory = cfg['tour-sub-category'];
  const comboPreTitle = cfg['sub-category-pre-title'];
  const comboTitle = cfg['sub-category-title'];

  // create base DOM structure
  const dom = document.createRange().createContextualFragment(`
    <h2 class='related-title'>
      <span class='related-pre-title'>${relatedPreTitle}</span>
      ${relatedTitle}
    </h2>
    ${subCategory ? `<div class='combo-container'>
      <h2 class='combo-title'>
        <span class='combo-pre-title'>${comboPreTitle}</span>
        ${comboTitle}
      </h2>` : ''}
    </div>
  `);

  // if category is set, add the ticket-card-list block
  if (category) {
    const relatedToursBlock = document.createRange().createContextualFragment(`
      <div class='ticket-card-list related' data-block-name='ticket-card-list' >
        <div>
          <div>${category}</div>
        <div>
      </div>
    `);

    await loadBlock(relatedToursBlock.firstElementChild);
    dom.querySelector('.related-title').after(relatedToursBlock);
  }

  // if category is set, add the ticket-card-list block
  if (subCategory) {
    const relatedSubToursBlock = document.createRange().createContextualFragment(`
      <div class='ticket-card-list related sub' data-block-name='ticket-card-list' >
        <div>
          <div>${subCategory}</div>
        <div>
      </div>
    `);

    await loadBlock(relatedSubToursBlock.firstElementChild);
    dom.querySelector('.combo-title').after(relatedSubToursBlock);
  }

  block.textContent = '';
  block.append(dom);
}
