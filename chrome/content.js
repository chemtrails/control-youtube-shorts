const observer = new MutationObserver(onMutations),
    container = document.createElement('div'),
    timeSlider = document.createElement('input'),
    volumeSlider = document.createElement('input');

let currentVideo = null,
    volume = 0.7,
    attached = false,
    playAfterSeek = false,
    observing = false;

container.id = '__yt-controls-extension-container__';
timeSlider.id = '__yt-controls-extension-time-slider__';
volumeSlider.id = '__yt-controls-extension-volume-slider__';

timeSlider.classList.add('__yt-controls-extension-input__');
volumeSlider.classList.add('__yt-controls-extension-input__');

timeSlider.type = volumeSlider.type = 'range';

timeSlider.min = 0;
timeSlider.max = 100;
timeSlider.step = 0.01;
timeSlider.value = 0;

volumeSlider.min = 0;
volumeSlider.max = 1;
volumeSlider.step = 0.01;
volumeSlider.value = volume;

container.append(timeSlider);
container.append(volumeSlider);

chrome.storage.local.get('volume').then(settings => {
    if (settings.volume) {
        volume = settings.volume;
        volumeSlider.value = volume;
    }
});

observer.observe(document.body, { childList: true, subtree: true });
observing = true;
window.addEventListener('transitioncancel', onTransition);

timeSlider.addEventListener('mousedown', () => {
    if (currentVideo.paused === false) playAfterSeek = true;
    currentVideo.pause();
});

timeSlider.addEventListener('input', () => {
    const t = currentVideo.duration * (parseFloat(timeSlider.value) / 100);
    currentVideo.currentTime = t <= currentVideo.duration ? t : 0;
});

timeSlider.addEventListener('change', () => {
    if (playAfterSeek === true) currentVideo.play();
    currentVideo.focus();
    playAfterSeek = false;
});

volumeSlider.addEventListener('input', () => {
    volume = volumeSlider.value;
    currentVideo.volume = volume;
});

volumeSlider.addEventListener('change', async () => {
    chrome.storage.local.set({ volume: volumeSlider.value });
    currentVideo.focus();
});

function attach() {
    currentVideo.volume = volume;
    currentVideo.addEventListener('loadedmetadata', () => currentVideo.volume = volume);
    currentVideo.addEventListener('canplay', () => currentVideo.volume = volume);
    currentVideo.addEventListener('play', () => currentVideo.volume = volume);

    currentVideo.addEventListener('timeupdate', () => {
        timeSlider.value = (currentVideo.currentTime / currentVideo.duration) * 100;
    });

    document.addEventListener('keydown', e => {
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.id === 'contenteditable-root') return;

        if (e.key === 'ArrowRight') {
            const t = currentVideo.currentTime + (currentVideo.duration / 50);
            currentVideo.currentTime = t <= currentVideo.duration ? t : 0;
        }

        else if (e.key === 'ArrowLeft') currentVideo.currentTime -= currentVideo.duration / 50;
    });
}

function onTransition(e) {
    if (e.target.id !== 'progress') return;
    const videoId = history.state?.endpoint?.reelWatchEndpoint?.videoId;

    if (videoId === undefined && observing === true) {
        observer.disconnect();
        observing = false;
    } else if (videoId !== undefined && observing === false) {
        observer.observe(document.body, { childList: true, subtree: true });
        observing = true;
    }
}

function onMutations() {
    const video = document.querySelector('div#shorts-player > div.html5-video-container > video');

    if (video && currentVideo !== video) {
        currentVideo = video;
        attach();
    }

    else if (currentVideo) currentVideo.volume = volume;

    if (attached === false) {
        const shortsContainer = document.querySelector('#shorts-container');

        if (shortsContainer !== null) {
            shortsContainer.append(container);
            attached = true;
        }
    }
}