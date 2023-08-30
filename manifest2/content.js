// location.href.match(/www.youtube.com\/shorts\/[A-Za-z0-9_-]{11}/) !== null

const container = document.createElement('div')
const timeSlider = document.createElement('input')
const volumeSlider = document.createElement('input')

let paused = true
let volume
let interval
let shortsContainer
let video
let observer

main()

async function main() {
    interval = setInterval(waitForVideo, 300)
}

async function attachControls() {
    const settings = await browser.storage.local.get('volume')
    volume = settings.volume ? settings.volume : 0.7

    container.id = 'yt-controls-extension-container'
    timeSlider.id = 'yt-controls-extension-time-slider'
    volumeSlider.id = 'yt-controls-extension-volume-slider'

    timeSlider.type = 'range'
    volumeSlider.type = 'range'

    shortsContainer.append(container)
    container.append(timeSlider)
    container.append(volumeSlider)

    timeSlider.min = 0
    volumeSlider.min = 0

    timeSlider.max = 100
    volumeSlider.max = 1
    
    volumeSlider.step = 0.01
    
    timeSlider.value = 0
    volumeSlider.value = volume

    video.volume = volume

    observer = new MutationObserver(onVideoChange)
    observer.observe(video, {attributeFilter: ['src']})

    volumeSlider.addEventListener('input', async () => {
        volume = volumeSlider.value
        video.volume = volumeSlider.value
        await browser.storage.local.set({volume: volumeSlider.value})
    })

    timeSlider.addEventListener('input', () => {
        video.currentTime = video.duration * (timeSlider.value / 100)
    })

    video.addEventListener('timeupdate', () => {
        timeSlider.value = (video.currentTime / video.duration) * 100
    })

    video.addEventListener('canplay', () => video.volume = volume)
    video.addEventListener('play', () => paused = false)
    video.addEventListener('pause', () => paused = true)
    volumeSlider.addEventListener('mouseup', () => video.focus())

    timeSlider.addEventListener('mouseup', () => {
        if (paused === false) video.play()
        video.focus()
    })

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') video.currentTime += video.duration / 10
        else if (e.key === 'ArrowLeft') video.currentTime -= video.duration / 10
    })
}

async function waitForVideo() {
    shortsContainer = document.getElementById('shorts-container')
    video = document.querySelector('video.video-stream.html5-main-video')
    
    if (video !== null && shortsContainer !== null) {
        clearInterval(interval)
        await attachControls()
    }
}

function onVideoChange(muts) {
    if (muts[0].target.src === '') {
        detachControls()
        return
    }
}

function detachControls() {
    container.remove()
}