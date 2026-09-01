const decBG = [
    '/assets/images/decoration/background/1.gif',
    '/assets/images/decoration/background/2.gif',
    '/assets/images/decoration/background/3.gif',
    '/assets/images/decoration/background/4.gif',
    '/assets/images/decoration/background/5.gif',
    '/assets/images/decoration/background/6.gif',
    '/assets/images/decoration/background/7.gif',
    '/assets/images/decoration/background/8.gif',
    '/assets/images/decoration/background/9.gif',
    '/assets/images/decoration/background/10.gif',
    '/assets/images/decoration/background/11.gif',
    '/assets/images/decoration/background/12.gif',
    '/assets/images/decoration/background/13.gif',
    '/assets/images/decoration/background/14.gif',
    '/assets/images/decoration/background/15.gif',
    '/assets/images/decoration/background/16.gif',
    '/assets/images/decoration/background/17.gif',
    '/assets/images/decoration/background/18.gif',
    '/assets/images/decoration/background/19.gif',
    '/assets/images/decoration/background/20.gif',
];

const background = document.querySelector('.centerDecoration');

function getRandomImage() {
    const randomIndex = Math.floor(Math.random() * decBG.length);
    return decBG[randomIndex];
}

function setRandomDecBG() {
    const randomImage = getRandomImage();
    background.style.backgroundImage = `url('${randomImage}')`;
}

window.addEventListener('DOMContentLoaded', setRandomDecBG);