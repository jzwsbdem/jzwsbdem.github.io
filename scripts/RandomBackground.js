const background = document.querySelector('.centerDecoration');
let decImages = [];
let mainImages = [];

async function loadImagesFromJSON() {
    try {
        const response = await fetch('datas/Background.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        decImages = data.decBackground || [];
        mainImages = data.mainBackground || [];
        return { decImages, mainImages };
    } catch (error) {
        decImages = [];
        mainImages = [];
        return { decImages, mainImages };
    }
}

function getRandomImage(imageArray) {
    if (imageArray.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * imageArray.length);
    return imageArray[randomIndex];
}

function setRandomDecBackground() {
    const randomImage = getRandomImage(decImages);
    if (randomImage) {
        background.style.backgroundImage = `url('${randomImage}')`;
    } else {
        background.style.backgroundImage = 'none';
    }
}

function setRandomMainBackground() {
    const randomImage = getRandomImage(mainImages);
    if (randomImage) {
        document.body.style.backgroundImage = `url('${randomImage}')`;
    } else {
        document.body.style.backgroundImage = 'none';
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    await loadImagesFromJSON();
    setRandomDecBackground();
    setRandomMainBackground();
});