const decBG = [
    '././images/decoration/background/1.gif',
    '././images/decoration/background/2.gif',
    '././images/decoration/background/3.gif',
    '././images/decoration/background/4.gif',
    '././images/decoration/background/5.gif',
    '././images/decoration/background/6.gif',
    '././images/decoration/background/7.gif',
    '././images/decoration/background/8.gif',
    '././images/decoration/background/9.gif',
    '././images/decoration/background/10.gif',
    '././images/decoration/background/11.gif',
    '././images/decoration/background/12.gif',
    '././images/decoration/background/13.gif',
    '././images/decoration/background/14.gif',
    '././images/decoration/background/15.gif',
    '././images/decoration/background/16.gif',
    '././images/decoration/background/17.gif',
    '././images/decoration/background/18.gif',
    '././images/decoration/background/19.gif',
    '././images/decoration/background/20.gif',
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