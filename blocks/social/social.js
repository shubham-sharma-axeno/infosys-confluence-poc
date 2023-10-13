<script async="" src="https://www.tintup.com/app/dist/embedded.js"></script>

// Create the main container div
const tintupContainer = document.createElement('div');
tintupContainer.classList.add('tintup');
tintupContainer.setAttribute('data-id', 'infosys_confluence_americas_2023');
tintupContainer.setAttribute('data-columns', '');
tintupContainer.setAttribute('data-expand', 'true');
tintupContainer.setAttribute('data-count', '4');
tintupContainer.setAttribute('data-paginate', 'true');
tintupContainer.setAttribute('data-personalization-id', '1044003');
tintupContainer.style.height = '931px';
tintupContainer.style.width = '100%';
tintupContainer.style.position = 'relative';
tintupContainer.setAttribute('data-finishedloadingmoreposts', 'true');

// Create the script element
const scriptElement = document.createElement('script');
scriptElement.setAttribute('src', 'https://cdn.hypemarks.com/pages/a5b5e5.js');
scriptElement.classList.add('optanon-category-C0003-C0004');

// Create the inner container div
const innerContainer = document.createElement('div');
innerContainer.classList.add('a5b5e4-inner');
innerContainer.style.height = '100%';
innerContainer.style.width = '100%';
innerContainer.style.overflow = 'hidden';

// Create the iframe element
const iframeElement = document.createElement('iframe');
iframeElement.setAttribute('src', 'https://cdn.hypemarks.com/t/infosys_confluence_americas_2023?width=1140&expand=true&paginate=true&count=4&personalization_id=1044003');
iframeElement.style.border = 'none';
iframeElement.style.height = '100%';
iframeElement.style.width = '100%';
iframeElement.setAttribute('scrolling', 'yes');
iframeElement.setAttribute('frameborder', '0');
iframeElement.setAttribute('allowtransparency', 'true');
iframeElement.setAttribute('title', 'Social Feed');

// Append the elements to the DOM hierarchy
innerContainer.appendChild(iframeElement);
tintupContainer.appendChild(scriptElement);
tintupContainer.appendChild(innerContainer);

// Append the main container to the document's body or any desired location
document.body.appendChild(tintupContainer);