const slider = document.getElementById('rowHeightSlider');
const display = document.getElementById('heightDisplay');

function updateSlider() {
    const val = parseInt(slider.value);
    const min = parseInt(slider.min);
    const max = parseInt(slider.max);
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #7300df 0%, #7300df ${percent}%, #d0d7de ${percent}%, #d0d7de 100%)`;
    display.textContent = val;
}

slider.addEventListener('input', updateSlider);
updateSlider();