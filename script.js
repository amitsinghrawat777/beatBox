// DOM SELECTION
const audio = document.getElementById('audio');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const playBtn = document.getElementById('play');
const playLargeBtn = document.getElementById('playLarge');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const likeBtn = document.getElementById('like');
const playerLikeBtn = document.getElementById('playerLike');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const timestampEl = document.getElementById('timestamp');
const durationEl = document.getElementById('duration');
const playlistEl = document.getElementById('playlist');
const albumArt = document.getElementById('albumArt');
const playerAlbumArt = document.getElementById('playerAlbumArt');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const volumeBar = document.querySelector('.volume-bar');
const volumeBtn = document.querySelector('.volume-control .player-action-btn');
const shuffleBtn = document.querySelector('.shuffle-btn');
const repeatBtn = document.querySelector('.repeat-btn');

// STATE VARIABLES
let songs = [];
let songIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0: off, 1: repeat all, 2: repeat one
let originalPlaylist = [];
let previousVolume = 100;

// FUNCTIONS

// Load song details into DOM
function loadSong(song) {
    titleEl.textContent = song.title;
    artistEl.textContent = song.artist;
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    audio.src = song.src;
    albumArt.src = song.image;
    playerAlbumArt.src = song.image;
    checkIfLiked(song.title);
}

// Play Song
function playSong() {
    isPlaying = true;
    audio.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    playLargeBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

// Pause Song
function pauseSong() {
    isPlaying = false;
    audio.pause();
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    playLargeBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
}

// Previous Song
function prevSong() {
    songIndex--;
    if (songIndex < 0) songIndex = songs.length - 1;
    loadSong(songs[songIndex]);
    playSong();
    updatePlaylistUI();
}

// Next Song
function nextSong() {
    if (repeatMode === 2) {
        // Repeat one - replay current song
        audio.currentTime = 0;
        playSong();
        return;
    }
    
    songIndex++;
    if (songIndex > songs.length - 1) {
        if (repeatMode === 1) {
            // Repeat all - go back to start
            songIndex = 0;
        } else {
            // Stop at end
            songIndex = songs.length - 1;
            pauseSong();
            return;
        }
    }
    loadSong(songs[songIndex]);
    playSong();
    updatePlaylistUI();
}

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Update Progress Bar
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (!duration) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progress.value = progressPercent;
    progressFill.style.width = `${progressPercent}%`;
    
    // Update CSS variable for progress indicator
    const progressBar = progress.closest('.progress-bar');
    if (progressBar) {
        progressBar.style.setProperty('--progress-position', `${progressPercent}%`);
    }
    
    timestampEl.textContent = formatTime(currentTime);
}

// Update duration when metadata loads
function updateDuration() {
    const duration = audio.duration;
    durationEl.textContent = formatTime(duration);
}

// Set Progress on Click
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

// Handle LocalStorage (Favorites)
function toggleLike() {
    const currentSong = songs[songIndex].title;
    let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

    if (likedSongs.includes(currentSong)) {
        // Remove from likes
        likedSongs = likedSongs.filter(s => s !== currentSong);
        likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        likeBtn.classList.remove('liked');
        playerLikeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        playerLikeBtn.classList.remove('liked');
    } else {
        // Add to likes
        likedSongs.push(currentSong);
        likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        likeBtn.classList.add('liked');
        playerLikeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        playerLikeBtn.classList.add('liked');
    }

    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
}

function checkIfLiked(title) {
    const likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
    if (likedSongs.includes(title)) {
        likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        likeBtn.classList.add('liked');
        playerLikeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        playerLikeBtn.classList.add('liked');
    } else {
        likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        likeBtn.classList.remove('liked');
        playerLikeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        playerLikeBtn.classList.remove('liked');
    }
}

// Shuffle playlist
function toggleShuffle() {
    isShuffle = !isShuffle;
    
    if (isShuffle) {
        shuffleBtn.classList.add('active');
        shuffleBtn.style.color = '#1db954';
        showToast('Shuffle is on');
        // Save current song and shuffle
        const currentSong = songs[songIndex];
        originalPlaylist = [...songs];
        
        // Fisher-Yates shuffle
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        
        // Find current song in shuffled array
        songIndex = songs.findIndex(song => song.title === currentSong.title);
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.style.color = '#b3b3b3';
        showToast('Shuffle is off');
        // Restore original playlist
        const currentSong = songs[songIndex];
        songs = [...originalPlaylist];
        songIndex = songs.findIndex(song => song.title === currentSong.title);
    }
    
    renderPlaylist();
}

// Toggle repeat mode
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    
    if (repeatMode === 0) {
        // Off
        repeatBtn.classList.remove('active');
        repeatBtn.style.color = '#b3b3b3';
        repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
        showToast('Repeat is off');
    } else if (repeatMode === 1) {
        // Repeat all
        repeatBtn.classList.add('active');
        repeatBtn.style.color = '#1db954';
        repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
        showToast('Repeat all');
    } else {
        // Repeat one
        repeatBtn.classList.add('active');
        repeatBtn.style.color = '#1db954';
        repeatBtn.innerHTML = '<i class="fa-solid fa-repeat"></i><span style="position:absolute;font-size:10px;bottom:8px;">1</span>';
        showToast('Repeat one song');
    }
}

// Volume Control
function updateVolume() {
    const volume = volumeBar.value / 100;
    audio.volume = volume;
    updateVolumeIcon(volume);
}

function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    } else if (volume < 0.5) {
        volumeBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
    } else {
        volumeBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    }
}

function toggleMute() {
    if (audio.volume > 0) {
        previousVolume = volumeBar.value;
        volumeBar.value = 0;
        audio.volume = 0;
        updateVolumeIcon(0);
        showToast('Muted');
    } else {
        volumeBar.value = previousVolume;
        audio.volume = previousVolume / 100;
        updateVolumeIcon(audio.volume);
        showToast('Unmuted');
    }
}

// Generate Playlist UI
function renderPlaylist() {
    playlistEl.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.setAttribute('data-index', index + 1);
        
        const trackTitle = document.createElement('span');
        trackTitle.className = 'track-title';
        trackTitle.textContent = song.title;
        
        const trackAlbum = document.createElement('span');
        trackAlbum.className = 'track-album';
        trackAlbum.textContent = song.artist;
        
        const trackDuration = document.createElement('span');
        trackDuration.className = 'track-duration';
        trackDuration.textContent = '3:45';
        
        li.appendChild(trackTitle);
        li.appendChild(trackAlbum);
        li.appendChild(trackDuration);
        
        li.addEventListener('click', () => {
            songIndex = index;
            loadSong(songs[songIndex]);
            playSong();
            updatePlaylistUI();
        });

        playlistEl.appendChild(li);
    });
    updatePlaylistUI();
}

function updatePlaylistUI() {
    const items = playlistEl.querySelectorAll('li');
    items.forEach((item, index) => {
        if (index === songIndex) item.classList.add('active-song');
        else item.classList.remove('active-song');
    });
}

// Update greeting based on time of day
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.querySelector('.greeting');
    
    if (hour < 12) {
        greetingEl.textContent = 'Good morning';
    } else if (hour < 18) {
        greetingEl.textContent = 'Good afternoon';
    } else {
        greetingEl.textContent = 'Good evening';
    }
}

// Keyboard shortcuts
function handleKeyboard(e) {
    // Prevent default if input/textarea is focused
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            isPlaying ? pauseSong() : playSong();
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (e.shiftKey) {
                // Skip forward 10 seconds
                audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
            } else {
                nextSong();
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (e.shiftKey) {
                // Skip backward 10 seconds
                audio.currentTime = Math.max(audio.currentTime - 10, 0);
            } else {
                prevSong();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            volumeBar.value = Math.min(parseInt(volumeBar.value) + 10, 100);
            updateVolume();
            break;
        case 'ArrowDown':
            e.preventDefault();
            volumeBar.value = Math.max(parseInt(volumeBar.value) - 10, 0);
            updateVolume();
            break;
        case 'KeyM':
            e.preventDefault();
            toggleMute();
            break;
        case 'KeyL':
            e.preventDefault();
            toggleLike();
            break;
        case 'KeyS':
            e.preventDefault();
            toggleShuffle();
            break;
        case 'KeyR':
            e.preventDefault();
            toggleRepeat();
            break;
    }
}

// Save and restore player state
function savePlayerState() {
    const state = {
        songIndex,
        currentTime: audio.currentTime,
        volume: volumeBar.value,
        isShuffle,
        repeatMode
    };
    localStorage.setItem('playerState', JSON.stringify(state));
}

function restorePlayerState() {
    const state = JSON.parse(localStorage.getItem('playerState'));
    if (state && songs.length > 0) {
        songIndex = Math.min(state.songIndex || 0, songs.length - 1);
        volumeBar.value = state.volume || 100;
        updateVolume();
        
        if (state.isShuffle) {
            isShuffle = false;
            toggleShuffle();
        }
        
        repeatMode = (state.repeatMode || 0) - 1;
        if (repeatMode < 0) repeatMode = 2;
        toggleRepeat();
        
        loadSong(songs[songIndex]);
        if (state.currentTime) {
            audio.addEventListener('loadedmetadata', () => {
                audio.currentTime = state.currentTime;
            }, { once: true });
        }
    }
}

// Auto-save state periodically
setInterval(savePlayerState, 5000);

// Show toast notification
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// EVENT LISTENERS
playBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));
playLargeBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateDuration);
audio.addEventListener('ended', nextSong);
progress.addEventListener('click', setProgress);
likeBtn.addEventListener('click', toggleLike);
playerLikeBtn.addEventListener('click', toggleLike);
volumeBar.addEventListener('input', updateVolume);
volumeBtn.addEventListener('click', toggleMute);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', toggleRepeat);
document.addEventListener('keydown', handleKeyboard);

// Quick play card listeners
document.querySelectorAll('.quick-play-card, .music-card').forEach(card => {
    const playBtnCard = card.querySelector('.card-play-btn');
    if (playBtnCard) {
        playBtnCard.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isPlaying) {
                playSong();
            } else {
                pauseSong();
            }
        });
    }
});

// Fetch songs from API and initialize
async function init() {
    try {
        console.log('Fetching songs from API...');
        const response = await fetch('https://api.npoint.io/01390d22195472fa19e2');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data || !data.songs || !Array.isArray(data.songs)) {
            throw new Error('Invalid data format from API');
        }
        
        songs = data.songs;
        originalPlaylist = [...songs];
        
        console.log(`Loaded ${songs.length} songs`);
        
        if (songs.length > 0) {
            updateGreeting();
            restorePlayerState();
            renderPlaylist();
            console.log('App initialized successfully');
        } else {
            throw new Error('No songs in the playlist');
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        showToast('Error loading songs. Using demo mode.');
        
        // Fallback to demo data if API fails
        songs = [{
            title: 'Demo Song',
            artist: 'Demo Artist',
            src: '',
            image: 'https://via.placeholder.com/400'
        }];
        originalPlaylist = [...songs];
        loadSong(songs[0]);
        renderPlaylist();
        updateGreeting();
    }
}

// Initialize the app
init();

// Save state before page unload
window.addEventListener('beforeunload', savePlayerState);
