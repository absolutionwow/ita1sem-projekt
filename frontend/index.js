/*addEventListener("DOMContentLoaded", () => {
    let partyCode = establishPartyCode();
    history.replaceState(null, '', partyCode);
    addEventListener('popstate', () => {
        partyCode = establishPartyCode();
    });
    pollForCurrentTrackAt(partyCode);
});

// Extract party code from browser's address field
// or make one up, if it doesn't have one
function establishPartyCode() {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/') && pathname.length > 1) {
        return pathname.substring(1);
    } else {
        return crypto.randomUUID().substring(0, 4);
    }
}

// Start polling loop, repeated asking server for the current track
async function pollForCurrentTrackAt(partyCode) {
    const path = `/api/party/${partyCode}/currentTrack`;
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`GET ${path} failed with ${response.status} ${response.statusText}`)
    }
    const track = await response.json();
    renderCurrentTrack(partyCode, track);
    setTimeout(() => pollForCurrentTrackAt(partyCode), 1000); // refresh every 1000ms
}*/

//image const for albums
const images = [
  "images/album1.jpg",
  "images/album2.jpg",
  "images/album3.jpg",
  "images/album4.jpg",
  "images/album5.jpg"
];

// update HTML to reflect party ID and current track
function renderCurrentTrack(partyId, track) {
    const contentDiv =
    document.getElementById('songTitle').textContent = track.title;
    document.getElementById('songArtist').textContent = track.artist;

    const imageDiv = document.querySelector('.songImage');
    const randomImage = images[Math.floor(Math.random() * images.length)];

    imageDiv.style.backgroundImage = `url(${randomImage})`;
}



// autoplayer
const playerDiv = document.querySelector(".player"); // single element
const songTitle = playerDiv.querySelector("#songTitle");
const songArtist = playerDiv.querySelector("#songArtist");
const currentTime = playerDiv.querySelector("#currentTime");
const barFill = playerDiv.querySelector("#barFill");
const duration = playerDiv.querySelector("#duration");

function handleTrackNotFound(){
    //todo show message to user
        const popup = document.getElementById("popup-message");
    popup.style.display = "block";

    isPlaying = false;
     //playBtn.textContent = "▶";
    playIcon.textContent = "play_arrow";
    // Hide it after 9 seconds
    setTimeout(() => {
        popup.style.display = "none";
    }, 9000);
};

async function pickNextTrack(){
    const filters = getSelectedFilter();
    //(URLSearchParams) convert an object of key-value pairs into a query string for a URL
    const query = new URLSearchParams(filters).toString();
    const path = `/api/nextTrackFromFilters?${query}`;
    console.log("Fetching next track with path: ", path);
    const response = await fetch(path);
    if (!response.ok) {
        if (response.status === 404) {
                // not found any tracks for the selected filters
                handleTrackNotFound();
                return null;
            }
        throw new Error(`GET ${path} failed with ${response.status} ${response.statusText}`);
    }
    console.log("Rendering response: ", response);
    const track = await response.json()
    console.log("Rendering track: ", track);
    renderPlayingSong(track);
    currentTrack = track;
    return track;
}

//gets the selected options and Create an object with parameter names and their selected values
function getSelectedFilter(){
    const selected = {};

    document.querySelectorAll('.buttons select').forEach(select => {
        selected[select.id] = select.value;
    });

    return selected;
}


// PLayer button 
let isPlaying = false;
const playBtn = document.getElementById("playBtn");
const playIcon = playBtn.querySelector("span");
playBtn.onclick = () => {
    if (!isPlaying) {
        //playBtn.textContent = "❚❚";
        console.log(playBtn);
        playIcon.textContent = "pause";
        isPlaying = true;
        playSong()

    } else {
        //playBtn.textContent = "▶";
        playIcon.textContent = "play_arrow";
        isPlaying = false;
    }
};

// PLayer button 
let prevSongList = [];
let currentTrack = null;
prevBtn.onclick = () => {
    if(prevSongList.length > 0){
        currentTrack = prevSongList.pop();
        renderPlayingSong(currentTrack);
    }
};

nextBtn.onclick = () => {
    prevSongList.push(currentTrack);
    pickNextTrack();
};

async function playSong(){
    if(currentTrack === null) {
       await pickNextTrack()
    };
    if(currentTrack !== null) {
        lastUpdateTime = performance.now();
        updateTime();
    };
}

let playTimeCurrent = 0;

let lastUpdateTime = null; // timestamp of last update

async function updateTime() {
    if (!isPlaying) return; // Stop if paused

    const now = performance.now(); // high-res timestamp in ms

    if (lastUpdateTime !== null) {
        const deltaSeconds = (now - lastUpdateTime) / 1000; // convert ms to seconds
        playTimeCurrent += deltaSeconds;
    }

    lastUpdateTime = now;
    // Calculate minutes and seconds
    const minutes = Math.floor(playTimeCurrent / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(playTimeCurrent % 60)
        .toString()
        .padStart(2, '0');

    // Update UI
    currentTime.textContent = `${minutes}:${seconds}`;

    renderProgressBar();
    if (playTimeCurrent >= currentTrack.length_sec) {
        // Song ended, pick next track
        playTimeCurrent = 0;
        await pickNextTrack();
        if (!isPlaying) return; // Stop if paused after picking next track
    }
    setTimeout(() => updateTime(), 1000); // refresh every 1000ms
}

function renderProgressBar(){
    //todo
    return;
}

const imageDiv = document.querySelector('.songImage');
function renderPlayingSong(track){
    console.log("Rendering track: ", track);
    songTitle.textContent = track.title;
    songArtist.textContent = track.artist;
    duration.textContent = `${Math.floor(track.length_sec/60)}:${(track.length_sec % 60).toString().padStart(2, '0')}`;
    
    const randomImage = images[Math.floor(Math.random() * images.length)];
    imageDiv.style.backgroundImage = `url(${randomImage})`;
    playTimeCurrent = 0;
}
