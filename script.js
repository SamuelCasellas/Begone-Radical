// const script = (function (paid=false) {

  // class ListNode {
  //   constructor(data) {
  //     this.data = data;
  //     this.next = null;
  //   }
  // }

  // class LinkedList {
  //   constructor(firstNodeData=null) {
  //     if (firstNodeData) {
  //       this.head = this.tail = new ListNode(firstNodeData);
  //       this.size = 1;
  //     } else {
  //       this.head = this.tail = null;
  //       this.size = 0;
  //     }
  //   }

  //   reset() {
  //     this.head = this.tail = null;
  //     this.size = 0;
  //   }

  //   addNode(nodeData) {
  //     /* Automatically kick off any old comments after 100 comments is reached.
  //     */
  //     let newNode = new ListNode(nodeData);
  //     if (!this.head) {
  //       this.head = this.tail = newNode;
  //       this.size++;
  //       return null;
  //     } else {
  //       let origTail = this.tail;
  //       this.tail = newNode;
  //       origTail.next = newNode;
  //       if (this.size > 199) {
  //         let origHead = this.head;
  //         this.head = this.head.next;
  //         return origHead;
  //       } else {
  //         this.size++;
  //         return null;
  //       }
  //     }
  //   }
  // }

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
    .then(feed => {
      commentFeed = feed;
      // Initial comments
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
  if (!location.href.includes('/event/') 
  || location.href === currentUrl) return;

  currentUrl = location.href;
  main();
}).observe(document.head, 
  { childList: true, subtree: true, characterData: true });


// Monetize later
//   getChromeAttr("authenticated").then(result => {
//     if (result.authenticated) {
//       chrome.storage.sync.get(["paid"], function(result1) {
//         result1.paid
//         ? script(true)
//         : script();
//       });
//     }
//   });
// });
