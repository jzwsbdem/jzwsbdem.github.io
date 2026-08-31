const mainBG = [
    '../images/background/1.jpg',
    '../images/background/2.jpg',
    '../images/background/3.jpg',
    '../images/background/4.jpg',
    '../images/background/5.jpg',
    '../images/background/6.jpg',
    '../images/background/7.jpg',
    '../images/background/8.jpg',
    '../images/background/9.jpg',
    '../images/background/10.jpg',
];

function setRandomMainBG() {
    
    const randomIndex = Math.floor(Math.random() * mainBG.length);
    const selectedImage = mainBG[randomIndex];
    
    document.body.style.backgroundImage = "url('" + selectedImage + "')";
}

setRandomMainBG();
