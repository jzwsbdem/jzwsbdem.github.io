const mainBG = [
    '/assets/images/background/1.jpg',
    '/assets/images/background/2.jpg',
    '/assets/images/background/3.jpg',
    '/assets/images/background/4.jpg',
    '/assets/images/background/5.jpg',
    '/assets/images/background/6.jpg',
    '/assets/images/background/7.jpg',
    '/assets/images/background/8.jpg',
    '/assets/images/background/9.jpg',
    '/assets/images/background/10.jpg',
];

function setRandomMainBG() {
    
    const randomIndex = Math.floor(Math.random() * mainBG.length);
    const selectedImage = mainBG[randomIndex];
    
    document.body.style.backgroundImage = "url('" + selectedImage + "')";
}

setRandomMainBG();
