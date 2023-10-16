export default async function decorate(block) {
    // Create the <a> element
    const twitterLink = document.createElement('a');
    twitterLink.classList.add('twitter-timeline');
    twitterLink.setAttribute('data-width', '1000');
    twitterLink.setAttribute('data-height', '600');
    twitterLink.setAttribute('data-chrome', 'noheader nofooter');
    twitterLink.setAttribute('data-tweet-limit', '4');
    twitterLink.setAttribute('href', 'https://twitter.com/Infosys?ref_src=twsrc%5Etfw');
    twitterLink.textContent = 'Tweets by Infosys';

    // Create the <script> element
    const twitterScript = document.createElement('script');
    twitterScript.setAttribute('async', '');
    twitterScript.setAttribute('src', 'https://platform.twitter.com/widgets.js');
    twitterScript.setAttribute('charset', 'utf-8');

    // Append the elements to the document body
    block.appendChild(twitterLink);
    block.appendChild(twitterScript);
}