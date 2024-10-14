// GLOBALS
let commentFeed;
let blockedUsers = new Set();

// Classes & QS's
const mainCommentFeedQS = '.c-dhzjXW.c-dhzjXW-ikLJpvF-css';
const commentClass = 'c-dhzjXW-icSayFg-css';

const commentProfileQS = '.c-fvLHfv';
const commentUserInfoQS = '.c-dhzjXW-ijroWjL-css';

// Helpers
const getCommentUserId = (comment) => comment.querySelector(commentProfileQS).href.split('profile/')[1]
const hideElement = (element) => element.style += ';display: none !important;';
// const removeAllChildren = (parent) => {
//   while (parent.hasChildNodes()) 
//     parent.removeChild(parent.firstChild);
// };

const blockUser = (commentContainer) => {
  const userId = getCommentUserId(commentContainer);
  hideElement(commentContainer);

  // Block again in the future
  blockedUsers.add(userId);

  // Update list
  setChromeAttr("blocked-users", Array.from(blockedUsers));
  // console.log("New list of blocked users", blockedUsers);

  // delete any comments from this user already being shown:
  for (let comment of commentFeed.children) {
    parseComment(comment, userId);
  }
};

getChromeAttr("blocked-users", blockedUsers /* empty set */)
  .then(bU => {
    // console.log("Retrieved these users from storage", bU);
    // REVERT
    blockedUsers = new Set(bU);
  }).catch(console.error);

function parseComment(comment, hideUserID=null) {
  if (comment.tagName !== 'DIV'
  || !comment.classList.contains(commentClass)) return;

  if ((hideUserID && getCommentUserId(comment) === hideUserID)
  || blockedUsers.has(getCommentUserId(comment))) {
    // Comment is by a spammer
    hideElement(comment);
    return;
  } // else

  // Add block comment button
  // Look through comments to comments as well
  Array.from(comment.getElementsByClassName(commentClass)).forEach(parseComment);

  if (comment.firstElementChild.lastElementChild.firstElementChild.querySelector('.block-button')) return;  // Already added

  const button = document.createElement('button');
  button.classList.add('block-button');
  button.style.marginLeft = '10px';
  button.innerText = 'Block';
  comment.querySelector(commentUserInfoQS).appendChild(button);
  button.addEventListener('click', (e) => {
    let spamComment = e.target.parentElement.parentElement.parentElement.parentElement.parentElement;
    blockUser(spamComment);
  });
}

function main() {
  selectElementPersist(mainCommentFeedQS, { timeoutSeconds: 30 })
  .then(async feed => {
    commentFeed = feed;
    // Initial comments
    await thisNumSeconds(0.2);
    Array.from(feed.children).forEach(parseComment);

    // Dynamically loaded comments
    new MutationObserver(mutations => 
      mutations.forEach(mutation => 
        mutation.addedNodes.forEach(parseComment)
      )
    ).observe(feed, { childList: true, subtree: true });
  }); 
}


let currentUrl;
new MutationObserver(() => {
  const thisUrl = location.href;
  if (!thisUrl.includes('/event/') 
  || currentUrl === thisUrl) return;

  currentUrl = thisUrl;
  main();
}).observe(document.head, 
  { childList: true, subtree: true, characterData: true });
